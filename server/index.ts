import "dotenv/config";
import express from "express";
import cors from "cors";
import { frontendUrl, allowedOrigins } from "./config";
import apiRouter from "./src/routes/api";

const PORT = Number(process.env.PORT) || 9090;
const app = express();

// CORS Configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===========================================
// CLEAN WORKFLOW API ROUTES
// ===========================================
// All routes are now managed through /api
// - /api/auth → Developer authentication
// - /api/projects → Project management + schema analysis + shared link generation  
// - /api/shared → Client access via shared tokens (no auth)
app.use("/api", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "Universal Panel Server OK",
    workflow: "Schema Analysis → Form Generation → Shared Links → Client Operations", 
    server: `${req.protocol}://${req.get("host")}`,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Universal Panel - Complete Workflow Server",
    description: "MongoDB Schema Analysis & Client Access Management",
    server: `${req.protocol}://${req.get("host")}`,
    timestamp: new Date().toISOString(),
    workflow: {
      step1: "Developer Authentication → /api/auth",
      step2: "Project Creation & Schema Analysis → /api/projects", 
      step3: "Shared Link Generation → /api/projects/:id/share",
      step4: "Client Operations → /api/shared/:token"
    },
    endpoints: {
      health: "/health",
      api: "/api - Complete workflow API",
      auth: "/api/auth - Developer authentication",
      projects: "/api/projects - Project management & schema analysis",
      shared: "/api/shared/:token - Client access via shared links"
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: "Endpoint not found", 
    path: req.path,
    method: req.method,
    availableEndpoints: ["/api/auth", "/api/projects", "/api/shared/:token"]
  });
});

// Error handler  
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Universal Panel Server running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${frontendUrl}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 Workflow: Schema Analysis → Form Generation → Shared Links → Client Operations`);
  console.log(`🔧 Routes: /api/auth | /api/projects | /api/shared/:token`);
});

