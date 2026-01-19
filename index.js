import { extension_settings } from "../../../extensions.js";

(function() {
    // 1. ฟังก์ชันฉีด CSS
    function injectFonts() {
        const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
        let css = '';
        for (const [name, data] of Object.entries(fonts)) {
            css += `@font-face { font-family: '${name}'; src: url('${data}'); }\n`;
        }
        let styleTag = document.getElementById('st-custom-fonts-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'st-custom-fonts-style';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = css;
    }

    // 2. อัปเดตรายการฟอนต์ในหน้าจอ
    function updateFontList() {
        const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
        const listContainer = $('#font-list-display');
        if (!listContainer.length) return;

        listContainer.empty();
        const keys = Object.keys(fonts);

        if (keys.length === 0) {
            listContainer.append('<div style="text-align:center; padding:10px; opacity:0.5;">No fonts installed</div>');
            return;
        }

        keys.forEach(name => {
            const row = $(`
                <div class="font-item-row">
                    <span class="font-name-text" title="Click to copy">${name}</span>
                    <i class="fas fa-trash-alt delete-font-btn" data-name="${name}" style="cursor:pointer; color:#ff4444;"></i>
                </div>
            `);
            listContainer.append(row);
        });

        // Event: Click to Copy
        $('.font-name-text').on('click', function() {
            const text = $(this).text();
            navigator.clipboard.writeText(name).then(() => {
                toastr.success(`Copied: ${text}`);
            });
        });

        // Event: Delete
        $('.delete-font-btn').on('click', function() {
            const name = $(this).data('name');
            if (confirm(`ลบฟอนต์ "${name}" ใช่หรือไม่?`)) {
                const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
                delete fonts[name];
                localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
                injectFonts();
                updateFontList();
            }
        });
    }

    // 3. เริ่มทำงาน
    $(document).ready(function() {
        injectFonts();

        // ดักจับเหตุการณ์การอัพโหลด (เนื่องจาก HTML ถูกโหลดจากไฟล์แยก)
        $(document).on('change', '#font-upload-input', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
                const fontName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_');
                fonts[fontName] = event.target.result;
                localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
                
                injectFonts();
                updateFontList();
                toastr.success(`Installed font: ${fontName}`);
            };
            reader.readAsDataURL(file);
        });

        // อัปเดตลิสต์เมื่อหน้าจอ Extension เปิดขึ้น
        setInterval(() => {
            if ($('#font-list-display').length && $('#font-list-display').is(':empty')) {
                updateFontList();
            }
        }, 1000);
    });
})();