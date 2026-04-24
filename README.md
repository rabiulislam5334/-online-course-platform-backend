# Online Course & Quiz Platform — Backend API

> Full-stack assessment project | Node.js + Express.js + MySQL | TA-2026-OCQP-01

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
cd backend
npm install
```

### 2. Environment Setup
```bash
.env.example 
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=
DB_PASSWORD=
DB_NAME=test

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Frontend URL (CORS)
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Database Setup
```bash
mysql -u root -p < src/config/schema.sql
```

### 4. Run
```bash
# Development
npm run dev

# Production
npm start
```

Server: `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## 🔐 Default Login (Super Admin)

| Field    | Value                  |
|----------|------------------------|
| Email    | admin@platform.com     |
| Password | password               |

> 

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   ├── multer.js          # File upload config
│   │   └── schema.sql         # Database schema + seed data
│   ├── controllers/           # Request handling
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── roleController.js
│   │   ├── courseController.js
│   │   ├── lessonController.js
│   │   ├── quizController.js
│   │   ├── enrollmentController.js
│   │   └── certificateController.js
│   ├── services/              # Business logic
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── courseService.js
│   │   └── quizService.js
│   ├── repositories/          # Database queries
│   │   ├── authRepository.js
│   │   ├── userRepository.js
│   │   ├── roleRepository.js
│   │   ├── courseRepository.js
│   │   └── quizRepository.js
│   ├── middlewares/
│   │   ├── auth.js            # JWT verification
│   │   ├── rbac.js            # Role-based access control
│   │   ├── validate.js        # Input validation
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── roles.js
│   │   ├── courses.js
│   │   ├── lessons.js
│   │   ├── quizzes.js
│   │   ├── enrollments.js
│   │   └── certificates.js
│   ├── utils/
│   │   ├── response.js        # Standardized API responses
│   │   └── jwt.js             # Token helpers
│   ├── uploads/               # Uploaded files
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
├── .env.example
├── package.json
└── README.md
```

---

## 📡 API Endpoints

### Auth — `/api/auth.`
| Method | Endpoint        | Description              |
|--------|-----------------|--------------------------|
| POST   | /register       | New user registration    |
| POST   | /login          | Login → JWT tokens       |
| POST   | /refresh-token  | Refresh access token     |
| POST   | /logout         | Revoke refresh token     |

### Users — `/api/users`
| Method | Endpoint          | Auth Required |
|--------|-------------------|---------------|
| GET    | /dashboard        | Admin         |
| GET    | /                 | Admin         |
| GET    | /:id              | Admin         |
| PUT    | /:id              | Admin         |
| POST   | /:id/approve      | Admin         |
| POST   | /:id/reject       | Admin         |
| PATCH  | /:id/status       | Admin         |
| PATCH  | /:id/role         | Admin         |

### Roles — `/api/roles.`
| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| GET    | /                   | All roles + permissions|
| POST   | /                   | Create role            |
| PUT    | /:id                | Update role name       |
| DELETE | /:id                | Delete role            |
| PUT    | /:id/permissions    | Update permissions     |

### Courses — `/api/courses.`
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | /                 | All published courses    |
| GET    | /admin/all        | All courses (admin)      |
| GET    | /my               | Instructor's courses     |
| GET    | /:id              | Single course            |
| POST   | /                 | Create course            |
| PUT    | /:id              | Update course            |
| DELETE | /:id              | Delete course            |
| PATCH  | /:id/submit       | Submit for review        |
| PATCH  | /:id/approve      | Approve course (admin)   |
| PATCH  | /:id/reject       | Reject course (admin)    |
| PATCH  | /:id/unpublish    | Unpublish (admin)        |

### Lessons — `/api/lessons`
| Method | Endpoint               | Description            |
|--------|------------------------|------------------------|
| GET    | /course/:courseId      | Course lessons         |
| POST   | /                      | Create lesson          |
| PUT    | /:id                   | Update lesson          |
| PATCH  | /reorder               | Reorder lessons        |
| DELETE | /:id                   | Delete lesson          |
| POST   | /:id/complete          | Mark lesson complete   |

### Quizzes — `/api/quizzes`
| Method | Endpoint               | Description            |
|--------|------------------------|------------------------|
| GET    | /course/:courseId      | Get quiz for course    |
| POST   | /                      | Create quiz            |
| PUT    | /:id                   | Update quiz settings   |
| POST   | /:id/questions         | Add question           |
| PUT    | /questions/:qId        | Update question        |
| DELETE | /questions/:qId        | Delete question        |
| POST   | /:id/attempt           | Submit quiz attempt    |
| GET    | /:id/attempts          | All attempts (instructor)|
| GET    | /:id/my-attempts       | My attempts (student)  |

### Enrollments — `/api/enrollments`
| Method | Endpoint                      | Description       |
|--------|-------------------------------|-------------------|
| POST   | /                             | Enroll in course  |
| GET    | /my                           | My enrollments    |
| GET    | /course/:courseId             | Course students   |
| GET    | /course/:courseId/progress    | My progress       |

### Certificates — `/api/certificates`
| Method | Endpoint        | Description            |
|--------|-----------------|------------------------|
| GET    | /my             | My certificates        |
| GET    | /:id            | Certificate detail     |
| GET    | /:id/download   | Download as PDF        |

---

## 🗃️ ER Diagram

```
users ──────┬── role_id ──► roles ──► role_permissions
            │
            ├── (instructor) ──► courses ──┬── lessons ──► lesson_completions
            │                              ├── quizzes ──► quiz_questions
            │                              │            └── quiz_attempts ──► certificates
            └── (student) ──► enrollments ─┘
```

---

## 🔑 Environment Variables

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=course_platform

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

CLIENT_URL=http://localhost:3000

UPLOAD_PATH=src/uploads
MAX_FILE_SIZE=5242880
```

---

## 🛡️ Auth Flow

```
POST /api/auth/register  →  status: pending
Admin approves           →  status: active
POST /api/auth/login     →  { accessToken, refreshToken }
Authorization: Bearer <accessToken>  →  protected routes
POST /api/auth/refresh-token  →  new token pair
POST /api/auth/logout    →  revoke refresh token
```

---

## 📦 Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Runtime     | Node.js                       |
| Framework   | Express.js                    |
| Database    | MySQL + mysql2                |
| Auth        | JWT (access + refresh tokens) |
| Validation  | express-validator             |
| File Upload | Multer                        |
| PDF         | PDFKit                        |
| Security    | Helmet, CORS, Rate Limiter    |
| Password    | bcryptjs                      |
