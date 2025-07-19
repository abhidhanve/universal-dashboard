import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/generate-token", (req, res) => {
  const testUser = {
    id: 1,
    username: "testuser"
  };

  const token = jwt.sign(
    testUser, 
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: '1h' }
  );

  res.json({ 
    token,
    user: testUser,
    message: "Test token generated successfully"
  });
});

// Test route to verify a token
router.post("/verify-token", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    res.json({ message: "Token is valid", user });
  });
});

export default router;
