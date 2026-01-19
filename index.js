import { extension_settings } from "../../../extensions.js";

const extensionName = "font-manager";
const DB_KEY = "st_custom_fonts_data"; // กุญแจสำหรับเก็บข้อมูลใน Browser

// โหลด localForage (Database ของ Browser)
// หมายเหตุ: SillyTavern มักจะมี localforage เป็น global variable อยู่แล้ว
const db = window.localforage; 

// 1. ฟังก์ชันแปลงไฟล์เป็น Base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// 2. ฟังก์ชันโหลดฟอนต์จาก Database มาแสดงผลจริง
async function loadStoredFonts() {
    try {
        const storedFonts = await db.getItem(DB_KEY) || [];
        
        // ลบ Style เก่าออกก่อนเพื่อป้องกันการซ้ำซ้อน
        $(`#style-${extensionName}`).remove();
        
        if (storedFonts.length === 0) {
            renderList([]);
            return;
        }

        let cssRules = "";
        
        storedFonts.forEach(font => {
            cssRules += `
            @font-face {
                font-family: '${font.name}';
                src: url('${font.data}');
                font-weight: normal;
                font-style: normal;
            }`;
        });

        // บังคับใช้ฟอนต์ตัวล่าสุดที่อัพโหลด
        const lastFont = storedFonts[storedFonts.length - 1];
        cssRules += `
            body, .mes_text, textarea, input {
                font-family: '${lastFont.name}', sans-serif !important;
                --main-font-family: '${lastFont.name}', sans-serif !important;
            }
        `;

        // ฉีด CSS เข้าไปในหน้าเว็บ (Head)
        $('head').append(`<style id="style-${extensionName}">${cssRules}</style>`);
        
        console.log("[Font Manager] Loaded fonts from storage:", storedFonts.length);
        renderList(storedFonts);

    } catch (err) {
        console.error("[Font Manager] Load Error:", err);
    }
}

// 3. ฟังก์ชันบันทึกฟอนต์ใหม่
async function saveFont(file) {
    try {
        const base64 = await fileToBase64(file);
        // สร้างชื่อฟอนต์ง่ายๆ ตัดนามสกุลออก
        const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '');

        // ดึงข้อมูลเก่ามา
        let storedFonts = await db.getItem(DB_KEY) || [];
        
        // เราจะเก็บแค่ฟอนต์เดียวเพื่อให้เบา (หรือถ้าอยากเก็บหลายอันก็แค่ push ต่อไป)
        // ในที่นี้ผมขอ reset เป็นฟอนต์ใหม่เลย เพื่อไม่ให้ Database บวมเกินไป
        storedFonts = [{
            name: fontName,
            data: base64,
            fileName: file.name
        }];

        await db.setItem(DB_KEY, storedFonts);
        
        toastr.success(`Font "${fontName}" Saved to Browser Storage!`, "Font Manager");
        loadStoredFonts(); // รีเฟรชทันที

    } catch (err) {
        console.error(err);
        toastr.error("Failed to save font", "Font Manager");
    }
}

// 4. ฟังก์ชันลบฟอนต์
async function clearFonts() {
    await db.setItem(DB_KEY, []);
    $(`#style-${extensionName}`).remove();
    loadStoredFonts();
    toastr.info("Fonts cleared", "Font Manager");
}

function renderList(fonts) {
    const list = $(`#${extensionName}-list`);
    list.empty();

    if (fonts.length === 0) {
        list.html('<div class="fm-empty">No font currently active.</div>');
        return;
    }

    fonts.forEach(font => {
        list.append(`
            <div class="fm-item">
                <i class="fa-solid fa-font"></i> 
                <span>Active: <strong>${font.name}</strong></span>
            </div>
        `);
    });
}

// GUI Setup
jQuery(async () => {
    // โหลดฟอนต์ทันทีที่เปิดเว็บขึ้นมา
    await loadStoredFonts();

    // สร้าง UI
    const uiHtml = `
    <div id="${extensionName}-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>LocalStorage Font Loader</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="fm-controls">
                    <p class="fm-desc">Stores font in your browser cache. Does not affect Custom CSS settings.</p>
                    <div class="fm-btn-group">
                        <button id="fm-btn-add" class="menu_button">
                            <i class="fa-solid fa-upload"></i> Set Font
                        </button>
                        <button id="fm-btn-clear" class="menu_button red">
                            <i class="fa-solid fa-trash"></i> Reset
                        </button>
                    </div>
                </div>
                <div id="${extensionName}-list" class="fm-list"></div>
            </div>
        </div>
    </div>
    `;

    $('#extensions_settings').append(uiHtml);

    // Event Listeners
    $('#fm-btn-add').on('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".ttf,.otf,.woff,.woff2";
        input.onchange = (e) => {
            if (e.target.files[0]) saveFont(e.target.files[0]);
        };
        input.click();
    });

    $('#fm-btn-clear').on('click', clearFonts);
});