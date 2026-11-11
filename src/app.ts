import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

// Route imports
import authRoutes from './routes/authRoute';
import userRoutes from './routes/userRoute';
import blogRoutes from './routes/blogRoute';

// Middleware imports
import { errorHandler } from './middlewares/errorMiddleware';
import { errorLoggingMiddleware, loggingMiddleware } from './middlewares/loggingMiddleware';
import prisma from './lib/prisma';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './config/rateLimiter';

// Create an instance of Express
const app = express();

// Security middlewares
app.use(loggingMiddleware());
app.use(helmet());
app.use(globalLimiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Route Setup
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/blogs', blogRoutes);


// Error Handling Middleware
app.use(errorLoggingMiddleware);
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export { app, prisma };
