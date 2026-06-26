import { Controller, Get, Req, Res, UseGuards, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OAuthInitiateGuard, OAuthCallbackGuard } from './oauth-state.guard';

/**
 * OAuth 2.0 redirect-based endpoints for Google and Facebook login.
 *
 * Flow:
 *   1. Browser navigates to GET /auth/google  → Passport redirects to Google consent screen.
 *   2. Google redirects back to GET /auth/google/callback.
 *   3. Passport strategy calls AuthenticateWithProvider which returns {accessToken}.
 *   4. We redirect the browser to the frontend with the token in the URL fragment
 *      (fragment is never sent to servers, reducing logging exposure).
 *
 * CSRF protection:
 *   - OAuthInitiateGuard generates a random `state` UUID and stores it in an
 *     httpOnly cookie (`rh_oauth_state`). Passport forwards it to the provider.
 *   - OAuthCallbackGuard validates that `req.query.state` matches the cookie
 *     before delegating to Passport's token exchange step.
 *
 * NOTE (production hardening): The fragment-based approach is convenient but the
 * client-side JS still reads the token. For production, replace with a short-lived
 * one-time code that the frontend exchanges server-side.
 */
@ApiExcludeController()
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private readonly frontendUrl =
    process.env.FRONTEND_URL ?? 'http://localhost:3001';

  // ─── Google ───────────────────────────────────────────────────────────────

  @Get('google')
  @UseGuards(OAuthInitiateGuard('google'))
  googleLogin(): void {
    // Passport handles the redirect to Google — this body is never reached.
  }

  @Get('google/callback')
  @UseGuards(OAuthCallbackGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as { accessToken: string } | undefined;
    if (!user?.accessToken) {
      this.logger.error('Google callback: no accessToken on request.user');
      res.redirect(`${this.frontendUrl}/login?error=oauth_failed`);
      return;
    }
    res.redirect(`${this.frontendUrl}/auth/complete#token=${user.accessToken}`);
  }

  // ─── Facebook ─────────────────────────────────────────────────────────────

  @Get('facebook')
  @UseGuards(OAuthInitiateGuard('facebook'))
  facebookLogin(): void {
    // Passport handles the redirect to Facebook — this body is never reached.
  }

  @Get('facebook/callback')
  @UseGuards(OAuthCallbackGuard('facebook'))
  facebookCallback(@Req() req: Request, @Res() res: Response): void {
    const user = req.user as { accessToken: string } | undefined;
    if (!user?.accessToken) {
      this.logger.error('Facebook callback: no accessToken on request.user');
      res.redirect(`${this.frontendUrl}/login?error=oauth_failed`);
      return;
    }
    res.redirect(`${this.frontendUrl}/auth/complete#token=${user.accessToken}`);
  }
}
