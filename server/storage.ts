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
import { slugify } from "./utils";

// Interface for storage operations
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private modules: Map<number, Module>;
  private assignments: Map<number, Assignment>;
  private enrollments: Map<number, Enrollment>;
  private submissions: Map<number, Submission>;
  private badges: Map<number, Badge>;
  private userBadges: Map<number, UserBadge>;
  
  private userId: number;
  private courseId: number;
  private moduleId: number;
  private assignmentId: number;
  private enrollmentId: number;
  private submissionId: number;
  private badgeId: number;
  private userBadgeId: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.assignments = new Map();
    this.enrollments = new Map();
    this.submissions = new Map();
    this.badges = new Map();
    this.userBadges = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.moduleId = 1;
    this.assignmentId = 1;
    this.enrollmentId = 1;
    this.submissionId = 1;
    this.badgeId = 1;
    this.userBadgeId = 1;
    
    // Create default admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      email: 'admin@learnsmart.com',
      fullName: 'System Administrator',
      totpSecret: '3hnvnk4yt73eiuhqskuy6tdyr5tbect2'
    });
    
    // Create default tutor
    this.createUser({
      username: 'tutor',
      password: 'tutor123',
      role: 'tutor',
      email: 'tutor@learnsmart.com',
      fullName: 'Demo Tutor',
      totpSecret: 'gezdgnbvgy3tqojqgezdgnbvgy3tqojq'
    });
    
    // Create default student
    this.createUser({
      username: 'student',
      password: 'student123',
      role: 'student',
      email: 'student@learnsmart.com',
      fullName: 'Demo Student',
      totpSecret: 'ifascult7gfazhptqifascult7gfazhpt'
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(course => course.slug === slug);
  }
  
  async getCourses(filters?: { tutorId?: number, published?: boolean }): Promise<Course[]> {
    let courses = Array.from(this.courses.values());
    
    if (filters) {
      if (filters.tutorId !== undefined) {
        courses = courses.filter(course => course.tutorId === filters.tutorId);
      }
      
      if (filters.published !== undefined) {
        courses = courses.filter(course => course.published === filters.published);
      }
    }
    
    return courses;
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const slug = slugify(insertCourse.title);
    const course: Course = { 
      ...insertCourse, 
      id, 
      slug, 
      createdAt: new Date() 
    };
    this.courses.set(id, course);
    return course;
  }
  
  async updateCourse(id: number, data: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...data };
    
    // Update slug if title changes
    if (data.title && data.title !== course.title) {
      updatedCourse.slug = slugify(data.title);
    }
    
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }
  
  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    return this.modules.get(id);
  }
  
  async getModulesByCourse(courseId: number): Promise<Module[]> {
    return Array.from(this.modules.values())
      .filter(module => module.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }
  
  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = this.moduleId++;
    const module: Module = { ...insertModule, id };
    this.modules.set(id, module);
    return module;
  }
  
  async updateModule(id: number, data: Partial<Module>): Promise<Module | undefined> {
    const module = this.modules.get(id);
    if (!module) return undefined;
    
    const updatedModule = { ...module, ...data };
    this.modules.set(id, updatedModule);
    return updatedModule;
  }
  
  async deleteModule(id: number): Promise<boolean> {
    return this.modules.delete(id);
  }
  
  // Assignment operations
  async getAssignment(id: number): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAssignmentsByModule(moduleId: number): Promise<Assignment[]> {
    return Array.from(this.assignments.values())
      .filter(assignment => assignment.moduleId === moduleId);
  }
  
  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    const modules = await this.getModulesByCourse(courseId);
    const moduleIds = modules.map(module => module.id);
    
    return Array.from(this.assignments.values())
      .filter(assignment => moduleIds.includes(assignment.moduleId));
  }
  
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = this.assignmentId++;
    const assignment: Assignment = { ...insertAssignment, id };
    this.assignments.set(id, assignment);
    return assignment;
  }
  
  async updateAssignment(id: number, data: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...data };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }
  
  async deleteAssignment(id: number): Promise<boolean> {
    return this.assignments.delete(id);
  }
  
  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }
  
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.studentId === studentId);
  }
  
  async getEnrollmentsByCourse(courseId: number, status?: string): Promise<Enrollment[]> {
    let enrollments = Array.from(this.enrollments.values())
      .filter(enrollment => enrollment.courseId === courseId);
    
    if (status) {
      enrollments = enrollments.filter(enrollment => enrollment.status === status);
    }
    
    return enrollments;
  }
  
  async getEnrollmentByStudentAndCourse(studentId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values())
      .find(enrollment => 
        enrollment.studentId === studentId && 
        enrollment.courseId === courseId
      );
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentId++;
    const enrollment: Enrollment = { 
      ...insertEnrollment, 
      id, 
      requestedAt: new Date(),
      updatedAt: new Date()
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async updateEnrollment(id: number, data: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { 
      ...enrollment, 
      ...data,
      updatedAt: new Date()
    };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollments.delete(id);
  }
  
  // Submission operations
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.assignmentId === assignmentId);
  }
  
  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.studentId === studentId);
  }
  
  async getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values())
      .find(submission => 
        submission.studentId === studentId && 
        submission.assignmentId === assignmentId
      );
  }
  
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.submissionId++;
    const submission: Submission = { 
      ...insertSubmission, 
      id, 
      submittedAt: new Date(),
      feedback: "",
      graded: false 
    };
    this.submissions.set(id, submission);
    return submission;
  }
  
  async updateSubmission(id: number, data: Partial<Submission>): Promise<Submission | undefined> {
    const submission = this.submissions.get(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...data };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  // Badge operations
  async getBadge(id: number): Promise<Badge | undefined> {
    return this.badges.get(id);
  }
  
  async getBadges(): Promise<Badge[]> {
    return Array.from(this.badges.values());
  }
  
  async createBadge(insertBadge: InsertBadge): Promise<Badge> {
    const id = this.badgeId++;
    const badge: Badge = { ...insertBadge, id };
    this.badges.set(id, badge);
    return badge;
  }
  
  async updateBadge(id: number, data: Partial<Badge>): Promise<Badge | undefined> {
    const badge = this.badges.get(id);
    if (!badge) return undefined;
    
    const updatedBadge = { ...badge, ...data };
    this.badges.set(id, updatedBadge);
    return updatedBadge;
  }
  
  async deleteBadge(id: number): Promise<boolean> {
    return this.badges.delete(id);
  }
  
  // User Badge operations
  async getUserBadges(userId: number): Promise<{ badge: Badge, userBadge: UserBadge }[]> {
    const userBadges = Array.from(this.userBadges.values())
      .filter(userBadge => userBadge.userId === userId);
    
    return userBadges.map(userBadge => {
      const badge = this.badges.get(userBadge.badgeId)!;
      return { badge, userBadge };
    }).filter(item => item.badge !== undefined);
  }
  
  async awardBadge(insertUserBadge: InsertUserBadge): Promise<UserBadge> {
    const id = this.userBadgeId++;
    const userBadge: UserBadge = { 
      ...insertUserBadge, 
      id, 
      awardedAt: new Date() 
    };
    this.userBadges.set(id, userBadge);
    return userBadge;
  }
  
  // Analytics
  async getStudentProgress(studentId: number): Promise<any> {
    const enrollments = await this.getEnrollmentsByStudent(studentId);
    const activeEnrollments = enrollments.filter(e => e.status === 'active');
    const submissions = await this.getSubmissionsByStudent(studentId);
    const userBadges = await this.getUserBadges(studentId);
    
    let courseProgress: { [key: number]: number } = {};
    
    for (const enrollment of activeEnrollments) {
      const courseId = enrollment.courseId;
      const course = await this.getCourse(courseId);
      if (!course) continue;
      
      const assignments = await this.getAssignmentsByCourse(courseId);
      if (assignments.length === 0) {
        courseProgress[courseId] = 100; // No assignments means 100% complete
        continue;
      }
      
      const submittedAssignments = submissions.filter(s => {
        const assignment = this.assignments.get(s.assignmentId);
        return assignment && assignments.some(a => a.id === assignment.id);
      });
      
      courseProgress[courseId] = Math.round((submittedAssignments.length / assignments.length) * 100);
    }
    
    const totalCourses = activeEnrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const pendingAssignments = Array.from(this.assignments.values())
      .filter(assignment => {
        const module = this.modules.get(assignment.moduleId);
        if (!module) return false;
        
        return activeEnrollments.some(e => e.courseId === module.courseId) && 
          !submissions.some(s => s.assignmentId === assignment.id);
      });
    
    return {
      totalCourses,
      completedCourses,
      activeEnrollments: activeEnrollments.length,
      pendingAssignments: pendingAssignments.length,
      badgesEarned: userBadges.length,
      courseProgress
    };
  }
  
  async getTutorAnalytics(tutorId: number): Promise<any> {
    const tutorCourses = await this.getCourses({ tutorId });
    const courseIds = tutorCourses.map(course => course.id);
    
    let courseEnrollments: { [key: number]: Enrollment[] } = {};
    let courseSubmissions: { [key: number]: Submission[] } = {};
    
    for (const courseId of courseIds) {
      courseEnrollments[courseId] = await this.getEnrollmentsByCourse(courseId);
      
      const assignments = await this.getAssignmentsByCourse(courseId);
      const assignmentIds = assignments.map(a => a.id);
      
      courseSubmissions[courseId] = Array.from(this.submissions.values())
        .filter(s => assignmentIds.includes(s.assignmentId));
    }
    
    return {
      totalCourses: tutorCourses.length,
      publishedCourses: tutorCourses.filter(c => c.published).length,
      totalStudents: new Set(
        Object.values(courseEnrollments)
          .flat()
          .filter(e => e.status === 'active')
          .map(e => e.studentId)
      ).size,
      totalEnrollments: Object.values(courseEnrollments).flat().length,
      activeEnrollments: Object.values(courseEnrollments)
        .flat()
        .filter(e => e.status === 'active').length,
      pendingEnrollments: Object.values(courseEnrollments)
        .flat()
        .filter(e => e.status === 'pending').length,
      totalSubmissions: Object.values(courseSubmissions).flat().length,
      gradedSubmissions: Object.values(courseSubmissions)
        .flat()
        .filter(s => s.graded).length,
      courseStatistics: tutorCourses.map(course => ({
        id: course.id,
        title: course.title,
        enrollments: courseEnrollments[course.id]?.length || 0,
        activeStudents: courseEnrollments[course.id]?.filter(e => e.status === 'active').length || 0,
        submissions: courseSubmissions[course.id]?.length || 0
      }))
    };
  }
  
  async getAdminAnalytics(): Promise<any> {
    const users = await this.getUsers();
    const courses = await this.getCourses();
    const enrollments = Array.from(this.enrollments.values());
    const submissions = Array.from(this.submissions.values());
    const badges = await this.getBadges();
    const userBadges = Array.from(this.userBadges.values());
    
    return {
      userStats: {
        total: users.length,
        students: users.filter(u => u.role === 'student').length,
        tutors: users.filter(u => u.role === 'tutor').length,
        admins: users.filter(u => u.role === 'admin').length
      },
      courseStats: {
        total: courses.length,
        published: courses.filter(c => c.published).length,
        drafts: courses.filter(c => !c.published).length
      },
      enrollmentStats: {
        total: enrollments.length,
        active: enrollments.filter(e => e.status === 'active').length,
        pending: enrollments.filter(e => e.status === 'pending').length,
        completed: enrollments.filter(e => e.status === 'completed').length,
        rejected: enrollments.filter(e => e.status === 'rejected').length
      },
      submissionStats: {
        total: submissions.length,
        graded: submissions.filter(s => s.graded).length,
        ungraded: submissions.filter(s => !s.graded).length
      },
      badgeStats: {
        total: badges.length,
        awarded: userBadges.length
      }
    };
  }
}

export const storage = new MemStorage();
