# Open School Portal - Backend

A modern, scalable, NestJS powered backend system designed for schools to manage students, teachers, classes, attendance, results, timetables, and financial operations (fees, invoices, payments). Built for performance, multi-tenant usage, and clean developer experience.

## Features

### Core Features

- RBAC Authentication (Admin, Teacher, Student)
- User & School Management
- Classes & Subjects Management
- Student Enrollment
- Attendance Tracking
- Results & Grades Module
- Timetable Scheduling
- Fees, Invoices, and Payments
- Audit Logging

## Architecture Overview

### Monorepo Structure

The backend is built in a modular monorepo structure to keep each domain clean and independently maintainable.

```
/apps
  /api              → Main backend API (NestJS)

/packages
  /core             → Shared utilities (DTOs, Guards, Pipes)
  /database         → TypeORM schema & migrations
  /types            → Global TypeScript types
  /auth             → Authentication logic
```

### High-Level Architecture

- API Layer (REST + JWT Auth)
- Modular domain architecture
- Redis caching
- Centralized Audit Logging

## Database Schema (High-Level)

### Core Tables

| Table        | Purpose                                      |
| ------------ | -------------------------------------------- |
| users        | All system users (admin, teachers, students) |
| classes      | School classes with assigned teacher         |
| subjects     | Offered subjects                             |
| enrollments  | Student → Class mappings                     |
| attendance   | Check-ins & check-outs                       |
| results      | Test scores and grades                       |
| timetable    | Class schedules                              |
| fee_invoices | Student invoices                             |
| fee_payments | Payments made against invoices               |
| audit_logs   | System activity logs                         |


## Modules Breakdown

### Auth Module

- JWT Authentication
- Login, Signup
- Role-based access control
- Guards (AdminGuard, TeacherGuard, StudentGuard)

### Users Module

- Create/Update users
- Assign roles
- Manage teacher profiles
- Manage student information (parents, classes)

### Classes & Subjects Module

- Create classes
- Assign a teacher
- Manage capacity
- Create subjects

### Enrollment Module

- Enroll students into classes
- Track academic year
- View all students in a class

### Attendance Module

- Check-in / Check-out system
- Daily logs
- Attendance reports

### Results Module

- Record scores
- Compute grades
- View term results per student

### Timetable Module

- Schedule classes
- Manage periods and days
- Class + subject linking

### Fees & Payments Module

- Generate invoices
- Track due dates
- Log payments
- Financial reporting

### Audit Logging Module

- Records every admin or teacher action
- Stores IP address & timestamp
- Useful for compliance & debugging

## Tech Stack

### Backend

- Node.js + NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Redis (optional)

### Infrastructure

- Docker-ready
- CI/CD adaptable
- Monorepo-friendly

## Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/school"
JWT_SECRET="your_secret_key_here"
PORT=3000
```

### 4. Start the Application

**Development mode:**

```bash
npm run start:dev
```

**Production mode:**

```bash
npm run build
npm run start:prod
```

The API will be available at: **http://localhost:3000**

## Running the App

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Testing

```bash
# unit tests
npm test

# watch mode
npm run test:watch

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Deployment

### Build

```bash
npm run build
```

### Production

```bash
npm run start:prod
```

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR

### Coding Guidelines

- Follow the modular structure
- One module = one domain
- Use DTOs & Validation Pipes
- Write tests

## Support

For feature requests, bugs or contributions, open an issue or contact the maintainer.
