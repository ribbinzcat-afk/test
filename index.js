import { extension_settings } from "../../../extensions.js";

const extensionName = "font-manager";
const apiBase = "/api/plugins/font-manager";
// Path ที่ Browser เข้าถึงไฟล์ได้
const webFontPath = "scripts/extensions/third-party/${EXTENSION_NAME}"; 

let loadedFonts = [];

// ฟังก์ชันโหลดรายการฟอนต์จาก Server
async function refreshFontList() {
    try {
        const response = await fetch(`${apiBase}/list`);
        if (response.ok) {
            loadedFonts = await response.json();
            renderFontUI();
        }
    } catch (err) {
        console.error("Font Manager Error:", err);
        toastr.error("Failed to load font list.");
    }
}

// ฟังก์ชันอัพโหลดไฟล์
function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".ttf,.otf,.woff,.woff2";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        toastr.info("Uploading...", "Font Manager");

        try {
            const res = await fetch(`${apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                toastr.success("Upload Complete!", "Font Manager");
                refreshFontList();
            } else {
                toastr.error("Upload Failed.", "Font Manager");
            }
        } catch (err) {
            console.error(err);
            toastr.error("Server Error.", "Font Manager");
        }
    };
    input.click();
}

// ฟังก์ชันสร้างหน้าจอรายการฟอนต์
function renderFontUI() {
    const container = $(`#${extensionName}-list`);
    container.empty();

    if (loadedFonts.length === 0) {
        container.append('<div class="fm-empty">No fonts uploaded yet.</div>');
        return;
    }

    loadedFonts.forEach(fontFile => {
        const fontName = fontFile.replace(/\.[^/.]+$/, ""); // ตัดนามสกุลออกเพื่อเป็นชื่อ Font Family
        const fullUrl = `${webFontPath}/${fontFile}`;
        
        // CSS Template
        const cssCode = `@font-face {
    font-family: '${fontName}';
    src: url('${fullUrl}');
}
body {
    font-family: '${fontName}', sans-serif !important;
    --main-font-family: '${fontName}', sans-serif !important;
}`;

        const itemHtml = `
            <div class="fm-item">
                <div class="fm-item-header">
                    <span class="file-icon"><i class="fa-solid fa-font"></i></span>
                    <strong>${fontFile}</strong>
                </div>
                <div class="fm-preview">
                    <textarea readonly class="fm-code-box">${cssCode}</textarea>
                </div>
                <div class="fm-actions">
                    <button class="menu_button sm" onclick="navigator.clipboard.writeText(\`${cssCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); toastr.success('CSS Copied to clipboard');">
                        <i class="fa-solid fa-copy"></i> Copy CSS
                    </button>
                </div>
            </div>
        `;
        container.append(itemHtml);
    });
}

// เริ่มต้นทำงานเมื่อ SillyTavern โหลดหน้าเว็บ
jQuery(async () => {
    // HTML โครงสร้างหลักของ Extension
    const uiHtml = `
    <div id="${extensionName}-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Custom Font Manager</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="fm-controls">
                    <p class="fm-desc">Upload fonts (.ttf, .otf, .woff) and copy the generated CSS to <b>User Settings > UI > Custom CSS</b>.</p>
                    <button id="fm-upload-btn" class="menu_button">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Upload New Font
                    </button>
                </div>
                <div id="${extensionName}-list" class="fm-list-wrapper">
                    <div class="fm-loading">Loading fonts...</div>
                </div>
            </div>
        </div>
    </div>
    `;

    // เพิ่ม UI เข้าไปใน Extension Panel
    $('#extensions_settings').append(uiHtml);

    // ผูกปุ่ม Upload
    $('#fm-upload-btn').on('click', handleUpload);

    // โหลดข้อมูลครั้งแรก
    refreshFontList();
});