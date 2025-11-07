// server/src/controllers/userController.js
import { getLogger } from "#utils/logger.js";
import * as authService from "#services/authService.js";

const logger = getLogger(import.meta.url);

/* =============================================================================
 * USER CONTROLLER - General User Profile Operations
 * Handles user profile viewing and updates for all user types
 * ========================================================================== */

// GET /api/users/me - Get current user's profile
export async function getMyProfile(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;

  try {
    const profile = await authService.getUserProfile(userId);

    if (!profile) {
      logger.warn("Profile not found", { userId });
      return res.status(404).json({ message: "Profile not found" });
    }

    logger.debug("Retrieved user profile", { userId });
    return res.json({ user: profile });
  } catch (err) {
    logger.error("Failed to fetch user profile", {
      error: err.message,
      userId,
    });
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}

// PATCH /api/users/me - Update current user's profile
export async function updateMyProfile(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;
  const updates = req.body; // Validated by middleware

  try {
    const updatedProfile = await authService.updateUserProfile(userId, updates);

    logger.info("User profile updated", {
      userId,
      fields: Object.keys(updates),
    });
    return res.json({
      message: "Profile updated successfully",
      user: updatedProfile,
    });
  } catch (err) {
    logger.error("Failed to update user profile", {
      error: err.message,
      userId,
    });

    if (err.message.includes("not found")) {
      return res.status(404).json({ message: err.message });
    }

    return res.status(500).json({ message: "Failed to update profile" });
  }
}

// GET /api/users/me/info - Get basic user info (lightweight for session/display)
export async function getMyBasicInfo(req, res) {
  res.set({ "Cache-Control": "no-store" });
  const userId = req.session?.userId;

  try {
    const info = await authService.getBasicUserInfo(userId);

    if (!info) {
      logger.warn("User info not found", { userId });
      return res.status(404).json({ message: "User not found" });
    }

    logger.debug("Retrieved basic user info", { userId });
    return res.json({ user: info });
  } catch (err) {
    logger.error("Failed to fetch user info", {
      error: err.message,
      userId,
    });
    return res.status(500).json({ message: "Failed to fetch user info" });
  }
}
