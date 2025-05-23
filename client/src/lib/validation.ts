import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const totpVerifySchema = z.object({
  code: z.string().length(6, 'TOTP code must be 6 digits'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['student', 'tutor']).default('student'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Course validation schemas
export const courseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  published: z.boolean().default(false),
});

// Module validation schemas
export const moduleSchema = z.object({
  courseId: z.number(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  order: z.number().default(0),
});

// Assignment validation schemas
export const assignmentSchema = z.object({
  moduleId: z.number(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  dueDate: z.string().or(z.date()),
  maxScore: z.number().default(100),
});

// Submission validation schemas
export const submissionSchema = z.object({
  content: z.string().min(1, 'Submission content is required'),
});

export const submissionFeedbackSchema = z.object({
  feedback: z.string(),
  score: z.number().min(0).optional(),
  graded: z.boolean().default(false),
});

// Badge validation schemas
export const badgeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  iconUrl: z.string().url('Icon URL must be a valid URL'),
  criteria: z.any(),
});

// Enrollment validation schemas
export const enrollmentStatusSchema = z.object({
  status: z.enum(['pending', 'active', 'completed', 'rejected']),
});

// User management validation schemas (admin)
export const userUpdateSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['student', 'tutor', 'admin']).optional(),
});
