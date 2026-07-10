import { Router } from "express";
import { register, login, refreshAccessToken, logout } from "@/controllers/auth.controller";
import { protectRoute } from "@/middleware/auth.middleware";

const router = Router();

// POST /api/auth/register - create a new account
router.post("/register", register);

// POST /api/auth/login - authenticate and receive tokens
router.post("/login", login);

// POST /api/auth/refresh - get a new access token using the refresh cookie
router.post("/refresh", refreshAccessToken);

// POST /api/auth/logout - revoke refresh token and clear cookie
router.post("/logout", logout);

// GET /api/auth/me - protected route, proves `protect` middleware works
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({
    status: "ok",
    user: req.user,
  });
});

export default router;
