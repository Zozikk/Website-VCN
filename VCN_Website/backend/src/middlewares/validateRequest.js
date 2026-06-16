const { ZodError } = require("zod");

const formatIssuePath = (pathArray) => {
  if (!pathArray || pathArray.length === 0) {
    return "request";
  }

  return pathArray.join(".");
};

const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body ?? {},
        params: req.params ?? {},
        query: req.query ?? {},
      });

      req.body = parsed.body;
      req.params = parsed.params;
      req.query = parsed.query;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error.",
          errors: error.issues.map((issue) => ({
            path: formatIssuePath(issue.path),
            message: issue.message,
          })),
        });
      }

      return next(error);
    }
  };
};

module.exports = validateRequest;