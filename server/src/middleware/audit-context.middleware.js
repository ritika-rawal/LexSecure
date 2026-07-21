import { randomUUID } from 'node:crypto';

export const auditContextMiddleware = (req, res, next) => {
  /*
   * Never trust a caller-provided request identifier for audit correlation.
   * A server-generated UUID prevents log injection and identifier collisions.
   */
  req.auditRequestId = randomUUID();
  res.set('X-Request-ID', req.auditRequestId);
  next();
};
