import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  modules, type Module, type InsertModule,
  assignments, type Assignment, type InsertAssignment,
  enrollments, type Enrollment, type InsertEnrollment,
  submissions, type Submission, type InsertSubmission,
  badges, type Badge, type InsertBadge,
  userBadges, type UserBadge, type InsertUserBadge
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import { slugify } from "./utils";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourseBySlug(slug: string): Promise<Course | undefined>;
  getCourses(filters?: { tutorId?: number, published?: boolean }): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Module operations
  getModule(id: number): Promise<Module | undefined>;
  getModulesByCourse(courseId: number): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, data: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  
  // Assignment operations
  getAssignment(id: number): Promise<Assignment | undefined>;
  getAssignmentsByModule(moduleId: number): Promise<Assignment[]>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined>;
  deleteAssignment(id: number): Promise<boolean>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number, status?: string): Promise<Enrollment[]>;
  getEnrollmentByStudentAndCourse(studentId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Submission operations
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined>;
  
  // Badge operations
  getBadge(id: number): Promise<Badge | undefined>;
  getBadges(): Promise<Badge[]>;
  createBadge(badge: InsertBadge): Promise<Badge>;
  updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined>;
  deleteBadge(id: number): Promise<boolean>;
  
  // User Badge operations
  getUserBadges(userId: number): Promise<{ badge: Badge, userBadge: UserBadge }[]>;
  awardBadge(userBadge: InsertUserBadge): Promise<UserBadge>;
  
  // Analytics
  getStudentProgress(studentId: number): Promise<any>;
  getTutorAnalytics(tutorId: number): Promise<any>;
  getAdminAnalytics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || 'student', // Default role
        createdAt: new Date()
      })
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    return course;
  }

  async getCourses(filters?: { tutorId?: number, published?: boolean }): Promise<Course[]> {
    let query = db.select().from(courses);
    
    if (filters?.tutorId) {
      query = query.where(eq(courses.tutorId, filters.tutorId));
    }
    
    if (filters?.published !== undefined) {
      query = query.where(eq(courses.published, filters.published));
    }
    
    return await query;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const slug = slugify(insertCourse.title);
    
    const [course] = await db
      .insert(courses)
      .values({
        ...insertCourse,
        slug,
        published: insertCourse.published || false,
        createdAt: new Date()
      })
      .returning();
    
    return course;
  }

  async updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined> {
    // If title is updated, also update the slug
    if (data.title) {
      data.slug = slugify(data.title);
    }
    
    const [updated] = await db
      .update(courses)
      .set(data)
      .where(eq(courses.id, id))
      .returning();
    
    return updated;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return result.rowCount > 0;
  }

  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    const result = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.order));
    
    return result;
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const [module] = await db
      .insert(modules)
      .values({
        ...insertModule,
        order: insertModule.order || 0
      })
      .returning();
    
    return module;
  }

  async updateModule(id: number, data: Partial<Module>): Promise<Module | undefined> {
    const [updated] = await db
      .update(modules)
      .set(data)
      .where(eq(modules.id, id))
      .returning();
    
    return updated;
  }

  async deleteModule(id: number): Promise<boolean> {
    const result = await db.delete(modules).where(eq(modules.id, id));
    return result.rowCount > 0;
  }

  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByModule(moduleId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.moduleId, moduleId))
      .orderBy(asc(assignments.dueDate));
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    const result = await db
      .select({
        assignment: assignments
      })
      .from(assignments)
      .innerJoin(modules, eq(assignments.moduleId, modules.id))
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(assignments.dueDate));
    
    return result.map(r => r.assignment);
  }

  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values({
        ...insertAssignment,
        maxScore: insertAssignment.maxScore || 100
      })
      .returning();
    
    return assignment;
  }

  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined> {
    const [updated] = await db
      .update(assignments)
      .set(data)
      .where(eq(assignments.id, id))
      .returning();
    
    return updated;
  }

  async deleteAssignment(id: number): Promise<boolean> {
    const result = await db.delete(assignments).where(eq(assignments.id, id));
    return result.rowCount > 0;
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number, status?: string): Promise<Enrollment[]> {
    let query = db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
    
    if (status) {
      query = query.where(eq(enrollments.status, status));
    }
    
    return await query;
  }

  async getEnrollmentByStudentAndCourse(studentId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.courseId, courseId)
        )
      );
    
    return enrollment;
  }

  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const now = new Date();
    
    const [enrollment] = await db
      .insert(enrollments)
      .values({
        ...insertEnrollment,
        status: insertEnrollment.status || 'pending',
        requestedAt: now,
        updatedAt: now
      })
      .returning();
    
    return enrollment;
  }

  async updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    data.updatedAt = new Date();
    
    const [updated] = await db
      .update(enrollments)
      .set(data)
      .where(eq(enrollments.id, id))
      .returning();
    
    return updated;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id));
    return result.rowCount > 0;
  }

  // Submission operations
  async getSubmission(id: number): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, studentId),
          eq(submissions.assignmentId, assignmentId)
        )
      )
      .orderBy(desc(submissions.submittedAt))
      .limit(1);
    
    return submission;
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values({
        ...insertSubmission,
        submittedAt: new Date(),
        feedback: "",
        score: null,
        graded: false
      })
      .returning();
    
    return submission;
  }

  async updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined> {
    const [updated] = await db
      .update(submissions)
      .set(data)
      .where(eq(submissions.id, id))
      .returning();
    
    return updated;
  }

  // Badge operations
  async getBadge(id: number): Promise<Badge | undefined> {
    const [badge] = await db.select().from(badges).where(eq(badges.id, id));
    return badge;
  }

  async getBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const [badge] = await db
      .insert(badges)
      .values(insertBadge)
      .returning();
    
    return badge;
  }

  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const [updated] = await db
      .update(badges)
      .set(data)
      .where(eq(badges.id, id))
      .returning();
    
    return updated;
  }

  async deleteBadge(id: number): Promise<boolean> {
    const result = await db.delete(badges).where(eq(badges.id, id));
    return result.rowCount > 0;
  }

  // User Badge operations
  async getUserBadges(userId: number): Promise<{ badge: Badge, userBadge: UserBadge }[]> {
    const results = await db
      .select({
        badge: badges,
        userBadge: userBadges
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId));
    
    return results;
  }

  async awardBadge(insertUserBadge: InsertUserBadge): Promise<UserBadge> {
    const [userBadge] = await db
      .insert(userBadges)
      .values({
        ...insertUserBadge,
        awardedAt: new Date()
      })
      .returning();
    
    return userBadge;
  }

  // Analytics
  async getStudentProgress(studentId: number): Promise<any> {
    // Get completed assignments
    const completedAssignments = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, studentId),
          eq(submissions.graded, true)
        )
      );

    // Get total number of courses enrolled
    const coursesEnrolled = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, 'approved')
        )
      );

    // Get average score
    const averageScore = await db
      .select({
        average: sql<number>`COALESCE(AVG(${submissions.score}), 0)::float`
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.studentId, studentId),
          eq(submissions.graded, true),
          sql`${submissions.score} IS NOT NULL`
        )
      );

    // Get badges earned
    const badgesEarned = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(userBadges)
      .where(eq(userBadges.userId, studentId));

    return {
      assignmentsCompleted: completedAssignments[0]?.count || 0,
      coursesEnrolled: coursesEnrolled[0]?.count || 0,
      averageScore: averageScore[0]?.average || 0,
      badgesEarned: badgesEarned[0]?.count || 0
    };
  }

  async getTutorAnalytics(tutorId: number): Promise<any> {
    // Get total courses created
    const totalCourses = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(courses)
      .where(eq(courses.tutorId, tutorId));

    // Get total enrollments across all courses
    const courseIds = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.tutorId, tutorId));

    const courseIdArray = courseIds.map(c => c.id);

    let totalEnrollments = 0;
    let pendingEnrollments = 0;

    if (courseIdArray.length > 0) {
      // Get total enrollments
      const enrollmentCounts = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`
        })
        .from(enrollments)
        .where(sql`${enrollments.courseId} IN (${courseIdArray.join(',')})`);

      totalEnrollments = enrollmentCounts[0]?.count || 0;

      // Get pending enrollments
      const pendingCounts = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`
        })
        .from(enrollments)
        .where(
          and(
            sql`${enrollments.courseId} IN (${courseIdArray.join(',')})`,
            eq(enrollments.status, 'pending')
          )
        );

      pendingEnrollments = pendingCounts[0]?.count || 0;
    }

    return {
      totalCourses: totalCourses[0]?.count || 0,
      totalEnrollments,
      pendingEnrollments,
      averageEnrollmentsPerCourse: totalCourses[0]?.count ? 
        (totalEnrollments / totalCourses[0]?.count) : 0
    };
  }

  async getAdminAnalytics(): Promise<any> {
    // Total users
    const totalUsers = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(users);

    // Users by role
    const studentCount = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(users)
      .where(eq(users.role, 'student'));

    const tutorCount = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(users)
      .where(eq(users.role, 'tutor'));

    const adminCount = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(users)
      .where(eq(users.role, 'admin'));

    // Total courses
    const totalCourses = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(courses);

    // Published courses
    const publishedCourses = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(courses)
      .where(eq(courses.published, true));

    // Total enrollments
    const totalEnrollments = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(enrollments);

    // Active enrollments
    const activeEnrollments = await db
      .select({
        count: sql<number>`cast(count(*) as integer)`
      })
      .from(enrollments)
      .where(eq(enrollments.status, 'approved'));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      usersByRole: {
        students: studentCount[0]?.count || 0,
        tutors: tutorCount[0]?.count || 0,
        admins: adminCount[0]?.count || 0
      },
      totalCourses: totalCourses[0]?.count || 0,
      publishedCourses: publishedCourses[0]?.count || 0,
      totalEnrollments: totalEnrollments[0]?.count || 0,
      activeEnrollments: activeEnrollments[0]?.count || 0
    };
  }
}

export const storage = new DatabaseStorage();