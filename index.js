(function() {
    const STORAGE_KEY = 'st_custom_fonts';

    // 1. ฟังก์ชันฉีด CSS ฟอนต์เข้า Document
    function injectFonts() {
        const fonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
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

    // 2. ฟังก์ชันอัปเดตรายการชื่อฟอนต์
    function updateFontList() {
        const fonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const listContainer = $('#font-list-display');
        if (!listContainer.length) return;

        listContainer.empty();
        const keys = Object.keys(fonts);

        if (keys.length === 0) {
            listContainer.append('<p style="opacity:0.5; font-style:italic;">No fonts uploaded.</p>');
            return;
        }

        keys.forEach(name => {
            const row = $(`
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">
                    <code class="copy-font-name" style="cursor:pointer; color:#ffac33;" title="Click to copy">${name}</code>
                    <i class="fas fa-trash-alt delete-font" data-name="${name}" style="color:#ff4444; cursor:pointer;"></i>
                </div>
            `);
            listContainer.append(row);
        });

        $('.copy-font-name').on('click', function() {
            const name = $(this).text();
            navigator.clipboard.writeText(name);
            toastr.success(`Copied font name: ${name}`);
        });

        $('.delete-font').on('click', function() {
            const name = $(this).data('name');
            if (confirm(`Delete font "${name}"?`)) {
                const fonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                delete fonts[name];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
                injectFonts();
                updateFontList();
            }
        });
    }

    // 3. สร้าง UI ในหน้า Extensions Settings
    function initUI() {
        // ถ้ามีอยู่แล้วไม่ต้องสร้างซ้ำ
        if ($('#font-uploader-container').length) return;

        const container = $(`
            <div id="font-uploader-container" style="padding:15px; border:1px solid #444; border-radius:10px; background:rgba(0,0,0,0.2); margin-top:10px;">
                <h4 style="margin-top:0;">📤 Upload New Font</h4>
                
                <div style="margin-bottom:15px;">
                    <label class="menu_button" style="display:inline-block; cursor:pointer;">
                        <i class="fas fa-file-upload"></i> Select Font File
                        <input type="file" id="font-upload-input" accept=".ttf,.otf,.woff2" style="display:none;" />
                    </label>
                </div>

                <hr style="border:0; border-top:1px solid #444;">

                <h4>📋 Your Fonts</h4>
                <div id="font-list-display"></div>
            </div>
        `);

        $('#extensions_settings').append(container);

        // ดักจับการอัพโหลด
        $(document).on('change', '#font-upload-input', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const fonts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                const fontName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_');
                fonts[fontName] = event.target.result;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
                
                injectFonts();
                updateFontList();
                toastr.success(`Installed: ${fontName}`);
            };
            reader.readAsDataURL(file);
        });

        updateFontList();
    }

    // เริ่มทำงาน
    $(document).ready(function() {
        injectFonts();
        
        // ใช้ interval เช็คจนกว่าเมนู Extensions จะโผล่ (กันพลาด)
        const checkExist = setInterval(function() {
            if ($('#extensions_settings').length) {
                initUI();
                // ไม่ต้องเคลียร์ Interval เผื่อมีการสลับเมนูไปมาแล้ว UI หาย
                updateFontList(); 
            }
        }, 1000);
    });
})();