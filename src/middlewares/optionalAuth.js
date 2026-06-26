const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    // Ignore invalid demo/expired cookies on public routes.
  }

  return next();
};

module.exports = optionalAuth;
