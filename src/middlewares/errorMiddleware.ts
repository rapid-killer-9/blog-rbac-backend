import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// Error handling middleware
export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(error);

  // Typed application errors created via errorUtil factories
  if (error.name === 'CustomError') {
    res.status((error as any).statusCode).json({ message: error.message });
    return;
  }

  // Prisma known errors (unique constraint, record not found, etc.)
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ message: 'Database error', error: error.message });
    return;
  }

  // Zod validation errors
  if (error.name === 'ZodError') {
    res.status(400).json({ message: 'Validation failed', error: error.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error', error: error.message });
};
