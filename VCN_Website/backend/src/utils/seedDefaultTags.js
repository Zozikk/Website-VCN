const { Tag } = require("../models");

const DEFAULT_TAGS = ["vnetlpr", "vtools", "vcn-website"];

const seedDefaultTags = async () => {
  for (const name of DEFAULT_TAGS) {
    const existing = await Tag.findOne({ where: { name } });

    if (!existing) {
      await Tag.create({ name });
      console.log(`Seeded tag: ${name}`);
    }
  }
};

module.exports = seedDefaultTags;
