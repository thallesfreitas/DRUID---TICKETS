/**
 * Middleware de tratamento de erros centralizado
 */

import { AppError } from '../types';
import { HTTP_STATUS } from '../constants/api';

export function errorHandler(
  err: any,
  req: any,
  res: any,
  next: any
) {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
  }

  // Erros de validação Zod
  if (err.name === 'ZodError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'validation_error',
      message: 'Validação falhou',
      details: err.errors,
    });
  }

  // Erro genérico
  res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    error: 'internal_error',
    message: 'Ocorreu um erro interno no servidor.',
  });
}

/**
 * Wrapper para async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
