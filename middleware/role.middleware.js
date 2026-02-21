const { warningResponse } = require("../helpers/response.helper");

const rolePermissions = (...allowedRols) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!userRole) {
        return warningResponse(
            res,
            "Unauthorized, you need to login to access this resource",
            401,
        );
    }
    if (!allowedRols.includes(userRole)) {
        return warningResponse(
            res,
            "Forbidden, you don't have permission to access this resource",
            403,
        );
    }
    next();
  };
};

module.exports = { rolePermissions };
