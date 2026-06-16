const express = require("express");
const { listTags, createTag } = require("../controllers/tagController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

router.get("/", authMiddleware, authorizeRoles("admin", "editor"), listTags);
router.post("/", authMiddleware, authorizeRoles("admin", "editor"), createTag);

module.exports = router;
