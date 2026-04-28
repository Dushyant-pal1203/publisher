import { type Request, type Response, type NextFunction } from "express";
import {
  getAdminToken,
  verifyAdminToken,
  type AdminUser,
} from "../lib/admin-auth";

declare global {
  namespace Express {
    interface User extends AdminUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;
      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request["isAuthenticated"];

  const token = getAdminToken(req);

  if (token) {
    const user = await verifyAdminToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}
