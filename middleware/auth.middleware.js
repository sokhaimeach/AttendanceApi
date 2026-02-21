const jwt = require('jsonwebtoken');
const Teacher = require('../models/teacher.model');
const { errorResponse, warningResponse } = require('../helpers/response.helper');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) {
            return warningResponse(res, "unauthorized, no token provided", 401);
        }
        const token = authHeader.split(' ')[1];
        if(!token) {
            return warningResponse(res, "unauthorized, no token provided", 401);
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await Teacher.findByPk(decoded.id);
        next();
    } catch(error){
        errorResponse(res, "Error unauthorited", error.message);
    }
}

module.exports = { protect };