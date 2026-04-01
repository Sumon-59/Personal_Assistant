# Personal Assistant - Productivity System

A comprehensive personal productivity system built with **Clean Architecture** and **Domain-Driven Design (DDD)** principles. This application helps users manage their finances, tasks, and personal activities efficiently.

**Stack**: NestJS • TypeScript • PostgreSQL • Drizzle ORM • JWT Authentication

---

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Database Setup](#database-setup)
- [Development](#development)
- [Contributing](#contributing)

---

## ✨ Features

### Authentication Module
- User registration and login with JWT tokens
- Password hashing with bcryptjs
- Token refresh mechanism
- JWT-based authentication guards

### User Management
- User profile management
- Account creation and deletion
- Profile update (name, email)
- Admin user listing

### Expense Tracking
- Create, read, update, delete expenses
- Categorized expenses (Food, Transport, Entertainment, etc.)
- Expense filtering by category and date
- Expense summary statistics
- Pagination support

---

## 🏗️ Project Structure

```
Personal_Assistant/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   │
│   ├── core/
│   │   ├── base/
│   │   │   └── base.entity.ts          # Base entity with common fields
│   │   ├── config/                      # Configuration files
│   │   ├── exceptions/
│   │   │   ├── exceptions.ts           # Custom exception definitions
│   │   │   └── global-exception.filter.ts  # Global error handler
│   │   ├── types/
│   │   │   └── types.ts                # Type definitions
│   │   └── utils/
│   │       ├── current-user.decorator.ts   # Extract user from JWT
│   │       ├── jwt.util.ts             # JWT utility functions
│   │       └── password.util.ts        # Password hashing utilities
│   │
│   ├── database/
│   │   ├── connection.ts               # Drizzle ORM instance & pool
│   │   ├── schema.ts                   # Schema exports
│   │   └── schema/
│   │       ├── index.ts                # Schema barrel export
│   │       ├── user.schema.ts          # Users table definition
│   │       └── expense.schema.ts       # Expenses table definition
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── migrations/             # Database migrations
│   │   │   └── schema/
│   │   └── security/                   # Security-related infrastructure
│   │
│   └── modules/                        # Feature modules
│       ├── auth/                       # Authentication module
│       │   ├── auth.module.ts         # Module configuration
│       │   ├── application/
│       │   │   ├── auth.dto.ts        # DTOs for auth operations
│       │   │   └── auth.usecase.ts    # Business logic
│       │   ├── domain/
│       │   │   ├── auth.usecase.interface.ts    # Contracts
│       │   │   ├── token.service.interface.ts   # Token service contract
│       │   │   └── user.entity.ts               # User domain entity
│       │   │   └── user.repository.interface.ts # Repository contract
│       │   ├── infrastructure/
│       │   │   ├── jwt-token.service.ts       # JWT implementation
│       │   │   ├── jwt.strategy.ts            # Passport JWT strategy
│       │   │   ├── jwt-auth.guard.ts          # Required auth guard
│       │   │   ├── optional-jwt-auth.guard.ts # Optional auth guard
│       │   │   ├── in-memory-user.repository.ts   # Testing repo
│       │   │   └── postgres-user.repository.ts    # Production repo
│       │   └── presentation/
│       │       └── auth.controller.ts      # HTTP endpoints
│       │
│       ├── user/                       # User management module
│       │   ├── user.module.ts         # Module configuration
│       │   ├── application/
│       │   │   ├── user.dto.ts        # DTOs (UpdateProfileDto, UserResponseDto)
│       │   │   └── user.usecase.ts    # Profile management logic
│       │   ├── domain/
│       │   │   ├── user.entity.ts              # User domain entity
│       │   │   ├── user.repository.interface.ts # Repository contract
│       │   │   └── user.usecase.interface.ts   # Use case contract
│       │   ├── infrastructure/
│       │   │   ├── in-memory-user.repository.ts  # Testing repo
│       │   │   └── postgres-user.repository.ts   # PostgreSQL repo
│       │   └── presentation/
│       │       └── user.controller.ts        # HTTP endpoints
│       │
│       └── expense/                   # Expense tracking module
│           ├── expense.module.ts      # Module configuration
│           ├── application/
│           │   ├── expense.dto.ts     # DTOs for expense operations
│           │   └── expense.usecase.ts # Expense business logic
│           ├── domain/
│           │   ├── expense.entity.ts          # Expense domain entity
│           │   ├── expense.repository.interface.ts  # Repository contract
│           │   └── expense.usecase.interface.ts     # Use case contract
│           ├── infrastructure/
│           │   ├── in-memory-expense.repository.ts  # Testing repo
│           │   └── postgres-expense.repository.ts   # PostgreSQL repo
│           └── presentation/
│               └── expense.controller.ts      # HTTP endpoints
│
├── drizzle.config.ts                   # Drizzle ORM configuration
├── nest-cli.json                       # NestJS CLI configuration
├── tsconfig.json                       # TypeScript configuration
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore patterns
├── package.json                        # Project dependencies
├── pnpm-lock.yaml                      # Locked dependencies
├── PHASE_2_SUMMARY.md                  # Phase 2 implementation summary
└── README.md                           # This file
```

---

## 🏛️ Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles:

### Layered Structure

```
┌─────────────────────────────────┐
│   Presentation Layer            │
│   (Controllers, HTTP endpoints) │
├─────────────────────────────────┤
│   Application Layer             │
│   (Use Cases, Business Logic)   │
├─────────────────────────────────┤
│   Domain Layer                  │
│   (Entities, Interfaces)        │
├─────────────────────────────────┤
│   Infrastructure Layer          │
│   (Repositories, External APIs) │
└─────────────────────────────────┘
```

### Module Organization

Each module is self-contained with:
- **Presentation**: HTTP request/response handling
- **Application**: Business logic and DTOs
- **Domain**: Core business rules and entities
- **Infrastructure**: Database, external services

### Design Patterns

- **Dependency Injection**: Loose coupling via NestJS DI
- **Repository Pattern**: Abstract database operations
- **Use Case Pattern**: Encapsulate business logic
- **DTO Pattern**: Type-safe data transfer
- **Decorator Pattern**: Custom decorators for utilities

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16+ 
- **PostgreSQL** v12+
- **pnpm** (or npm/yarn)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/personal-assistant.git
   cd personal-assistant
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database credentials:
   ```env
   DATABASE_URL=postgres://postgres:password@localhost:5432/personal_assistant
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRATION=15m
   PORT=3000
   ```

4. **Create database**
   ```bash
   createdb personal_assistant
   ```

5. **Run migrations**
   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

### Running the Application

**Development mode** (with hot reload):
```bash
pnpm start:dev
```

**Production build**:
```bash
pnpm build
pnpm start
```

**Debug mode**:
```bash
pnpm start:debug
```

The API will be available at `http://localhost:3000/api/v1`

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get authenticated user info

### User Management
- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users` - List all users (admin)
- `PATCH /api/v1/users/me` - Update user profile
- `DELETE /api/v1/users/me` - Delete user account

### Expenses
- `POST /api/v1/expenses` - Create new expense
- `GET /api/v1/expenses` - List user expenses (with pagination)
- `GET /api/v1/expenses/:id` - Get expense details
- `GET /api/v1/expenses/summary` - Get expense statistics
- `PATCH /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

---

## 🗄️ Database Setup

### Database Schema

**Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Expenses Table**
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  note VARCHAR(500),
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX expenses_user_id_idx ON expenses(user_id);
CREATE INDEX expenses_user_id_date_idx ON expenses(user_id, date);
```

### Database Management

- **Generate migrations**: `pnpm run db:generate`
- **Apply migrations**: `pnpm run db:migrate`
- **Studio (GUI)**: `pnpm run db:studio`

---

## 🛠️ Development

### Scripts

```bash
# Development
pnpm start:dev          # Start with hot reload
pnpm start:debug        # Start in debug mode

# Production
pnpm build              # Build TypeScript
pnpm start              # Run compiled app

# Testing
pnpm test               # Run tests once
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage report

# Linting
pnpm lint              # Check code style
pnpm lint:fix          # Fix linting issues

# Database
pnpm db:generate       # Generate new migrations
pnpm db:migrate        # Run migrations
pnpm db:studio         # Open Drizzle Studio
```

### Code Style

- **Linter**: ESLint with TypeScript support
- **Prettier**: Code formatting (configured in package.json)
- **File naming**: kebab-case for files, PascalCase for classes

### Type Safety

- Strict TypeScript enabled (`strict: true`)
- All functions have return types
- All imports use absolute paths with aliases

---

## 📦 Dependencies

### Core
- `@nestjs/core@^9.4.3` - NestJS framework
- `@nestjs/common@^9.4.3` - Common utilities
- `@nestjs/config@^2.3.4` - Configuration management
- `@nestjs/jwt@^10.1.3` - JWT support
- `@nestjs/passport@^9.0.0` - Passport integration

### Database
- `drizzle-orm@^0.29.5` - TypeScript ORM
- `drizzle-kit@^0.31.10` - ORM migration tool
- `pg@^8.20.0` - PostgreSQL driver

### Authentication
- `passport@^0.7.0` - Authentication middleware
- `passport-jwt@^4.0.1` - JWT strategy
- `bcryptjs@^2.4.3` - Password hashing

### Validation & Transformation
- `class-validator@^0.14.0` - DTO validation
- `class-transformer@^0.5.1` - Data transformation

### Utilities
- `dotenv@^16.3.1` - Environment variables
- `uuid` - UUID generation

---

## 🔐 Security Features

- ✅ **JWT Authentication**: Token-based API security
- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **CORS enabled**: Configurable cross-origin access
- ✅ **Input Validation**: class-validator on all DTOs
- ✅ **Error Handling**: Global exception filter
- ✅ **Type Safety**: Full TypeScript implementation

---

## 🧪 Testing

Create test files alongside source files:
```bash
src/modules/auth/auth.controller.spec.ts
src/modules/auth/auth.usecase.spec.ts
src/modules/user/user.usecase.spec.ts
```

Run tests:
```bash
pnpm test                 # Single run
pnpm test:watch          # Watch mode
pnpm test:cov            # Coverage report
```

---

## 📝 Environment Variables

See `.env.example`:
```env
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/personal_assistant

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=15m

# API
API_PREFIX=api/v1
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

### Commit Message Format
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
```

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Author

**Md.  Sumon Hossain**
- GitHub: [@Sumon-59](https://github.com/Sumon-59)
- Email: sumon1907109@gmail.com

---

## 🎯 Roadmap

- [ ] Add Email verification
- [ ] Implement two-factor authentication
- [ ] Add expense analytics dashboard
- [ ] Budget management features
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Export statements (PDF/CSV)
- [ ] Multi-currency support

---

## 📞 Support

For support, email sumon1907109@gmail.com or open an issue in the GitHub repository.

---

**Last Updated**: March 31, 2026
