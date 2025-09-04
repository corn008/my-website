// 修復PDF匯出功能 - 隱藏URL版本
function exportToPDFFixed() {
    try {
        const selectedYear = document.getElementById('year-select')?.value || new Date().getFullYear();
        const selectedMonth = document.getElementById('month-select')?.value || '';
        
        if (!selectedYear) {
            window.showNotification && window.showNotification('請先選擇年份', 'warning');
            return;
        }
        
        const targetYear = parseInt(selectedYear);
        const targetMonth = selectedMonth ? parseInt(selectedMonth) : null;
        
        const filteredData = personList.filter(person => {
            if (person.createdYear !== targetYear) return false;
            if (targetMonth && person.createdMonth !== targetMonth) return false;
            return true;
        });
        
        if (filteredData.length === 0) {
            window.showNotification && window.showNotification('沒有資料可匯出', 'warning');
            return;
        }
        
        const monthTitle = targetMonth ? `${targetMonth}月` : '';
        
        // 創建強力隱藏URL的HTML
        const docHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="robots" content="noindex, nofollow">
            <meta name="format-detection" content="telephone=no">
            <meta name="referrer" content="no-referrer">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${monthTitle}遺族訪視照片</title>
            <script>
                // 強力隱藏URL的JavaScript
                window.addEventListener('beforeprint', function() {
                    // 隱藏所有可能的URL元素
                    const elements = document.querySelectorAll('*');
                    elements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('http') || 
                            el.textContent.includes('www.') ||
                            el.textContent.includes('.com') ||
                            el.textContent.includes('.dev') ||
                            el.textContent.includes('.pages') ||
                            el.textContent.includes('my-website')
                        )) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.opacity = '0';
                        }
                    });
                    
                    // 設置頁面標題為空
                    document.title = '';
                    
                    // 移除所有href屬性
                    const links = document.querySelectorAll('a[href]');
                    links.forEach(link => link.removeAttribute('href'));
                });
                
                // 頁面載入後立即隱藏URL
                document.addEventListener('DOMContentLoaded', function() {
                    // 隱藏所有包含URL的元素
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('http') || 
                            el.textContent.includes('www.') ||
                            el.textContent.includes('.com') ||
                            el.textContent.includes('.dev') ||
                            el.textContent.includes('.pages') ||
                            el.textContent.includes('my-website')
                        )) {
                            el.style.display = 'none';
                        }
                    });
                });
            </script>
            <style>
                /* 強力隱藏所有URL的CSS */
                @page { 
                    size: A4; 
                    margin: 16mm; 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                    @left-top { content: none !important; }
                    @left-bottom { content: none !important; }
                    @right-top { content: none !important; }
                    @right-bottom { content: none !important; }
                }
                @page :first { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                }
                @page :left { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                }
                @page :right { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                }
                @page :blank { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                }
                body { 
                    font-family: 'Microsoft JhengHei', Arial, sans-serif; 
                    margin: 0; 
                    color: #222; 
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .title { text-align: center; font-size: 26px; font-weight: 700; margin: 4mm 0 8mm; }
                .content { padding-bottom: 0; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; }
                .card { border: 1px solid #eee; border-radius: 8px; padding: 6mm; box-shadow: 0 2px 6px rgba(0,0,0,0.05); text-align: center; }
                .photo-box { width: 100%; aspect-ratio: 1 / 1; border: 1px solid #e5e5e5; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden; }
                .photo-box img { width: 100%; height: 100%; object-fit: contain; }
                .name { margin-top: 4mm; font-size: 16px; font-weight: 700; }
                .case { margin-top: 1.5mm; font-size: 12px; color: #666; letter-spacing: 0.5px; }
                .card, .photo-box { break-inside: avoid; }
                
                /* 隱藏所有可能的URL顯示 */
                *[data-url] { display: none !important; }
                *[data-print-url] { display: none !important; }
                .print-url { display: none !important; }
                .url-display { display: none !important; }
                footer, .footer, .print-footer, .page-footer { display: none !important; }
                
                @media print {
                    .grid { gap: 8mm; }
                    .card { padding: 5mm; }
                    @page { 
                        margin: 16mm !important; 
                        @bottom-left { content: none !important; }
                        @bottom-right { content: none !important; }
                        @bottom-center { content: none !important; }
                        @top-left { content: none !important; }
                        @top-right { content: none !important; }
                        @top-center { content: none !important; }
                        @left-top { content: none !important; }
                        @left-bottom { content: none !important; }
                        @right-top { content: none !important; }
                        @right-bottom { content: none !important; }
                    }
                    body::after { display: none !important; }
                    body::before { display: none !important; }
                    *[data-print-url] { display: none !important; }
                    footer, .footer, .print-footer, .page-footer { display: none !important; }
                    /* 隱藏所有包含URL的元素 */
                    *:contains("http") { display: none !important; }
                    *:contains("www.") { display: none !important; }
                    *:contains(".com") { display: none !important; }
                    *:contains(".dev") { display: none !important; }
                    *:contains(".pages") { display: none !important; }
                    *:contains("my-website") { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="content">
                <div class="title">${monthTitle}遺族訪視照片</div>
                <div class="grid">
                    ${filteredData.map(person => `
                    <div class="card">
                        <div class="photo-box">
                            ${person.photo ? `<img src="${person.photo}" alt="${person.name}" />` : `<span class="empty">無照片</span>`}
                        </div>
                        <div class="name">${person.name}</div>
                        <div class="case">${person.caseNumber || ''}</div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </body>
        </html>`;

        let iframe = document.getElementById('print-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const printDoc = iframe.contentWindow || iframe.contentDocument;
        const doc = printDoc.document || printDoc;
        doc.open();
        doc.write(docHtml);
        doc.close();

        setTimeout(() => {
            try { 
                // 在列印前進行強力URL隱藏
                const printWindow = iframe.contentWindow;
                if (printWindow && printWindow.document) {
                    // 強制隱藏所有包含URL的元素
                    const allElements = printWindow.document.querySelectorAll('*');
                    allElements.forEach(el => {
                        if (el.textContent && (
                            el.textContent.includes('http') || 
                            el.textContent.includes('www.') ||
                            el.textContent.includes('.com') ||
                            el.textContent.includes('.dev') ||
                            el.textContent.includes('.pages') ||
                            el.textContent.includes('my-website') ||
                            el.textContent.includes('username') ||
                            el.textContent.includes('password')
                        )) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.opacity = '0';
                            el.style.height = '0';
                            el.style.overflow = 'hidden';
                        }
                    });
                    
                    // 設置頁面標題為空
                    printWindow.document.title = '';
                    
                    // 移除所有href屬性
                    const links = printWindow.document.querySelectorAll('a[href]');
                    links.forEach(link => link.removeAttribute('href'));
                    
                    // 添加額外的CSS來隱藏URL
                    const additionalStyle = printWindow.document.createElement('style');
                    additionalStyle.textContent = `
                        @media print {
                            @page { 
                                margin: 16mm !important;
                                @bottom-left { content: none !important; }
                                @bottom-right { content: none !important; }
                                @bottom-center { content: none !important; }
                                @top-left { content: none !important; }
                                @top-right { content: none !important; }
                                @top-center { content: none !important; }
                            }
                            body::after { display: none !important; }
                            body::before { display: none !important; }
                            *[data-print-url] { display: none !important; }
                            footer, .footer, .print-footer, .page-footer { display: none !important; }
                            /* 隱藏所有包含URL的元素 */
                            *:contains("http") { display: none !important; }
                            *:contains("www.") { display: none !important; }
                            *:contains(".com") { display: none !important; }
                            *:contains(".dev") { display: none !important; }
                            *:contains(".pages") { display: none !important; }
                            *:contains("my-website") { display: none !important; }
                            *:contains("username") { display: none !important; }
                            *:contains("password") { display: none !important; }
                        }
                    `;
                    printWindow.document.head.appendChild(additionalStyle);
                }
                
                printDoc.focus(); 
                printDoc.print(); 
            } catch (err) {
                console.error('列印錯誤:', err);
                window.showNotification && window.showNotification('列印啟動失敗，請允許列印或改用瀏覽器列印', 'warning');
            }
        }, 300);

        window.showNotification && window.showNotification(`PDF 匯出就緒，共 ${filteredData.length} 筆資料`, 'success');
    } catch (err) {
        console.error('[exportToPDF] failed', err);
        window.showNotification && window.showNotification('匯出 PDF 發生錯誤：' + (err && err.message ? err.message : '未知錯誤'), 'error');
    }
}

// 替換原來的exportToPDF函數
window.exportToPDF = exportToPDFFixed;
