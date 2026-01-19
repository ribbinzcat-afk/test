(function() {
    const EXTENSION_NAME = "custom_font_uploader";

    // 1. ฟังก์ชันฉีด CSS ฟอนต์ทั้งหมดที่เคยเก็บไว้เข้าสู่ Document
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

    // 2. ฟังก์ชันสร้าง UI ในเมนู Extensions
    function renderSettings() {
        const html = `
            <div class="custom-font-container">
                <h4>Upload New Font</h4>
                <input type="file" id="font-upload-input" accept=".ttf,.otf,.woff,.woff2" />
                <hr>
                <h4>Your Fonts (Use these names in Custom CSS)</h4>
                <div id="font-list-display"></div>
            </div>
        `;
        $('#extensions_settings').append(html);

        // จัดการการอัพโหลด
        $('#font-upload-input').on('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
                const fontName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_'); // คลีนชื่อฟอนต์
                fonts[fontName] = event.target.result;
                localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
                
                injectFonts();
                updateFontList();
                alert(`Uploaded: ${fontName}`);
            };
            reader.readAsDataURL(file);
        });

        updateFontList();
    }

    // 3. ฟังก์ชันอัปเดตรายการชื่อฟอนต์
    function updateFontList() {
        const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
        const listContainer = $('#font-list-display');
        listContainer.empty();

        if (Object.keys(fonts).length === 0) {
            listContainer.append('<p>No fonts uploaded.</p>');
            return;
        }

        for (const name of Object.keys(fonts)) {
            const row = $(`
                <div style="display:flex; justify-content:space-between; margin-bottom:5px; background:rgba(0,0,0,0.2); padding:5px;">
                    <code style="cursor:pointer;" title="Click to copy">${name}</code>
                    <span class="delete-font" data-name="${name}" style="color:#ff4444; cursor:pointer;">[Delete]</span>
                </div>
            `);
            listContainer.append(row);
        }

        // กดลบฟอนต์
        $('.delete-font').on('click', function() {
            const name = $(this).data('name');
            const fonts = JSON.parse(localStorage.getItem('st_custom_fonts') || '{}');
            delete fonts[name];
            localStorage.setItem('st_custom_fonts', JSON.stringify(fonts));
            injectFonts();
            updateFontList();
        });
    }

    // เริ่มทำงานเมื่อเปิดโปรแกรม
    $(document).ready(function() {
        injectFonts();
        // รอจนกว่าหน้าต่าง Extension จะถูกโหลด (SillyTavern specific)
        setTimeout(renderSettings, 1000); 
    });
})();