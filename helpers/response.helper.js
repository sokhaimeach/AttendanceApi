// success response 
const successResponse = (res, message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        statusCode,
        success: true,
        message,
        data,
        error: null
    });
}

// warning response
const warningResponse = (res, message, statusCode = 400, data = {}) => {
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        data,
        error: null
    });
}

// error response
const errorResponse = (res, message, error = null, statusCode = 500) => {
    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        data: {},
        error
    });
}

module.exports = {
    successResponse,
    warningResponse,
    errorResponse
}