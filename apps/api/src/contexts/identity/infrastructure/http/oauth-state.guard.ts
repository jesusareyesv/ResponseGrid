import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  mixin,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

/** Name of the cookie that carries the CSRF state token. */
const STATE_COOKIE = 'rh_oauth_state';
/** TTL for the state cookie: 10 minutes in milliseconds. */
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Extracts the value of a single cookie from a raw `Cookie` header string.
 * Used as a fallback when `cookie-parser` middleware is NOT registered
 * (i.e. `req.cookies` is absent).
 */
function parseCookieHeader(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey.trim() === name) {
      return rest.join('=').trim();
    }
  }
  return undefined;
}

/**
 * Reads the OAuth CSRF state cookie from the request.
 * Prefers `req.cookies` (cookie-parser) but falls back to manual header parsing
 * since this project does NOT register cookie-parser middleware.
 */
function readStateCookie(req: Request): string | undefined {
  // Express types `req.cookies` as `any` (cookie-parser may or may not be
  // registered). We go through `unknown` to satisfy `no-unsafe-*` lint rules.
  const cookieJar: unknown = (req as Request & { cookies?: unknown }).cookies;
  if (cookieJar !== null && typeof cookieJar === 'object') {
    const raw: unknown = (cookieJar as Record<string, unknown>)[STATE_COOKIE];
    if (typeof raw === 'string') {
      return raw;
    }
  }
  return parseCookieHeader(req.headers.cookie, STATE_COOKIE);
}

/**
 * Factory that creates `OAuthInitiateGuard` for the given passport provider.
 *
 * Extends `AuthGuard(provider)` and overrides `getAuthenticateOptions` to:
 *  1. Generate a `randomUUID()` CSRF state token.
 *  2. Set it as an httpOnly cookie on the response.
 *  3. Return `{ state }` so Passport forwards it to the OAuth provider.
 */
export function OAuthInitiateGuard(
  provider: 'google' | 'facebook',
): new () => CanActivate {
  class MixinOAuthInitiateGuard extends AuthGuard(provider) {
    override getAuthenticateOptions(context: ExecutionContext): object {
      const res = context.switchToHttp().getResponse<Response>();
      const state = randomUUID();

      res.cookie(STATE_COOKIE, state, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/auth',
        maxAge: STATE_MAX_AGE_MS,
        secure: process.env.COOKIE_SECURE === 'true',
      });

      return { state };
    }
  }

  return mixin(MixinOAuthInitiateGuard);
}

/**
 * Factory that creates `OAuthCallbackGuard` for the given passport provider.
 *
 * Extends `AuthGuard(provider)` and overrides `canActivate` to:
 *  1. Read `state` from `req.query` and the CSRF cookie from the request.
 *  2. **Always** clear the state cookie (prevent replay regardless of outcome).
 *  3. Throw `UnauthorizedException` if either value is missing or they differ.
 *  4. Delegate to `super.canActivate(context)` (Passport token exchange) only
 *     when the state is valid.
 */
export function OAuthCallbackGuard(
  provider: 'google' | 'facebook',
): new () => CanActivate {
  class MixinOAuthCallbackGuard extends AuthGuard(provider) {
    override async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request>();
      const res = context.switchToHttp().getResponse<Response>();

      // Always clear the cookie to prevent replay attacks.
      res.clearCookie(STATE_COOKIE, { path: '/auth' });

      // Narrow req.query.state from unknown to string | undefined.
      const queryState: unknown = req.query['state'];
      const stateFromQuery: string | undefined =
        typeof queryState === 'string' ? queryState : undefined;

      const stateFromCookie = readStateCookie(req);

      if (
        !stateFromQuery ||
        !stateFromCookie ||
        stateFromQuery !== stateFromCookie
      ) {
        throw new UnauthorizedException('Invalid OAuth state');
      }

      // Delegate to Passport for the actual token exchange.
      return super.canActivate(context) as Promise<boolean>;
    }
  }

  return mixin(MixinOAuthCallbackGuard);
}
