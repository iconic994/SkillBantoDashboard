import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "creator"] }).default("creator").notNull(),
  active: boolean("active").default(true),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  courseId: integer("course_id").references(() => courses.id),
  creatorId: integer("creator_id").references(() => users.id),
  status: text("status", { enum: ["pending", "active", "cancelled"] }).default("pending"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  driveLink: text("drive_link").notNull(),
  creatorId: integer("creator_id").references(() => users.id),
});

export const pricing = pgTable("pricing", {
  id: serial("id").primaryKey(), 
  plan: text("plan", { enum: ["basic", "pro", "enterprise"] }).notNull(),
  features: json("features").notNull(),
  price: integer("price").notNull(),
});

export const creatorPlans = pgTable("creator_plans", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => users.id),
  planId: integer("plan_id").references(() => pricing.id),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  active: boolean("active").default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  email: true,
  phone: true,
  courseId: true,
  status: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  name: true,
  driveLink: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Pricing = typeof pricing.$inferSelect;
export type CreatorPlan = typeof creatorPlans.$inferSelect;
