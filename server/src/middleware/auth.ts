import type { Request, Response, NextFunction } from "express";
import { getAuthTokenFromHeader } from "../../utils";
import jwt from "jsonwebtoken";
import type { User } from "../types/custom";

// Express.Request is augmented via types elsewhere, so TS knows req.user can exist.

export function authorisedOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getAuthTokenFromHeader(req);

  if (!token)
    return res.sendStatus(401); // Unauthorized: no token provided

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err, user) => {
      if (err) return res.status(401).json({ invalidToken: true }); // Unauthorized: token error

      req.user = user as User;

      if (!req.user) return res.status(401).json({ invalidToken: true });

      next();
    }
  );
}

export function unauthorisedOnly(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getAuthTokenFromHeader(req);

  if (!token) return next();

  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err, user) => {
      if (!err) return res.sendStatus(403); // Forbidden: already logged in
      next();
    }
  );
}
