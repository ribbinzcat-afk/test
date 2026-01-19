import { extension_settings } from "../../../extensions.js";

const extensionName = "font-manager";
const apiBase = "/api/plugins/font-manager";
// Path นี้ต้องถูกต้องเช็คให้ชัวร์ว่าอยู่ใน third-party
const webFontPath = "/scripts/extensions/third-party/font-manager/fonts";

let loadedFonts = [];

async function refreshFontList() {
    try {
        const response = await fetch(`${apiBase}/list`);
        if (response.ok) {
            loadedFonts = await response.json();
            renderFontUI();
        }
    } catch (err) {
        console.error("Font Manager Error:", err);
    }
}

function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".ttf,.otf,.woff,.woff2";

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        toastr.info("Uploading...", "Font Manager");

        try {
            // Encode ชื่อไฟล์เพื่อส่งไปกับ URL
            const safeName = encodeURIComponent(file.name);
            
            // ส่งไฟล์แบบ Binary Direct (ไม่ต้องใช้ FormData)
            const res = await fetch(`${apiBase}/upload?filename=${safeName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream' // บอกว่าเป็นไฟล์ดิบ
                },
                body: file
            });

            if (res.ok) {
                toastr.success("Upload Complete!", "Font Manager");
                refreshFontList();
            } else {
                const errText = await res.text();
                toastr.error("Upload Failed: " + res.status, "Font Manager");
                console.error("Upload Error Detail:", errText);
            }
        } catch (err) {
            console.error(err);
            toastr.error("Network Error", "Font Manager");
        }
    };
    input.click();
}

function renderFontUI() {
    const container = $(`#${extensionName}-list`);
    container.empty();

    if (loadedFonts.length === 0) {
        container.append('<div class="fm-empty">No fonts uploaded yet.</div>');
        return;
    }

    loadedFonts.forEach(fontFile => {
        const fontName = fontFile.replace(/\.[^/.]+$/, "");
        const fullUrl = `${webFontPath}/${fontFile}`;
        
        const cssCode = `@font-face {
    font-family: '${fontName}';
    src: url('${fullUrl}');
}
body, .mes_text {
    font-family: '${fontName}', sans-serif !important;
    --main-font-family: '${fontName}', sans-serif !important;
}`;

        const itemHtml = `
            <div class="fm-item">
                <div class="fm-item-header">
                    <strong>${fontFile}</strong>
                </div>
                <div class="fm-preview">
                    <textarea readonly class="fm-code-box">${cssCode}</textarea>
                </div>
                <div class="fm-actions">
                    <button class="menu_button sm" onclick="navigator.clipboard.writeText(\`${cssCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); toastr.success('CSS Copied');">
                        Copy CSS
                    </button>
                </div>
            </div>
        `;
        container.append(itemHtml);
    });
}

jQuery(async () => {
    const uiHtml = `
    <div id="${extensionName}-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Custom Font Manager</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="fm-controls">
                    <button id="fm-upload-btn" class="menu_button">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Upload Font (Direct Stream)
                    </button>
                </div>
                <div id="${extensionName}-list" class="fm-list-wrapper"></div>
            </div>
        </div>
    </div>
    `;

    $('#extensions_settings').append(uiHtml);
    $('#fm-upload-btn').on('click', handleUpload);
    refreshFontList();
});