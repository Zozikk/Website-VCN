const bcrypt = require("bcryptjs");
const { User } = require("../models");

const DEFAULT_ADMIN = {
  username: "kacper.witczak",
  email: "kacper.witczak@vcn.pl",
  password: "Kacper123!",
  role: "admin",
};

const seedDefaultAdmin = async () => {
  const email = DEFAULT_ADMIN.email.toLowerCase();
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

  const existingUser = await User.findOne({ where: { email } });

  if (!existingUser) {
    await User.create({
      username: DEFAULT_ADMIN.username,
      email,
      passwordHash,
      role: DEFAULT_ADMIN.role,
    });

    console.log(`Seeded default admin user: ${email}`);
    return;
  }

  await existingUser.update({
    username: DEFAULT_ADMIN.username,
    passwordHash,
    role: DEFAULT_ADMIN.role,
  });

  console.log(`Updated default admin user: ${email}`);
};

module.exports = seedDefaultAdmin;