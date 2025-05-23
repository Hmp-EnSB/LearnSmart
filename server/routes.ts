import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import MemoryStore from "memorystore";
import crypto from "crypto";
import { storage } from "./storage";
import { 
  loginSchema, 
  totpVerifySchema, 
  registerSchema,
  insertCourseSchema,
  insertModuleSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertBadgeSchema
} from "@shared/schema";
import { verifyTOTP, generateTOTP, slugify } from "./utils";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "learn-smart-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 },
      store: new SessionStore({
        checkPeriod: 86400000 // Prune expired entries every 24h
      })
    })
  );

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid credentials", errors: result.error.format() });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Generate a temporary token for TOTP verification
      const tempToken = crypto.randomBytes(32).toString("hex");
      req.session.tempToken = tempToken;
      req.session.pendingUserId = user.id;

      res.json({ 
        tempToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/verify-totp", async (req: Request, res: Response) => {
    try {
      const result = totpVerifySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid TOTP data", errors: result.error.format() });
      }

      const { token, code } = result.data;
      
      // Verify the temporary token
      if (!req.session.tempToken || req.session.tempToken !== token) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      const userId = req.session.pendingUserId;
      if (!userId) {
        return res.status(401).json({ message: "No pending authentication" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Verify the TOTP code
      const isValidCode = verifyTOTP(code, user.totpSecret || "");
      if (!isValidCode) {
        return res.status(401).json({ message: "Invalid TOTP code" });
      }

      // Set the user as authenticated and clean up temporary data
      req.session.userId = user.id;
      req.session.userRole = user.role;
      delete req.session.tempToken;
      delete req.session.pendingUserId;

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error("TOTP verification error:", error);
      res.status(500).json({ message: "Server error during TOTP verification" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid registration data", errors: result.error.format() });
      }

      const { username, email, password, fullName, role } = result.data;
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Generate TOTP secret
      const totpSecret = generateTOTP();

      // Create user
      const user = await storage.createUser({
        username,
        email,
        password,
        fullName,
        role: role || 'student', // Default to student role
        totpSecret
      });

      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.fullName
        },
        totpSecret: user.totpSecret
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.fullName
        }
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Server error fetching user data" });
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check role
  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.session.userId || !req.session.userRole) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!roles.includes(req.session.userRole)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      next();
    };
  };

  // Course routes
  app.get("/api/courses", async (req: Request, res: Response) => {
    try {
      const { tutorId, published } = req.query;
      const filters: { tutorId?: number, published?: boolean } = {};
      
      if (tutorId) {
        filters.tutorId = parseInt(tutorId as string, 10);
      }
      
      if (published !== undefined) {
        filters.published = published === 'true';
      } else {
        // By default, only show published courses to unauthenticated users
        if (!req.session.userId) {
          filters.published = true;
        }
      }
      
      const courses = await storage.getCourses(filters);
      
      // Fetch tutor details for each course
      const coursesWithTutors = await Promise.all(
        courses.map(async (course) => {
          const tutor = await storage.getUser(course.tutorId);
          return {
            ...course,
            tutor: tutor ? {
              id: tutor.id,
              fullName: tutor.fullName
            } : null
          };
        })
      );
      
      res.json(coursesWithTutors);
    } catch (error) {
      console.error("Get courses error:", error);
      res.status(500).json({ message: "Server error fetching courses" });
    }
  });

  app.get("/api/courses/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const course = await storage.getCourseBySlug(slug);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // If the course is not published, only allow access to the tutor or admin
      if (!course.published && req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (!user || (user.role !== 'admin' && user.id !== course.tutorId)) {
          return res.status(403).json({ message: "Course is not published" });
        }
      } else if (!course.published) {
        return res.status(403).json({ message: "Course is not published" });
      }
      
      const tutor = await storage.getUser(course.tutorId);
      const modules = await storage.getModulesByCourse(course.id);
      
      res.json({
        ...course,
        tutor: tutor ? {
          id: tutor.id,
          fullName: tutor.fullName
        } : null,
        modules
      });
    } catch (error) {
      console.error("Get course error:", error);
      res.status(500).json({ message: "Server error fetching course" });
    }
  });

  app.post("/api/courses", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const result = insertCourseSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid course data", errors: result.error.format() });
      }
      
      const courseData = result.data;
      const tutorId = req.session.userId!;
      
      // Create the course
      const course = await storage.createCourse({
        ...courseData,
        tutorId
      });
      
      res.status(201).json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ message: "Server error creating course" });
    }
  });

  app.put("/api/courses/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to update this course" });
      }
      
      const result = insertCourseSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid course data", errors: result.error.format() });
      }
      
      const updatedCourse = await storage.updateCourse(courseId, result.data);
      res.json(updatedCourse);
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ message: "Server error updating course" });
    }
  });

  app.put("/api/courses/:id/publish", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to update this course" });
      }
      
      const published = req.body.published === true;
      const updatedCourse = await storage.updateCourse(courseId, { published });
      res.json(updatedCourse);
    } catch (error) {
      console.error("Publish course error:", error);
      res.status(500).json({ message: "Server error publishing course" });
    }
  });

  app.delete("/api/courses/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id, 10);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to delete this course" });
      }
      
      const deleted = await storage.deleteCourse(courseId);
      if (deleted) {
        res.json({ message: "Course deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete course" });
      }
    } catch (error) {
      console.error("Delete course error:", error);
      res.status(500).json({ message: "Server error deleting course" });
    }
  });

  // Module routes
  app.get("/api/modules", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.query;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      const courseIdNum = parseInt(courseId as string, 10);
      const modules = await storage.getModulesByCourse(courseIdNum);
      
      res.json(modules);
    } catch (error) {
      console.error("Get modules error:", error);
      res.status(500).json({ message: "Server error fetching modules" });
    }
  });

  app.post("/api/modules", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const result = insertModuleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid module data", errors: result.error.format() });
      }
      
      const moduleData = result.data;
      
      // Verify course exists and user has permission
      const course = await storage.getCourse(moduleData.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to add modules to this course" });
      }
      
      // Create the module
      const module = await storage.createModule(moduleData);
      
      res.status(201).json(module);
    } catch (error) {
      console.error("Create module error:", error);
      res.status(500).json({ message: "Server error creating module" });
    }
  });

  app.put("/api/modules/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Verify course exists and user has permission
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to update modules in this course" });
      }
      
      const result = insertModuleSchema.partial().omit({ courseId: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid module data", errors: result.error.format() });
      }
      
      const updatedModule = await storage.updateModule(moduleId, result.data);
      res.json(updatedModule);
    } catch (error) {
      console.error("Update module error:", error);
      res.status(500).json({ message: "Server error updating module" });
    }
  });

  app.delete("/api/modules/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const moduleId = parseInt(req.params.id, 10);
      const module = await storage.getModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      // Verify course exists and user has permission
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to delete modules in this course" });
      }
      
      const deleted = await storage.deleteModule(moduleId);
      if (deleted) {
        res.json({ message: "Module deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete module" });
      }
    } catch (error) {
      console.error("Delete module error:", error);
      res.status(500).json({ message: "Server error deleting module" });
    }
  });

  // Assignment routes
  app.get("/api/assignments", async (req: Request, res: Response) => {
    try {
      const { moduleId, courseId } = req.query;
      
      if (moduleId) {
        const moduleIdNum = parseInt(moduleId as string, 10);
        const assignments = await storage.getAssignmentsByModule(moduleIdNum);
        return res.json(assignments);
      } else if (courseId) {
        const courseIdNum = parseInt(courseId as string, 10);
        const assignments = await storage.getAssignmentsByCourse(courseIdNum);
        return res.json(assignments);
      } else {
        return res.status(400).json({ message: "Module ID or Course ID is required" });
      }
    } catch (error) {
      console.error("Get assignments error:", error);
      res.status(500).json({ message: "Server error fetching assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(assignment);
    } catch (error) {
      console.error("Get assignment error:", error);
      res.status(500).json({ message: "Server error fetching assignment" });
    }
  });

  app.post("/api/assignments", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const result = insertAssignmentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid assignment data", errors: result.error.format() });
      }
      
      const assignmentData = result.data;
      
      // Verify module exists and user has permission
      const module = await storage.getModule(assignmentData.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to add assignments to this module" });
      }
      
      // Create the assignment
      const assignment = await storage.createAssignment(assignmentData);
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({ message: "Server error creating assignment" });
    }
  });

  app.put("/api/assignments/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify module and course exist and user has permission
      const module = await storage.getModule(assignment.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to update assignments in this module" });
      }
      
      const result = insertAssignmentSchema.partial().omit({ moduleId: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid assignment data", errors: result.error.format() });
      }
      
      const updatedAssignment = await storage.updateAssignment(assignmentId, result.data);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Update assignment error:", error);
      res.status(500).json({ message: "Server error updating assignment" });
    }
  });

  app.delete("/api/assignments/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify module and course exist and user has permission
      const module = await storage.getModule(assignment.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to delete assignments in this module" });
      }
      
      const deleted = await storage.deleteAssignment(assignmentId);
      if (deleted) {
        res.json({ message: "Assignment deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete assignment" });
      }
    } catch (error) {
      console.error("Delete assignment error:", error);
      res.status(500).json({ message: "Server error deleting assignment" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", requireAuth, async (req: Request, res: Response) => {
    try {
      const { courseId, status, student } = req.query;
      
      if (courseId) {
        // For tutors, get enrollments for a specific course
        const courseIdNum = parseInt(courseId as string, 10);
        const course = await storage.getCourse(courseIdNum);
        
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Check if the user is a tutor of this course or an admin
        if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
          return res.status(403).json({ message: "You do not have permission to view enrollments for this course" });
        }
        
        const statusFilter = status as string | undefined;
        const enrollments = await storage.getEnrollmentsByCourse(courseIdNum, statusFilter);
        
        // Fetch student details for each enrollment
        const enrollmentsWithStudents = await Promise.all(
          enrollments.map(async (enrollment) => {
            const student = await storage.getUser(enrollment.studentId);
            return {
              ...enrollment,
              student: student ? {
                id: student.id,
                fullName: student.fullName,
                username: student.username,
                email: student.email
              } : null
            };
          })
        );
        
        return res.json(enrollmentsWithStudents);
      } else if (student === 'me' || (student && parseInt(student as string) === req.session.userId)) {
        // Get enrollments for the current student
        if (req.session.userRole !== 'student' && req.session.userRole !== 'admin') {
          return res.status(403).json({ message: "Only students can view their own enrollments" });
        }
        
        const enrollments = await storage.getEnrollmentsByStudent(req.session.userId!);
        
        // Fetch course details for each enrollment
        const enrollmentsWithCourses = await Promise.all(
          enrollments.map(async (enrollment) => {
            const course = await storage.getCourse(enrollment.courseId);
            let tutor = null;
            if (course && course.tutorId) {
              const tutorUser = await storage.getUser(course.tutorId);
              if (tutorUser) {
                tutor = {
                  id: tutorUser.id,
                  fullName: tutorUser.fullName
                };
              }
            }
            return {
              ...enrollment,
              course: course ? {
                ...course,
                tutor
              } : null
            };
          })
        );
        
        return res.json(enrollmentsWithCourses);
      } else {
        // Admin can view all enrollments
        if (req.session.userRole !== 'admin') {
          return res.status(403).json({ message: "Insufficient permissions" });
        }
        
        // This would be a paginated endpoint in a real app
        return res.status(400).json({ message: "Please specify a course ID or student" });
      }
    } catch (error) {
      console.error("Get enrollments error:", error);
      res.status(500).json({ message: "Server error fetching enrollments" });
    }
  });

  app.post("/api/courses/:slug/enroll", requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const course = await storage.getCourseBySlug(slug);
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      if (!course.published) {
        return res.status(403).json({ message: "Course is not available for enrollment" });
      }
      
      // Check if student is already enrolled
      const existing = await storage.getEnrollmentByStudentAndCourse(req.session.userId!, course.id);
      if (existing) {
        return res.status(400).json({ message: `You are already ${existing.status} in this course` });
      }
      
      // Create enrollment request
      const enrollment = await storage.createEnrollment({
        studentId: req.session.userId!,
        courseId: course.id,
        status: 'pending'
      });
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error("Enroll in course error:", error);
      res.status(500).json({ message: "Server error processing enrollment" });
    }
  });

  app.put("/api/enrollments/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const enrollmentId = parseInt(req.params.id, 10);
      const enrollment = await storage.getEnrollment(enrollmentId);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      // Verify course and permissions
      const course = await storage.getCourse(enrollment.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to manage enrollments for this course" });
      }
      
      // Validate status
      const { status } = req.body;
      if (!status || !['pending', 'active', 'completed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid enrollment status" });
      }
      
      const updatedEnrollment = await storage.updateEnrollment(enrollmentId, { status });
      res.json(updatedEnrollment);
    } catch (error) {
      console.error("Update enrollment error:", error);
      res.status(500).json({ message: "Server error updating enrollment" });
    }
  });

  // Submission routes
  app.get("/api/submissions", requireAuth, async (req: Request, res: Response) => {
    try {
      const { assignmentId, student } = req.query;
      
      if (assignmentId) {
        const assignmentIdNum = parseInt(assignmentId as string, 10);
        const assignment = await storage.getAssignment(assignmentIdNum);
        
        if (!assignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }
        
        // Verify module and course
        const module = await storage.getModule(assignment.moduleId);
        if (!module) {
          return res.status(404).json({ message: "Module not found" });
        }
        
        const course = await storage.getCourse(module.courseId);
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        // Students can only see their own submissions
        if (req.session.userRole === 'student') {
          const submission = await storage.getSubmissionByStudentAndAssignment(
            req.session.userId!, 
            assignmentIdNum
          );
          
          if (!submission) {
            return res.json(null);
          }
          
          return res.json(submission);
        }
        
        // Tutors can only see submissions for their courses
        if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
          return res.status(403).json({ message: "You do not have permission to view submissions for this assignment" });
        }
        
        // Fetch all submissions for this assignment
        const submissions = await storage.getSubmissionsByAssignment(assignmentIdNum);
        
        // Fetch student details for each submission
        const submissionsWithStudents = await Promise.all(
          submissions.map(async (submission) => {
            const student = await storage.getUser(submission.studentId);
            return {
              ...submission,
              student: student ? {
                id: student.id,
                fullName: student.fullName,
                username: student.username,
                email: student.email
              } : null
            };
          })
        );
        
        return res.json(submissionsWithStudents);
      } else if (student === 'me' || (student && parseInt(student as string) === req.session.userId)) {
        // Get submissions for the current student
        const submissions = await storage.getSubmissionsByStudent(req.session.userId!);
        
        // Fetch assignment details for each submission
        const submissionsWithAssignments = await Promise.all(
          submissions.map(async (submission) => {
            const assignment = await storage.getAssignment(submission.assignmentId);
            return {
              ...submission,
              assignment: assignment || null
            };
          })
        );
        
        return res.json(submissionsWithAssignments);
      } else {
        return res.status(400).json({ message: "Assignment ID or student parameter is required" });
      }
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Server error fetching submissions" });
    }
  });

  app.post("/api/assignments/:id/submit", requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const assignmentId = parseInt(req.params.id, 10);
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Verify module and course
      const module = await storage.getModule(assignment.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if student is enrolled in this course
      const enrollment = await storage.getEnrollmentByStudentAndCourse(
        req.session.userId!,
        course.id
      );
      
      if (!enrollment || enrollment.status !== 'active') {
        return res.status(403).json({ message: "You must be enrolled in this course to submit assignments" });
      }
      
      // Check if student already submitted
      const existingSubmission = await storage.getSubmissionByStudentAndAssignment(
        req.session.userId!,
        assignmentId
      );
      
      if (existingSubmission) {
        return res.status(400).json({ message: "You have already submitted this assignment" });
      }
      
      // Validate submission
      const result = insertSubmissionSchema.pick({ content: true }).safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid submission data", errors: result.error.format() });
      }
      
      // Create submission
      const submission = await storage.createSubmission({
        assignmentId,
        studentId: req.session.userId!,
        content: result.data.content
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Submit assignment error:", error);
      res.status(500).json({ message: "Server error submitting assignment" });
    }
  });

  app.put("/api/submissions/:id", requireAuth, requireRole(['tutor', 'admin']), async (req: Request, res: Response) => {
    try {
      const submissionId = parseInt(req.params.id, 10);
      const submission = await storage.getSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Verify assignment, module, and course
      const assignment = await storage.getAssignment(submission.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const module = await storage.getModule(assignment.moduleId);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const course = await storage.getCourse(module.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check ownership (for tutors) or admin status
      if (req.session.userRole === 'tutor' && course.tutorId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to grade submissions for this course" });
      }
      
      // Validate submission update data
      const { feedback, score, graded } = req.body;
      
      if (score !== undefined && (score < 0 || score > assignment.maxScore)) {
        return res.status(400).json({ message: `Score must be between 0 and ${assignment.maxScore}` });
      }
      
      const updateData: any = {};
      if (feedback !== undefined) updateData.feedback = feedback;
      if (score !== undefined) updateData.score = score;
      if (graded !== undefined) updateData.graded = graded;
      
      const updatedSubmission = await storage.updateSubmission(submissionId, updateData);
      res.json(updatedSubmission);
      
      // Check for badge criteria if submission is now graded
      if (graded && !submission.graded) {
        // Handle badge awarding logic
        const badges = await storage.getBadges();
        const studentId = submission.studentId;
        
        for (const badge of badges) {
          const criteria = badge.criteria as any;
          
          // Example criteria: Perfect score on any assignment
          if (criteria.type === 'perfect_score' && score === assignment.maxScore) {
            // Check if student already has this badge
            const userBadges = await storage.getUserBadges(studentId);
            const hasBadge = userBadges.some(ub => ub.badge.id === badge.id);
            
            if (!hasBadge) {
              await storage.awardBadge({
                userId: studentId,
                badgeId: badge.id
              });
              // In a real app, you might want to notify the student
            }
          }
          
          // Other criteria could be implemented similarly
        }
      }
    } catch (error) {
      console.error("Update submission error:", error);
      res.status(500).json({ message: "Server error updating submission" });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req: Request, res: Response) => {
    try {
      const badges = await storage.getBadges();
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ message: "Server error fetching badges" });
    }
  });

  app.get("/api/users/:userId/badges", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId === 'me' 
        ? req.session.userId! 
        : parseInt(req.params.userId, 10);
      
      // Students can only see their own badges
      if (req.session.userRole === 'student' && userId !== req.session.userId) {
        return res.status(403).json({ message: "You do not have permission to view other users' badges" });
      }
      
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Get user badges error:", error);
      res.status(500).json({ message: "Server error fetching user badges" });
    }
  });

  app.post("/api/badges", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const result = insertBadgeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid badge data", errors: result.error.format() });
      }
      
      const badge = await storage.createBadge(result.data);
      res.status(201).json(badge);
    } catch (error) {
      console.error("Create badge error:", error);
      res.status(500).json({ message: "Server error creating badge" });
    }
  });

  app.put("/api/badges/:id", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const badgeId = parseInt(req.params.id, 10);
      const badge = await storage.getBadge(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      const result = insertBadgeSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid badge data", errors: result.error.format() });
      }
      
      const updatedBadge = await storage.updateBadge(badgeId, result.data);
      res.json(updatedBadge);
    } catch (error) {
      console.error("Update badge error:", error);
      res.status(500).json({ message: "Server error updating badge" });
    }
  });

  app.delete("/api/badges/:id", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const badgeId = parseInt(req.params.id, 10);
      const badge = await storage.getBadge(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      const deleted = await storage.deleteBadge(badgeId);
      if (deleted) {
        res.json({ message: "Badge deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete badge" });
      }
    } catch (error) {
      console.error("Delete badge error:", error);
      res.status(500).json({ message: "Server error deleting badge" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/student", requireAuth, requireRole(['student']), async (req: Request, res: Response) => {
    try {
      const progress = await storage.getStudentProgress(req.session.userId!);
      res.json(progress);
    } catch (error) {
      console.error("Student analytics error:", error);
      res.status(500).json({ message: "Server error fetching student analytics" });
    }
  });

  app.get("/api/analytics/tutor", requireAuth, requireRole(['tutor']), async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getTutorAnalytics(req.session.userId!);
      res.json(analytics);
    } catch (error) {
      console.error("Tutor analytics error:", error);
      res.status(500).json({ message: "Server error fetching tutor analytics" });
    }
  });

  app.get("/api/analytics/admin", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Admin analytics error:", error);
      res.status(500).json({ message: "Server error fetching admin analytics" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      
      // Don't expose passwords
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Server error fetching users" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole(['admin']), async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { role, fullName, email } = req.body;
      const updateData: any = {};
      
      if (role) {
        if (!['student', 'tutor', 'admin'].includes(role)) {
          return res.status(400).json({ message: "Invalid role" });
        }
        updateData.role = role;
      }
      
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't expose password
      const safeUser = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt
      };
      
      res.json(safeUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error updating user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
