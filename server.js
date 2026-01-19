const express = require('express');
const fs = require('fs');
const path = require('path');

// ใช้ __dirname เพื่อหาตำแหน่งปัจจุบัน
const currentDir = __dirname;
const fontFolder = path.join(currentDir, 'fonts');

// สร้างโฟลเดอร์ fonts ถ้าไม่มี
if (!fs.existsSync(fontFolder)) {
    try {
        fs.mkdirSync(fontFolder, { recursive: true });
        console.log('[Font Manager] Created fonts directory:', fontFolder);
    } catch (err) {
        console.error('[Font Manager] Failed to create directory:', err);
    }
}

const router = express.Router();

// --- API: List Fonts ---
router.get('/list', (req, res) => {
    try {
        const files = fs.readdirSync(fontFolder);
        const fonts = files.filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f));
        res.json(fonts);
    } catch (err) {
        console.error('[Font Manager] List error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- API: Upload (แบบ Raw Binary) ---
// เราจะเขียนไฟล์โดยตรงโดยไม่ใช้ multer เพื่อเลี่ยงปัญหา dependency
router.post('/upload', (req, res) => {
    try {
        // รับชื่อไฟล์จาก query parameter (?filename=xxx.ttf)
        const filename = req.query.filename;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is missing' });
        }

        // Clean filename เพื่อความปลอดภัย
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(fontFolder, safeFilename);
        const writeStream = fs.createWriteStream(filePath);

        // เขียนข้อมูลจาก Request ลงไฟล์
        req.pipe(writeStream);

        writeStream.on('finish', () => {
            console.log('[Font Manager] File saved:', safeFilename);
            res.json({ success: true, filename: safeFilename });
        });

        writeStream.on('error', (err) => {
            console.error('[Font Manager] Write error:', err);
            res.status(500).json({ error: 'Failed to save file' });
        });

    } catch (err) {
        console.error('[Font Manager] Upload handler error:', err);
        res.status(500).json({ error: err.message });
    }
});

function init(app) {
    app.use('/api/plugins/font-manager', router);
    console.log('[Font Manager] Server extension initialized.');
}

module.exports = { init };