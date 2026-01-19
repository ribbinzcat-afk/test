import { extension_settings } from "../../../extensions.js";

const extensionName = "font-manager";
const apiBase = "/api/plugins/font-manager";

// *** แก้ไข PATH ตรงนี้ให้ชี้ไปที่ third-party ***
const webFontPath = "/scripts/extensions/third-party/font-manager/fonts"; 

let loadedFonts = [];

async function refreshFontList() {
    try {
        const response = await fetch(`${apiBase}/list`);
        if (response.ok) {
            loadedFonts = await response.json();
            renderFontUI();
        } else {
            console.error("Font Manager list error:", response.statusText);
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

        const formData = new FormData();
        formData.append('file', file);

        toastr.info("Uploading...", "Font Manager");

        try {
            const res = await fetch(`${apiBase}/upload`, {
                method: 'POST',
                body: formData
            });
            
            // อ่าน Error message จาก json ถ้ามี
            const data = await res.json();

            if (res.ok) {
                toastr.success("Upload Complete!", "Font Manager");
                refreshFontList();
            } else {
                // แสดง Error ที่ Server ส่งกลับมา
                toastr.error(`Upload Failed: ${data.error || res.statusText}`, "Font Manager");
                console.error("Upload failed detail:", data);
            }
        } catch (err) {
            console.error(err);
            toastr.error("Connection Error (Check Console)", "Font Manager");
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
                    <button class="menu_button sm" onclick="navigator.clipboard.writeText(\`${cssCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); toastr.success('CSS Copied');">
                        <i class="fa-solid fa-copy"></i> Copy CSS
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
                    <p class="fm-desc">Upload fonts and paste CSS to <b>User Settings > UI > Custom CSS</b>.</p>
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

    $('#extensions_settings').append(uiHtml);
    $('#fm-upload-btn').on('click', handleUpload);
    refreshFontList();
});