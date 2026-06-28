import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { AuthenticatedUser } from '../types'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user: AuthenticatedUser = request.user
    if (!user?.isSuperAdmin) {
      throw new ForbiddenException('SuperAdmin access required')
    }
    return true
  }
}
