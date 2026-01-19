const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// ใช้ __dirname เพื่อหาตำแหน่งปัจจุบันของไฟล์นี้ (ไม่ว่าจะอยู่ใน third-party หรือไม่)
const currentDir = __dirname;
const storageDir = path.join(currentDir, 'fonts');

// Log บอกตำแหน่งโฟลเดอร์ที่จะเซฟ (ดูในจอดำ Log ของ SillyTavern)
console.log('[Font Manager] Storage Path:', storageDir);

// ตรวจสอบและสร้างโฟลเดอร์
try {
    if (!fs.existsSync(storageDir)) {
        console.log('[Font Manager] Creating fonts folder...');
        fs.mkdirSync(storageDir, { recursive: true });
    }
} catch (err) {
    console.error('[Font Manager] Error creating directory:', err);
}

// Config Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storageDir);
    },
    filename: (req, file, cb) => {
        // Safe filename format
        const safeName = file.originalname.trim().replace(/\s+/g, '_');
        cb(null, safeName);
    }
});

const upload = multer({ storage: storage });
const router = express.Router();

// --- Routes ---

router.post('/upload', (req, res) => {
    // ใช้ upload.single แบบ Manual เพื่อจับ Error ได้ละเอียดขึ้น
    const uploadFunc = upload.single('file');

    uploadFunc(req, res, function (err) {
        if (err) {
            // นี่คือจุดที่เกิด Error 500 บ่อยๆ สั่งให้มัน Print ออกมา
            console.error('[Font Manager] Upload Error:', err);
            return res.status(500).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file received' });
        }

        console.log('[Font Manager] File uploaded:', req.file.filename);
        return res.json({ success: true, filename: req.file.filename });
    });
});

router.get('/list', (req, res) => {
    fs.readdir(storageDir, (err, files) => {
        if (err) {
            console.error('[Font Manager] List Error:', err);
            return res.status(500).json({ error: 'Cannot read directory' });
        }
        const fonts = files.filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
        res.json(fonts);
    });
});

function init(app) {
    app.use('/api/plugins/font-manager', router);
    console.log('[Font Manager] Loaded in third-party mode.');
}

module.exports = { init };