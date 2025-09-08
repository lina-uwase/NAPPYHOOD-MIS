import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async listRoles() {
    return (this.prisma as any).role?.findMany({ include: { permissions: true } });
  }

  async createRole(body: { name: string; code?: string; description?: string; permissions?: string[] }) {
    const { name, code, description, permissions = [] } = body;
    return (this.prisma as any).role?.create({
      data: {
        name,
        code: code || name.toUpperCase().replace(/\s+/g, '_'),
        description: description || '',
        permissions: { set: permissions },
      },
    });
  }

  async updateRole(id: string, body: { name?: string; description?: string; permissions?: string[] }) {
    const { name, description, permissions } = body;
    return (this.prisma as any).role?.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
        ...(permissions ? { permissions: { set: permissions } } : {}),
      },
    });
  }

  async deleteRole(id: string) {
    await (this.prisma as any).role?.delete({ where: { id } });
    return { message: 'Role deleted' };
  }
}


