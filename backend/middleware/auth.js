const jwt = require("jsonwebtoken");

// Middleware to authenticate user by verifying JWT token
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ error: "Authorization header missing" });

  const token = authHeader.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach decoded token payload to request
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware to authorize access based on allowed roles
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
};

module.exports = { authenticateJWT, authorizeRoles };
