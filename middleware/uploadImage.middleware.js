const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// filter file type (Only except image file)
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if(ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
        cb(null, true);
    } else {
        cb(new Error("Only image file alowed"), false);
    }
};

const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

module.exports = uploadImage;