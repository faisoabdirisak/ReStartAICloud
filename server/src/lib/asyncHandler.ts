import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Express 4 does not automatically forward rejected route promises. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => { Promise.resolve(handler(req, res, next)).catch(next); };
}
