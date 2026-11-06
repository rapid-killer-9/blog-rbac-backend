import { PrismaClient } from '@prisma/client';

// Single shared instance to avoid exhausting the DB connection pool.
const prisma = new PrismaClient();

export default prisma;
