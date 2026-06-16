const express = require("express");
const redirectController = require("../controllers/redirectController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");
const validateRequest = require("../middlewares/validateRequest");
const { getRedirectsSchema, createRedirectSchema, resolveRedirectSchema } = require("../utils/validationSchemas");

const router = express.Router();

router.get(
  "/resolve",
  validateRequest(resolveRedirectSchema),
  redirectController.resolveRedirect,
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  validateRequest(getRedirectsSchema),
  redirectController.getRedirects,
);

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  validateRequest(createRedirectSchema),
  redirectController.createRedirect,
);

module.exports = router;
