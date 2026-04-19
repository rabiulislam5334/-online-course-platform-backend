-- =============================================
-- Online Course & Quiz Platform — DB Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS course_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE course_platform;

-- ----------------------------
-- roles
-- ----------------------------
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- role_permissions
-- ----------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  module ENUM('courses','lessons','quizzes','users','enrollments','reports') NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_role_module (role_id, module)
);

-- ----------------------------
-- users
-- ----------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  status ENUM('pending','active','rejected','suspended') DEFAULT 'pending',
  rejection_remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ----------------------------
-- refresh_tokens
-- ----------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- courses
-- ----------------------------
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  price DECIMAL(10,2) DEFAULT 0.00,
  thumbnail_url VARCHAR(500),
  status ENUM('draft','pending_review','published','rejected','unpublished') DEFAULT 'draft',
  admin_remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- lessons
-- ----------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  video_url VARCHAR(500),
  file_url VARCHAR(500),
  order_index INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ----------------------------
-- quizzes
-- ----------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  time_limit_min INT DEFAULT 30,
  pass_percentage INT DEFAULT 60,
  max_attempts INT DEFAULT 3,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ----------------------------
-- quiz_questions
-- ----------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  question_text TEXT NOT NULL,
  option_a VARCHAR(500) NOT NULL,
  option_b VARCHAR(500) NOT NULL,
  option_c VARCHAR(500) NOT NULL,
  option_d VARCHAR(500) NOT NULL,
  correct_option ENUM('a','b','c','d') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- ----------------------------
-- enrollments
-- ----------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  progress_pct DECIMAL(5,2) DEFAULT 0.00,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enrollment (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ----------------------------
-- lesson_completions
-- ----------------------------
CREATE TABLE IF NOT EXISTS lesson_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  lesson_id INT NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_completion (student_id, lesson_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- ----------------------------
-- quiz_attempts
-- ----------------------------
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id INT NOT NULL,
  student_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  is_passed BOOLEAN DEFAULT FALSE,
  answers_json JSON,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------
-- certificates
-- ----------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  quiz_attempt_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_certificate (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

-- ----------------------------
-- Seed: default roles
-- ----------------------------
INSERT IGNORE INTO roles (name, is_super_admin) VALUES
  ('Super Admin', TRUE),
  ('Instructor', FALSE),
  ('Student', FALSE);

-- Seed: Super Admin user (password: Admin@1234)
INSERT IGNORE INTO users (full_name, email, password_hash, role_id, status)
VALUES (
  'Super Admin',
  'admin@platform.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  (SELECT id FROM roles WHERE name = 'Super Admin'),
  'active'
);

-- Seed: Super Admin permissions (all modules, all actions)
INSERT IGNORE INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.module, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN (
  SELECT 'courses' AS module UNION SELECT 'lessons' UNION SELECT 'quizzes'
  UNION SELECT 'users' UNION SELECT 'enrollments' UNION SELECT 'reports'
) m
WHERE r.name = 'Super Admin';

-- Seed: Instructor permissions
INSERT IGNORE INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.module, m.v, m.c, m.e, m.d
FROM roles r
CROSS JOIN (
  SELECT 'courses' AS module, TRUE AS v, TRUE AS c, TRUE AS e, TRUE AS d
  UNION SELECT 'lessons', TRUE, TRUE, TRUE, TRUE
  UNION SELECT 'quizzes', TRUE, TRUE, TRUE, TRUE
  UNION SELECT 'enrollments', TRUE, FALSE, FALSE, FALSE
  UNION SELECT 'reports', TRUE, FALSE, FALSE, FALSE
  UNION SELECT 'users', FALSE, FALSE, FALSE, FALSE
) m
WHERE r.name = 'Instructor';

-- Seed: Student permissions
INSERT IGNORE INTO role_permissions (role_id, module, can_view, can_create, can_edit, can_delete)
SELECT r.id, m.module, m.v, m.c, m.e, m.d
FROM roles r
CROSS JOIN (
  SELECT 'courses' AS module, TRUE AS v, FALSE AS c, FALSE AS e, FALSE AS d
  UNION SELECT 'lessons', TRUE, FALSE, FALSE, FALSE
  UNION SELECT 'quizzes', TRUE, TRUE, FALSE, FALSE
  UNION SELECT 'enrollments', TRUE, TRUE, FALSE, FALSE
  UNION SELECT 'reports', FALSE, FALSE, FALSE, FALSE
  UNION SELECT 'users', FALSE, FALSE, FALSE, FALSE
) m
WHERE r.name = 'Student';
