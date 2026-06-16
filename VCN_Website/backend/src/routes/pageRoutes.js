const express = require("express");
const pageController = require("../controllers/pageController");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");
const validateRequest = require("../middlewares/validateRequest");
const {
	createPageSchema,
	updatePageSchema,
	getPageBySlugSchema,
	getPageByIdSchema,
	deletePageSchema,
	getPagesSchema,
	getGlobalLayoutSchema,
	getPageVersionsSchema,
	publishPageVersionSchema,
	previewTokenSchema,
	previewPageSchema,
} = require("../utils/validationSchemas");

const router = express.Router();

router.get("/", validateRequest(getPagesSchema), pageController.getPages);
router.get("/global/layout", validateRequest(getGlobalLayoutSchema), pageController.getGlobalLayout);
router.get("/preview/:token", validateRequest(previewPageSchema), pageController.getPreviewPageByToken);
router.get(
	"/:id/versions",
	authMiddleware,
	authorizeRoles("admin", "editor"),
	validateRequest(getPageVersionsSchema),
	pageController.getPageVersions,
);
router.post(
	"/:id/publish-version",
	authMiddleware,
	authorizeRoles("admin"),
	validateRequest(publishPageVersionSchema),
	pageController.publishPageVersion,
);
router.post(
	"/preview-token",
	authMiddleware,
	authorizeRoles("admin", "editor"),
	validateRequest(previewTokenSchema),
	pageController.createPreviewToken,
);
router.get(
	"/id/:id",
	authMiddleware,
	authorizeRoles("admin", "editor"),
	validateRequest(getPageByIdSchema),
	pageController.getPageById,
);
router.get("/:slug", validateRequest(getPageBySlugSchema), pageController.getPageBySlug);
router.post(
	"/",
	authMiddleware,
	authorizeRoles("admin", "editor"),
	validateRequest(createPageSchema),
	pageController.createPage,
);
router.put(
	"/:id",
	authMiddleware,
	authorizeRoles("admin", "editor"),
	validateRequest(updatePageSchema),
	pageController.updatePage,
);
router.delete(
	"/:id",
	authMiddleware,
	authorizeRoles("admin"),
	validateRequest(deletePageSchema),
	pageController.deletePage,
);

module.exports = router;
