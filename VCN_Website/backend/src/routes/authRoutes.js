const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { registerSchema, loginSchema } = require("../utils/validationSchemas");

const router = express.Router();

router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.post("/exchange", authController.exchange);
router.post("/refresh", authController.refresh);
router.post("/change-password", authMiddleware, authController.changePassword);
router.get("/me", authMiddleware, authController.getCurrentUser);

module.exports = router;