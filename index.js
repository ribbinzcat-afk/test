const extensionName = "font-manager";

// ฟังก์ชันแปลงไฟล์เป็น Base64
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function processFontFiles() {
    // 1. สร้างตัวเลือกไฟล์
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ".ttf,.otf,.woff,.woff2";
    
    // 2. เมื่อเลือกไฟล์เสร็จ
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        toastr.info("Processing font...", "Font Gen");
        
        try {
            // แปลงไฟล์เป็นข้อความ Code
            const base64String = await toBase64(file);
            const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '');
            
            // สร้าง CSS Template แบบฝัง Code
            const cssCode = `@font-face {
    font-family: '${fontName}';
    src: url('${base64String}');
    font-weight: normal;
    font-style: normal;
}

body, .mes_text {
    font-family: '${fontName}', sans-serif !important;
    --main-font-family: '${fontName}', sans-serif !important;
}`;
            
            // แสดงผลลัพธ์
            addResultCard(file.name, cssCode);
            toastr.success("CSS Generated!", "Font Gen");

        } catch (err) {
            console.error(err);
            toastr.error("Error processing file", "Font Gen");
        }
    };

    input.click();
}

// สร้างการ์ดแสดงผล
function addResultCard(filename, cssCode) {
    const container = $(`#${extensionName}-results`);
    
    // ลบข้อความ "พร้อมใช้งาน" ออก
    container.find('.fm-placeholder').remove();

    const cardId = Date.now();
    
    // CSS ยาวมาก เราจะไม่เอามาโชว์ในกล่อง input ตรงๆ เพื่อไม่ให้บราวเซอร์ค้าง
    // เราจะเก็บไว้ในตัวแปร แล้วกดปุ่ม Copy เอา
    window[`font_css_${cardId}`] = cssCode;

    const html = `
    <div class="fm-item">
        <div class="fm-item-header">
            <i class="fa-solid fa-file-code"></i> <strong>${filename}</strong>
        </div>
        <div class="fm-desc">Status: Ready to copy (Base64 Encoded)</div>
        <div class="fm-actions">
            <button class="menu_button" onclick="navigator.clipboard.writeText(window['font_css_${cardId}']); toastr.success('Full CSS Copied!');">
                <i class="fa-solid fa-copy"></i> Copy CSS Code
            </button>
            <button class="menu_button delete-btn" onclick="$(this).closest('.fm-item').remove();">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    </div>`;

    container.prepend(html);
}

// เริ่มต้น UI
jQuery(async () => {
    const uiHtml = `
    <div id="${extensionName}-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Local Font Generator</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="fm-controls">
                    <p class="fm-intro">
                        Select a font file from your PC. This tool will convert it into a CSS code that you can pasting directly into SillyTavern.

                        <small style="color:orange;">(No server upload required)</small>
                    </p>
                    <button id="fm-select-btn" class="menu_button">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Select Font & Generate CSS
                    </button>
                </div>
                <hr>
                <div id="${extensionName}-results" class="fm-list-wrapper">
                    <div class="fm-placeholder">Generated fonts will appear here...</div>
                </div>
            </div>
        </div>
    </div>
    `;

    $('#extensions_settings').append(uiHtml);
    $('#fm-select-btn').on('click', processFontFiles);
});
