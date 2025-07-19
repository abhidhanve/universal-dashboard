import "dotenv/config";
import express from "express";
import cors from "cors";
import indexRouter from "./src/routes/_index";
import { prisma } from "./db";



const PORT = Number(process.env.PORT) || 9090;

const app = express();

app.use(cors(
  // Uncomment the next line to restrict CORS to a specific frontend URL
  { origin: process.env.FRONTEND_URL || "http://localhost:3000" ,
    credentials: true , // Allow credentials if needed,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
)); 
app.use(express.json());

app.use("/", indexRouter);
app.use("*", (req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
  prisma.$connect();
});
