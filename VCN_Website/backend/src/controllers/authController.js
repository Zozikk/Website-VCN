const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const env = require("../config/env");
const { User } = require("../models");
const { generateToken } = require("../utils/jwt");

const setCookieWithToken = (res, token) => {
  res.cookie("cms_jwt", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
};

const setRefreshCookie = (res, refreshToken, maxAgeMs) => {
  if (!refreshToken) return;
  res.cookie("vc_refresh", refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: typeof maxAgeMs === "number" ? maxAgeMs : 30 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email: normalizedEmail }, { username }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User with this email or username already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      role: role === "admin" ? "admin" : "editor",
    });

    const token = generateToken(user);
    setCookieWithToken(res, token);

    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const token = generateToken(user);
    setCookieWithToken(res, token);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie("cms_jwt", { path: "/" });
  res.clearCookie("vc_refresh", { path: "/" });
  return res.json({ message: "Logged out successfully." });
};

const mapIamRoleToCmsRole = (iamRole) => {
  if (iamRole === "admin") return "admin";
  return "editor";
};

const buildIamUsername = (email) => {
  const localPart = typeof email === "string" ? email.split("@")[0].trim() : "";
  const baseUsername = localPart || `iam_user_${Date.now()}`;

  if (baseUsername.length < 3) {
    return `iam_${baseUsername}`;
  }

  return baseUsername.slice(0, 50);
};

const exchange = async (req, res, next) => {
  try {
    const { code, appId } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Missing code." });
    }

    if (!env.clientSecretKey) {
      return res.status(500).json({ message: "Client secret is not configured on the backend." });
    }

    const tokenRes = await fetch(`${env.authServerUrl}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        appId: Number(appId || env.clientAppId),
        secretKey: env.clientSecretKey,
      }),
    });

    if (!tokenRes.ok) {
      let details = null;
      try {
        const body = await tokenRes.json();
        details = body?.message || null;
      } catch {
        details = await tokenRes.text().catch(() => null);
      }
      return res.status(502).json({ message: "Failed to exchange code.", details });
    }

    const tokenData = await tokenRes.json();
    const email = tokenData.user?.email?.toLowerCase();
    const iamRole = tokenData.role || "editor";
    const cmsRole = mapIamRoleToCmsRole(iamRole);
    const username = buildIamUsername(email);

    let user = null;
    if (email) {
      user = await User.findOne({ where: { email } });
    }

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(2);
      const passwordHash = await bcrypt.hash(randomPassword, 12);
      user = await User.create({ username, email: email || username, passwordHash, role: cmsRole });
    } else if (user.role !== cmsRole) {
      user.role = cmsRole;
      await user.save();
    }

    const localToken = generateToken(user);
    setCookieWithToken(res, localToken);

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      iamRole,
    });
  } catch (error) {
    return next(error);
  }
};

const refresh = (req, res) => {
  return res.status(501).json({ message: "Token refresh is not supported with VCN IAM. Please sign in again." });
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = newPasswordHash;
    await user.save();

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  register,
  login,
  logout,
  exchange,
  refresh,
  changePassword,
  getCurrentUser,
};