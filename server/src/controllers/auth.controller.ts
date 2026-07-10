import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/config/db";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { hashToken } from "@/utils/hashToken";
import { AppError } from "@/middleware/errorHandler";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// Helper: sets the refresh token as an httpOnly cookie
function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new AppError("Name, email, and password are required", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        // Only allow STUDENT at signup — never trust a client-supplied role
        // for anything higher-privilege. Instructor/admin accounts should be
        // created through a separate, protected flow later.
        role: "STUDENT",
      },
    });

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      status: "ok",
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const passwordToCompare = existingUser?.passwordHash ?? "$2a$10$invalidsaltinvalidsaltinvalidsa";
    const checkPassword = await bcrypt.compare(password, passwordToCompare);

    if (!existingUser || !checkPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const payload = { id: existingUser.id, email: existingUser.email, role: existingUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    res.status(200).json({
      status: "ok",
      accessToken,
      user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role },
    });

  } catch (error) {
    next(error);
  }
}

export async function refreshAccessToken(req: Request, res: Response, next: NextFunction) {
  try {

    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    
    if (!refreshToken) {
      throw new AppError("Refresh token is missing", 401);
    }

    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Refresh token is invalid or expired", 401);
    }

    const hashedToken = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashedToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError("Refresh token is invalid or revoked", 401);
    }

    if (storedToken.revokedAt !== null) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppError("Refresh token reuse detected. All sessions revoked.", 401);
    }

    // Rotate: revoke the token just used, then issue a fresh pair
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newPayload = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(newRefreshToken),
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, newRefreshToken);

    res.status(200).json({
      status: "ok",
      accessToken: newAccessToken,
    });

  }catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    
    if (refreshToken) {

      const hashedToken = hashToken(refreshToken);

      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashedToken },
        include: { user: true },
      });

      if(storedToken && storedToken.revokedAt === null) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        });
      }
    }

    res.clearCookie(REFRESH_COOKIE_NAME);
    res.status(200).json({
      status: "ok",
      message: "Logged out successfully",
    });
  }catch (error) {
    next(error);
  }
}