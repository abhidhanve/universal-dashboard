import express from "express";
import exampleRouter from "./example";
import testAuthRouter from "./test-auth";
import { prisma, connectWithRetry } from "../../db";
// import authRouter from "./auth";
// import userRouter from "./user";
// import databaseRouter from "./database";
// import artifactRouter from "./artifact";
// import collectionRouter from "./collection";

const router = express.Router();

router.use("/example", exampleRouter);
router.use("/test-auth", testAuthRouter);
// router.use("/auth", authRouter);
// router.use("/user", userRouter);
// router.use("/database", databaseRouter);
// router.use("/artifact", artifactRouter);
// router.use("/collection", collectionRouter);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Database health check endpoint
router.get("/health/db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: "Database connected", 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.log("Database health check failed, attempting reconnect...");
    const reconnected = await connectWithRetry(2, 1000);
    
    if (reconnected) {
      res.status(200).json({ 
        status: "Database reconnected successfully", 
        timestamp: new Date().toISOString() 
      });
    } else {
      res.status(503).json({ 
        status: "Database connection failed", 
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString() 
      });
    }
  }
});

router.get("/", (req, res) => {
  res.json({
    message: "Backend running successfully",
    server: `${req.protocol}://${req.get("host")}`,
    timestamp: new Date().toISOString()
  });
});

router.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.path });
});

export default router;
