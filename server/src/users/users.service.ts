import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async createUser(body: { firstName: string; lastName: string; email: string; roleCode?: string }) {
    const { firstName, lastName, email, roleCode } = body;
    let user = await this.prisma.user.findUnique({ where: { email }, include: { account: true } }).catch(() => null as any);
    if (!user) {
      // Try to look up a role by code/name if provided
      let roleConnect: any = undefined;
      if (roleCode) {
        const role = await (this.prisma as any).role?.findFirst({
          where: { OR: [{ code: roleCode }, { name: roleCode }] },
        }).catch(() => null);
        if (role) roleConnect = { connect: { id: role.id } };
      }

      // Fallback to EMPLOYEE role if exists and none provided/found
      if (!roleConnect) {
        const defaultRole = await (this.prisma as any).role?.findFirst({ where: { OR: [{ code: 'EMPLOYEE' }, { name: 'EMPLOYEE' }] } }).catch(() => null);
        if (defaultRole) roleConnect = { connect: { id: defaultRole.id } };
      }

      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          ...(roleConnect ? { role: roleConnect } : {}),
          account: { create: { accountVerified: false, is2FAEnabled: false } },
        },
        include: { account: true },
      });
    } else if (!user.account) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { account: { create: { accountVerified: false, is2FAEnabled: false } } },
        include: { account: true },
      });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.account.update({ where: { userId: user.id }, data: { resetToken: token, resetTokenExpiry: expiresAt } });
    await this.emailService.sendUserCreationEmail(email, firstName || 'there', token);
    return { message: 'User created (or already existed). Set-password email sent.' };
  }

  async listUsers() {
    return this.prisma.user.findMany({ include: { role: true, account: true } });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { role: true, account: true } });
  }

  async deleteUser(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }
}


