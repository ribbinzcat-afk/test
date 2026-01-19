const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// --- Configuration ---
const storageDir = path.join(__dirname, 'fonts');

// ตรวจสอบว่ามีโฟลเดอร์ fonts หรือไม่
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
}

// ตั้งค่า Multer สำหรับ Save ไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storageDir);
    },
    filename: (req, file, cb) => {
        // เปลี่ยนชื่อไฟล์ ตัดช่องว่างออก ป้องกัน Path มีปัญหา
        const safeName = file.originalname.trim().replace(/\s+/g, '_');
        cb(null, safeName);
    }
});

const upload = multer({ storage: storage });
const router = express.Router();

// --- Routes ---

// 1. Upload API
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ success: true, filename: req.file.filename });
});

// 2. List API
router.get('/list', (req, res) => {
    fs.readdir(storageDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Cannot read directory' });
        }
        // กรองเอาเฉพาะนามสกุล Font
        const fonts = files.filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
        res.json(fonts);
    });
});

// Initialization hook สำหรับ SillyTavern
function init(app) {
    app.use('/api/plugins/font-manager', router);
    console.log('[Font Manager] Extension Loaded.');
}

module.exports = { init };