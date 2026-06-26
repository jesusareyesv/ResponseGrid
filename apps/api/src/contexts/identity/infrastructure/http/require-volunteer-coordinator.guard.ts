import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  VOLUNTEER_EMERGENCY_LOOKUP,
  type VolunteerEmergencyLookup,
} from '../../domain/ports/volunteer-emergency-lookup';
import type { MembershipRepository } from '../../domain/ports/membership.repository';
import { MEMBERSHIP_REPOSITORY } from '../../domain/ports/membership.repository';
import { UserId } from '../../domain/user-id';
import { Role } from '../../domain/role';
import { AuthenticatedUser } from './jwt-auth.guard';

/**
 * Requires the authenticated user to be a Coordinator (or Admin) of the emergency
 * to which the volunteer identified by `:volunteerId` belongs.
 *
 * Must be used AFTER JwtAuthGuard so that `request.user` is already populated.
 */
@Injectable()
export class RequireVolunteerCoordinatorGuard implements CanActivate {
  constructor(
    @Inject(VOLUNTEER_EMERGENCY_LOOKUP)
    private readonly volunteerLookup: VolunteerEmergencyLookup,
    @Inject(MEMBERSHIP_REPOSITORY)
    private readonly membershipRepo: MembershipRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: AuthenticatedUser; params: { volunteerId?: string } }
      >();

    if (!request.user)
      throw new UnauthorizedException('Authentication required');
    if (request.user.isAdmin) return true;

    const { volunteerId } = request.params;
    if (!volunteerId)
      throw new ForbiddenException('Volunteer context required');

    const emergencyId = await this.volunteerLookup.findEmergencyId(volunteerId);
    if (emergencyId === null) {
      throw new NotFoundException(`Volunteer ${volunteerId} not found`);
    }

    const hasRole = await this.membershipRepo.hasRole(
      UserId.fromString(request.user.id),
      emergencyId,
      Role.Coordinator,
    );

    if (!hasRole) {
      throw new ForbiddenException(
        'Coordinator role required for this emergency',
      );
    }
    return true;
  }
}
