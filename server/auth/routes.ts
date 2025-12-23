import type { Express, Request, Response } from "express";
import { getUserByUsername, createUser } from "./index";

// Extend session data
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function registerAuthRoutes(app: Express) {
  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { getUserById } = await import("./index");
    const user = await getUserById(req.session.userId);
    
    if (!user) {
      req.session.userId = undefined;
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });

  // Simple login (auto-create demo user)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    let user = await getUserByUsername(username);

    if (!user) {
      // Auto-create user for demo purposes
      user = await createUser(username, `${username}@example.com`);
    }

    req.session.userId = user.id;
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });
}
