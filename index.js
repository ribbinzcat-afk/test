(function() {
    // 1. ฟังก์ชันฉีด CSS ฟอนต์เข้า Document
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

    // 2. ฟังก์ชันหลักสำหรับแสดง UI ในหน้า Extension
    function renderSettings() {
        // ตรวจสอบว่ามีเมนูหรือยัง เพื่อป้องกันการสร้างซ้ำ
        if ($('#custom-font-uploader-wrapper').length) return;

        const html = `
            <div id="custom-font-uploader-wrapper" style="padding: 10px; border: 1px solid #444; border-radius: 5px; background: rgba(0,0,0,0.2);">
                <h4 style="margin-top:0;">📤 Upload Custom Font</h4>
                <p style="font-size: 0.8em; color: #ccc;">ไฟล์ที่รองรับ: .ttf, .otf, .woff2</p>
                
                <label class="menu_button" style="cursor:pointer; display:inline-block; margin-bottom:15px;">
                    <i class="fas fa-file-upload"></i> Select Font File
                    <input type="file" id="font-upload-input" accept=".ttf,.otf,.woff2" style="display:none;" />
                </label>

                <hr style="border:0; border-top:1px solid #444;">
                
                <h4>📋 Your Fonts</h4>
                <p style="font-size: 0.8em; color: #888;">คลิกที่ชื่อเพื่อคัดลอกไปใช้ใน Custom CSS</p>
                <div id="font-list-display" style="max-height: 200px; overflow-y: auto;"></div>
            </div>
        `;
        
        $('#extensions_settings').append(html);

        // จัดการเหตุการณ์การอัพโหลด
        $('#font-upload-input').on('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // ตรวจสอบขนาดไฟล์ (แนะนำไม่เกิน 4MB)
            if (file.size > 4 * 1024 * 1024) {
                alert("ไฟล์ใหญ่เกินไป! แนะนำให้ใช้ไฟล์ขนาดไม่เกิน 4MB เพื่อป้องกันระบบหน่วง");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
                // คลีนชื่อไฟล์เพื่อใช้เป็นชื่อฟอนต์
                const fontName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_');
                
                fonts[fontName] = event.target.result;
                localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
                
                injectFonts();
                updateFontList();
                alert(`ติดตั้งฟอนต์ "${fontName}" สำเร็จ!`);
            };
            reader.readAsDataURL(file);
        });

        updateFontList();
    }

    // 3. ฟังก์ชันอัปเดตรายการและฟีเจอร์ Copy
    function updateFontList() {
        const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
        const listContainer = $('#font-list-display');
        listContainer.empty();

        const keys = Object.keys(fonts);
        if (keys.length === 0) {
            listContainer.append('<p style="font-style:italic; color:#666;">ยังไม่มีฟอนต์ที่อัพโหลด</p>');
            return;
        }

        keys.forEach(name => {
            const row = $(`
                <div class="font-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(255,255,255,0.05); padding:8px; border-radius:3px;">
                    <div class="font-name-click" style="cursor:pointer; flex-grow:1;" title="Click to copy name">
                        <code style="color:#ffac33; font-weight:bold;">${name}</code>
                    </div>
                    <i class="fas fa-trash delete-font" data-name="${name}" style="color:#ff4444; cursor:pointer; padding: 0 10px;" title="ลบฟอนต์"></i>
                </div>
            `);
            listContainer.append(row);
        });

        // ฟีเจอร์คลิกเพื่อ Copy ชื่อ
        $('.font-name-click').on('click', function() {
            const name = $(this).text().trim();
            navigator.clipboard.writeText(name).then(() => {
                toastr.success(`คัดลอกชื่อ "${name}" แล้ว`); // ใช้ toastr ของ SillyTavern
            });
        });

        // ฟีเจอร์ลบ
        $('.delete-font').on('click', function() {
            const name = $(this).data('name');
            if (confirm(`คุณต้องการลบฟอนต์ ${name} ใช่หรือไม่?`)) {
                const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
                delete fonts[name];
                localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
                injectFonts();
                updateFontList();
            }
        });
    }

    // เริ่มการทำงาน
    $(document).ready(function() {
        injectFonts();
        // ตรวจเช็คเป็นระยะเผื่อหน้าต่าง Settings ยังไม่โหลด
        const checkInterval = setInterval(() => {
            if ($('#extensions_settings').length) {
                renderSettings();
                clearInterval(checkInterval);
            }
        }, 500);
    });
})();