# Blog Management API

This is a backend API for a blog management system with Role-Based Access Control (RBAC). The API is built using **Node.js**, **TypeScript**, **Express**, and **Prisma ORM** with a **PostgreSQL** database. It supports user authentication, user profile management, and blog management with different user roles.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Scripts](#scripts)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Database Schema](#database-schema)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication**: Sign up and login functionality with JWT authentication.
- **Role-Based Access Control**: Three user roles with different permissions:
  - **Admin**: Full access to all resources.
  - **Moderator**: Can review and manage pending blogs.
  - **User**: Can create and manage their own blogs.
- **Blog Management**:
  - Create, read, update, and delete blogs.
  - Blogs have statuses: Draft, Pending, Published.
  - Tags functionality for blogs.
- **User Profile**:
  - Users can update their profile information.
  - Profile includes bio and location.

## Prerequisites

- **Node.js** (v14 or newer)
- **npm** or **Yarn**
- **PostgreSQL** database

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/blog-rbac-backend.git
   cd blog-rbac-backend

2. **Install dependencies**:

    ```
    npm install

3. **Set up environment variables**:
Create a .env file in the root directory and add the following:

    ```
    DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRES_IN=1h
    PORT=3000
Replace placeholders with your actual database credentials and preferred JWT settings.

4. **Run database migrations**:
    
    ```
    npx prisma migrate dev --name init

5. **Generate Prisma Client**:

    ```
    npx prisma generate

6. **Start the development server**:

    ```
    npm run dev
The server will run on http://localhost:3000.

7. **View Prisma Studio**:

    ```
    npx prisma studio
This will open Prisma Studio in your default browser, allowing you to view and manage your database.



## Scripts
  - **Start**: `npm start` - Runs the compiled app.
  - **Development**: `npm run dev` - Runs the app using ts-node.
  - **Build**: `npm run build` - Compiles TypeScript to JavaScript.
  - **Migrate**: `npm run migrate` - Runs database migrations.

## API Endpoints

### Authentication
- **Signup** - `POST /auth/signup`
- **Login** - `POST /auth/login`
- **Get Profile** - `GET /auth/profile` (Requires authentication)

### User Management
- **Update Profile** - `PATCH /users/profile` (Requires authentication)
- **Get All Users** - `GET /users` (Admin only)
- **Get User by ID** - `GET /users/:id` (Admin only)

### Blog Management
- **Create Blog** - `POST /blogs/create` (Requires authentication)
- **Get Blogs** - `GET /blogs` (Accessible by role)
- **Update Blog Status** - `PATCH /blogs/:id/status` (Admin or Moderator)

## Middleware
- **Authentication Middleware**: Verifies JWT tokens and authenticates users.
- **Authorization Middleware**: Checks user roles for access to certain endpoints.
- **Error Handling Middleware**: Catches and handles errors globally.

## Database Schema
- **Prisma ORM** is used to define the database schema.
- The schema includes models for:
  - `User`
  - `Profile`
  - `Blog`
  - `BlogTag`
- Enum types for:
  - `UserRole`
  - `BlogStatus`

## Technologies Used
- **Node.js** and **Express** for server and routing.
- **TypeScript** for type safety.
- **Prisma ORM** with **PostgreSQL** for database management.
- **JWT** for authentication.
- **Zod** for input validation.
- **Helmet** and **Cors** for security.
- **Bcrypt.js** for password hashing.

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License
This project is licensed under the **MIT License**.
