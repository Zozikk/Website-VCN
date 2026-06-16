const { RedirectRule } = require("../models");

const normalizePath = (path) => {
  const trimmed = path.trim().replace(/^\/+/, "");
  return `/${trimmed}`;
};

const serializeRedirect = (redirectRule) => {
  const data = redirectRule.toJSON();

  return {
    id: data.id,
    fromPath: data.fromPath,
    toPath: data.toPath,
    statusCode: data.statusCode,
    isActive: data.isActive,
    createdById: data.createdById,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const getRedirects = async (req, res, next) => {
  try {
    const redirects = await RedirectRule.findAll({
      order: [["updatedAt", "DESC"]],
    });

    return res.json(redirects.map(serializeRedirect));
  } catch (error) {
    return next(error);
  }
};

const createRedirect = async (req, res, next) => {
  try {
    const redirect = await RedirectRule.create({
      fromPath: normalizePath(req.body.fromPath),
      toPath: normalizePath(req.body.toPath),
      statusCode: req.body.statusCode ?? 301,
      isActive: req.body.isActive ?? true,
      createdById: req.user.id,
    });

    return res.status(201).json(serializeRedirect(redirect));
  } catch (error) {
    return next(error);
  }
};

const resolveRedirect = async (req, res, next) => {
  try {
    const fromPath = normalizePath(req.query.path);
    const redirect = await RedirectRule.findOne({
      where: {
        fromPath,
        isActive: true,
      },
    });

    if (!redirect) {
      return res.status(404).json({ message: "Redirect not found." });
    }

    return res.json(serializeRedirect(redirect));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getRedirects,
  createRedirect,
  resolveRedirect,
};
