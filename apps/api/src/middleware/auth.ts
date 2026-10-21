import type { MiddlewareHandler } from 'hono';
import type { Env } from '../types';

export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const secretKey = c.env.PERSONAL_SECRET_KEY;

  // If no secret key is configured on worker, allow development access
  if (!secretKey) {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized: Missing Authorization header' }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token !== secretKey) {
    return c.json({ error: 'Unauthorized: Invalid Personal Secret Key' }, 401);
  }

  await next();
};
