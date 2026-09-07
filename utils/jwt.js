const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

const signAccessToken = ({ id, mobile, role }) =>
  jwt.sign({ id, mobile, role, type: "access" }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

const signRegistrationToken = (mobile) =>
  jwt.sign({ mobile, type: "registration" }, env.jwtSecret, {
    expiresIn: env.registrationTokenExpiresIn,
  });

const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { signAccessToken, signRegistrationToken, verifyToken };
