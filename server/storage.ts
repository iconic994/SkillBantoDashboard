import session from "express-session";
import { InsertUser, User, Student, Course, insertStudentSchema, insertCourseSchema } from "@shared/schema";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private courses: Map<number, Course>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.courses = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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
}

export const storage = new MemStorage();