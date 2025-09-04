import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class MobileGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean | Promise<boolean> {
    return true;
  }
}


