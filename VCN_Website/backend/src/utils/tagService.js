const { Tag, PageTag } = require("../models");

const normalizeTagName = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const serializeTag = (tag) => ({
  id: tag.id,
  name: tag.name,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

const getTagsInclude = () => [
  {
    model: Tag,
    as: "tags",
    attributes: ["id", "name"],
    through: { attributes: [] },
  },
];

const syncPageTags = async (pageId, tagIds = []) => {
  const uniqueTagIds = [...new Set(tagIds.map((id) => Number(id)).filter(Boolean))];

  await PageTag.destroy({ where: { pageId } });

  if (!uniqueTagIds.length) {
    return;
  }

  await PageTag.bulkCreate(uniqueTagIds.map((tagId) => ({ pageId, tagId })));
};

const listTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({ order: [["name", "ASC"]] });
    return res.json(tags.map(serializeTag));
  } catch (error) {
    return next(error);
  }
};

const createTag = async (req, res, next) => {
  try {
    const name = normalizeTagName(req.body.name || "");

    if (!name) {
      return res.status(400).json({ message: "Tag name is required." });
    }

    const existing = await Tag.findOne({ where: { name } });

    if (existing) {
      return res.status(409).json({ message: "Tag already exists.", tag: serializeTag(existing) });
    }

    const tag = await Tag.create({ name });
    return res.status(201).json(serializeTag(tag));
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  normalizeTagName,
  serializeTag,
  getTagsInclude,
  syncPageTags,
  listTags,
  createTag,
};
