import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
}