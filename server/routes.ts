import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertStudentSchema, insertCourseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).send("Admin access required");
    }
    next();
  };

  // Student routes
  app.post("/api/students", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent({
        ...validatedData,
        creatorId: req.user.id
      });
      res.json(student);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get("/api/students", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const students = await storage.getStudentsByCreator(req.user.id);
    res.json(students);
  });

  app.patch("/api/students/:id/status", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    try {
      const student = await storage.updateStudentStatus(
        parseInt(req.params.id),
        req.body.status
      );
      res.json(student);
    } catch (err) {
      res.status(404).json(err);
    }
  });

  // Course routes
  app.post("/api/courses", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    try {
      const validatedData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse({
        ...validatedData,
        creatorId: req.user.id
      });
      res.json(course);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get("/api/courses", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const courses = await storage.getCoursesByCreator(req.user.id);
    res.json(courses);
  });

  app.delete("/api/courses/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    try {
      await storage.deleteCourse(parseInt(req.params.id));
      res.sendStatus(200);
    } catch (err) {
      res.status(404).json(err);
    }
  });

  // Admin routes
  app.get("/api/admin/creators", isAdmin, async (req, res) => {
    const creators = await storage.getAllCreators();
    res.json(creators);
  });

  app.post("/api/admin/creators/:id/toggle", isAdmin, async (req, res) => {
    try {
      const creator = await storage.toggleCreatorAccess(parseInt(req.params.id));
      res.json(creator);
    } catch (err) {
      res.status(404).json(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
