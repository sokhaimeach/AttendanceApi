const cloudinary = require("../config/cloudinary.config");

async function deleteImage(publicId) {
    const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true
    });

    return result;
}

module.exports = deleteImage;