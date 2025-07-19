import "dotenv/config";
import express from "express";
import cors from "cors";
import indexRouter from "./src/routes/_index";
import { prisma, connectWithRetry, keepConnectionAlive } from "./db";

const PORT = Number(process.env.PORT) || 9090;
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/", indexRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});


app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  
  // Connect to database with retry logic
  console.log("Connecting to the database...");
  const connected = await connectWithRetry();
  
  if (connected) {
    // Set up periodic keepalive for Neon database (every 5 minutes)
    setInterval(keepConnectionAlive, 5 * 60 * 1000);
    console.log("Database keepalive scheduled every 5 minutes");
  } else {
    console.warn("Server started without database connection. Some features may not work.");
  }
});

