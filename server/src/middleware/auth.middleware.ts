import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/jwt";
import { AppError } from "@/middleware/errorHandler";
import { Role } from "@prisma/client";


export function protectRoute(req: Request, res: Response, next: NextFunction) {

    try{
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Not authenticated. No token provided.", 401);
        }
        
        const token = authHeader.slice(7); // Remove "Bearer " prefix
        
        let payload; 

        try {
            payload = verifyAccessToken(token);
        } catch (error) {
            throw new AppError("Invalid or expired token.", 401);
        }

        req.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role as Role,
        };

        next();
    }catch (error) {
        next(error);
    }
}

export function AuthorizeRoles(...allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {

            if (!req.user) {
                throw new AppError("User information is missing in the request.", 401);
            }
            
            if (!allowedRoles.includes(req.user.role)) {
                return next(new AppError("You do not have permission to perform this action.", 403));
            }

            next();
        }catch (error) {
            next(error);
        }
    };   
}
