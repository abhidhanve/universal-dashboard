import express from "express";
import authRouter from "./auth";
import projectsRouter from "./projects";
import sharedRouter from "./shared";
import { trackApiUsage, securityHeaders } from "../middleware/auth";

const router = express.Router();

// Add security headers to all API routes
router.use(securityHeaders);

// Add usage tracking to all API routes
router.use(trackApiUsage);

// ===========================================
// CLEAN WORKFLOW ROUTES ONLY
// ===========================================

// 1. Authentication routes (no auth required)
router.use("/auth", authRouter);

// 2. Project Management operations (require JWT authentication)
//    - Create projects with MongoDB connection
//    - Automatic schema analysis
//    - Generate shared links
router.use("/projects", projectsRouter);

// 3. Client Access routes (no authentication required)
//    - Access via shared tokens only
//    - Schema delivery and CRUD operations
router.use("/shared", sharedRouter);

// ===========================================
// API HEALTH AND INFO
// ===========================================

// API Health check
router.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "Universal Panel API OK",
    workflow: "Schema Analysis → Form Generation → Shared Links → Client Operations",
    timestamp: new Date().toISOString()
  });
});

// API Info
router.get("/", (req, res) => {
  res.json({
    message: "Universal Panel - Complete Workflow API",
    version: "2.0.0",
    workflow: {
      step1: "Developer Authentication → JWT Login",
      step2: "Project Creation → MongoDB connection + Schema Analysis", 
      step3: "Shared Link Generation → Secure client access tokens",
      step4: "Client Operations → INSERT/VIEW/DELETE via shared links"
    },
    endpoints: {
      auth: "/api/auth - Developer authentication",
      projects: "/api/projects - Project management & schema analysis",
      shared: "/api/shared/:token - Client access via shared links"
    }
  });
});

export default router;
