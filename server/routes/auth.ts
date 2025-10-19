import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const COOKIE_NAME = "auth_token";

// Helper to get a user by email
async function getUserByEmail(email: string) {
  const dbInstance = await db.getDb();
  if (!dbInstance) return null;
  
  const result = await dbInstance
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
}

// Helper to create a user
async function createUser(userData: {
  id: string;
  name: string;
  email: string;
  password: string;
  loginMethod: string;
  role: string;
}) {
  const dbInstance = await db.getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  await dbInstance.insert(users).values(userData);
}

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = nanoid();
    await createUser({
      id: userId,
      name: name || email.split("@")[0],
      email,
      password: hashedPassword,
      loginMethod: "email",
      role: "user",
    });

    // Generate JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, user: { id: userId, name: name || email.split("@")[0], email } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await getUserByEmail(email);

    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last signed in
    await db.upsertUser({
      id: user.id,
      lastSignedIn: new Date(),
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    // Set cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await db.getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

