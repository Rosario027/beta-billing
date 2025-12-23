import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { pool } from "../db";
import { authStorage } from "./storage";

const PgSession = ConnectPgSimple(session);

declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      claims: {
        sub: string;
      };
    }
  }
}

export async function setupAuth(app: Express) {
  // Use PostgreSQL session store if DATABASE_URL is available
  const sessionStore = process.env.DATABASE_URL
    ? new PgSession({
        pool: pool,
        tableName: "sessions",
        createTableIfMissing: true,
      })
    : undefined;

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    })
  );

  // Simple middleware to attach user to request
  app.use(async (req: any, res, next) => {
    if (req.session?.userId) {
      const user = await authStorage.getUser(req.session.userId);
      if (user) {
        req.user = {
          ...user,
          claims: { sub: user.id },
        };
      }
    }
    next();
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function registerAuthRoutes(app: Express) {
  // Get current user
  app.get("/api/auth/user", (req: any, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Simple login (for development/demo)
  app.post("/api/auth/login", async (req: any, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    // Get or create user
    let user = await authStorage.getUserByEmail(email);
    if (!user) {
      user = await authStorage.upsertUser({
        email,
        firstName: email.split("@")[0],
      });
    }

    req.session.userId = user.id;
    res.json(user);
  });

  // Logout
  app.post("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Legacy GET logout endpoint
  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });

  // Login page redirect
  app.get("/api/login", (req, res) => {
    res.redirect("/");
  });
}
