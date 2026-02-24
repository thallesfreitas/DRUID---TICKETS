/**
 * Middleware that verifies JWT and attaches admin to request
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../types';
import { HTTP_STATUS } from '../constants/api';

const JWT_SECRET = process.env.JWT_SECRET || process.env.druidtickets_JWT_SECRET || 'dev-secret-change-in-production';

export interface AdminPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedAdminRequest extends Request {
  admin?: AdminPayload;
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Token não informado.', HTTP_STATUS.UNAUTHORIZED, 'unauthorized'));
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AdminPayload;
    (req as AuthenticatedAdminRequest).admin = decoded;
    next();
  } catch {
    next(new AppError('Token inválido ou expirado.', HTTP_STATUS.UNAUTHORIZED, 'unauthorized'));
  }
}

export function signAdminToken(adminId: number, email: string): string {
  return jwt.sign(
    { sub: adminId, email } as AdminPayload,
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}
