import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

// Error handling middleware
export const errorHandler: ErrorRequestHandler = (
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  console.error(error);

  // Prisma specific error handling
  if (error.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      message: 'Database error',
      error: error.message
    });
    return;
  }

  // Validation error handling
  if (error.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation failed',
      error: error.message
    });
    return;
  }

  // Default error handler
  res.status(500).json({
    message: 'Internal server error',
    error: error.message
  });
};
