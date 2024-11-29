// CustomError function-based implementation
export const CustomError = (message: string, statusCode: number = 500) => {
  const error = new Error(message);
  error.name = 'CustomError';
  (error as any).statusCode = statusCode;

  return error;
};

// Factory functions for different error types
export const badRequest = (message: string) => CustomError(message, 400);
export const unauthorized = (message: string) => CustomError(message, 401);
export const forbidden = (message: string) => CustomError(message, 403);
export const notFound = (message: string) => CustomError(message, 404);
