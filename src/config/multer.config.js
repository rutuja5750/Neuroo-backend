const multer = require("multer");

// Configure Multer for Memory Storage (since we're uploading to Azure)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
