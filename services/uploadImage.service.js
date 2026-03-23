const cloudinary = require("../config/cloudinary.config");

async function uploadImage(filePath) {
    const result = await cloudinary.uploader.upload(filePath,{
        folder: "attendance_teacher_image"
    });

    return {
        url: result.secure_url,
        publicId: result.public_id
    }
}

module.exports = uploadImage;