// src/middlewares/loggingMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Create a logger with both console and file transport
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Console transport for immediate visibility
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    }),
    // File transport for persistent logging
    new winston.transports.File({ 
      filename: 'logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Response logging middleware
export const loggingMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Capture the original res.json and res.send methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override res.json
    res.json = function(body: any) {
      // Log request details
      logger.info(JSON.stringify({
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query,
        responseBody: body,
        timestamp: new Date().toISOString()
      }));

      // Call the original json method
      return originalJson.call(this, body);
    };

    // Override res.send
    res.send = function(body?: any) {
      // Log request details
      logger.info(JSON.stringify({
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query,
        responseBody: body,
        timestamp: new Date().toISOString()
      }));

      // Call the original send method
      return originalSend.call(this, body);
    };

    next();
  };
};

// Error logging middleware
export const errorLoggingMiddleware = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  logger.error(JSON.stringify({
    method: req.method,
    path: req.path,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  }));

  // Send error response
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};