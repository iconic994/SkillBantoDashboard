import session from "express-session";
import { InsertUser, User, Student, Course, insertStudentSchema, insertCourseSchema } from "@shared/schema";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

interface Pricing {
  id: number;
  plan: string;
  features: string[];
  price: number;
}

interface CreatorPlan {
  id: number;
  creatorId: number;
  planId: number;
  startDate: Date;
  endDate: Date | null;
  active: boolean;
}

interface Notification {
  title: string;
  message: string;
  timestamp: Date;
}

interface AdminStats {
  creatorGrowth: number;
  notifications: Notification[];
  creatorStats: {
    [key: number]: {
      totalStudents: number;
      revenue: number;
      lastActive: string;
    };
  };
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Student methods
  createStudent(student: Omit<Student, "id" | "enrolledAt">): Promise<Student>;
  getStudentsByCreator(creatorId: number): Promise<Student[]>;
  updateStudentStatus(id: number, status: "pending" | "active" | "cancelled"): Promise<Student>;

  // Course methods  
  createCourse(course: Omit<Course, "id">): Promise<Course>;
  getCoursesByCreator(creatorId: number): Promise<Course[]>;
  deleteCourse(id: number): Promise<void>;

  // Admin methods
  getAllCreators(): Promise<User[]>;
  toggleCreatorAccess(id: number): Promise<User>;
  getAllCreatorPlans(): Promise<CreatorPlan[]>;
  getAdminStats(): Promise<AdminStats>;

  // Pricing methods
  getPricingPlans(): Promise<Pricing[]>;
  getActivePlan(creatorId: number): Promise<CreatorPlan | undefined>;
  upgradePlan(creatorId: number, planId: number): Promise<CreatorPlan>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private courses: Map<number, Course>;
  private pricing: Map<number, Pricing>;
  private creatorPlans: Map<number, CreatorPlan>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.courses = new Map();
    this.pricing = new Map();
    this.creatorPlans = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    const defaultPlans: Pricing[] = [
      {
        id: 1,
        plan: "basic",
        features: [
          "Up to 50 students",
          "Basic analytics",
          "Email support"
        ],
        price: 29
      },
      {
        id: 2,
        plan: "pro",
        features: [
          "Up to 200 students",
          "Advanced analytics",
          "Priority support",
          "Custom branding"
        ],
        price: 79
      },
      {
        id: 3,
        plan: "enterprise",
        features: [
          "Unlimited students",
          "Enterprise analytics",
          "24/7 support",
          "Custom branding",
          "API access"
        ],
        price: 199
      }
    ];

    defaultPlans.forEach(plan => this.pricing.set(plan.id, plan));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      active: true,
      role: insertUser.role || "creator"
    };
    this.users.set(id, user);
    return user;
  }

  async createStudent(student: Omit<Student, "id" | "enrolledAt">): Promise<Student> {
    const id = this.currentId++;
    const newStudent: Student = {
      ...student,
      id,
      enrolledAt: new Date(),
      status: student.status || "pending",
      courseId: student.courseId || null,
      creatorId: student.creatorId || null
    };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async getStudentsByCreator(creatorId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.creatorId === creatorId
    );
  }

  async updateStudentStatus(id: number, status: "pending" | "active" | "cancelled"): Promise<Student> {
    const student = this.students.get(id);
    if (!student) throw new Error("Student not found");

    const updated = { ...student, status };
    this.students.set(id, updated);
    return updated;
  }

  async createCourse(course: Omit<Course, "id">): Promise<Course> {
    const id = this.currentId++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async getCoursesByCreator(creatorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.creatorId === creatorId
    );
  }

  async deleteCourse(id: number): Promise<void> {
    this.courses.delete(id);
  }

  async getAllCreators(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "creator"
    );
  }

  async toggleCreatorAccess(id: number): Promise<User> {
    const creator = this.users.get(id);
    if (!creator) throw new Error("Creator not found");

    const updated = { ...creator, active: !creator.active };
    this.users.set(id, updated);
    return updated;
  }

  async getPricingPlans(): Promise<Pricing[]> {
    return Array.from(this.pricing.values());
  }

  async getActivePlan(creatorId: number): Promise<CreatorPlan | undefined> {
    return Array.from(this.creatorPlans.values()).find(
      plan => plan.creatorId === creatorId && plan.active
    );
  }

  async upgradePlan(creatorId: number, planId: number): Promise<CreatorPlan> {
    const currentPlan = await this.getActivePlan(creatorId);
    if (currentPlan) {
      currentPlan.active = false;
      this.creatorPlans.set(currentPlan.id, currentPlan);
    }

    const id = this.currentId++;
    const newPlan: CreatorPlan = {
      id,
      creatorId,
      planId,
      startDate: new Date(),
      endDate: null,
      active: true
    };

    this.creatorPlans.set(id, newPlan);
    return newPlan;
  }

  async getAllCreatorPlans(): Promise<CreatorPlan[]> {
    return Array.from(this.creatorPlans.values());
  }

  async getAdminStats(): Promise<AdminStats> {
    const creators = await this.getAllCreators();
    const lastMonthCreators = creators.filter(
      c => c.id < this.currentId - 5 // Simple simulation of growth
    ).length;
    const currentCreators = creators.length;
    const growth = lastMonthCreators ? ((currentCreators - lastMonthCreators) / lastMonthCreators) * 100 : 0;

    const creatorStats: AdminStats['creatorStats'] = {};
    for (const creator of creators) {
      const students = await this.getStudentsByCreator(creator.id);
      const plan = await this.getActivePlan(creator.id);
      const planDetails = plan ? this.pricing.get(plan.planId) : null;

      creatorStats[creator.id] = {
        totalStudents: students.length,
        revenue: planDetails ? planDetails.price : 0,
        lastActive: new Date().toLocaleDateString(), // In a real app, track actual last active time
      };
    }

    // Sample notifications
    const notifications: Notification[] = [
      {
        title: "New Creator Signup",
        message: "A new creator has joined the platform",
        timestamp: new Date(),
      },
      {
        title: "Subscription Alert",
        message: "2 creator subscriptions are due for renewal",
        timestamp: new Date(),
      },
    ];

    return {
      creatorGrowth: growth,
      notifications,
      creatorStats,
    };
  }
}

export const storage = new MemStorage();