const userModel = require("../models/user.model");

module.exports.createUser = async (firstname, lastname, email, password, phone) => {
  if (!firstname || !email || !password || !phone) {
    throw new Error("All fields are required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await userModel.hashPassword(password);

  const user = await userModel.create({
    fullname: {
      firstname,
      lastname,
    },
    email: normalizedEmail,
    password: hashedPassword,
    phone,
  });

  return user;
};
