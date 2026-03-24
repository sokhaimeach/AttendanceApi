const cloudinary = require("../config/cloudinary.config");
const fs = require("fs-extra");

async function uploadImage(filePath) {
    const result = await cloudinary.uploader.upload(filePath,{
        folder: "attendance_teacher_image"
    });

    await fs.removeSync(filePath);

    return {
        url: result.secure_url,
        publicId: result.public_id
    }
}

module.exports = uploadImage;