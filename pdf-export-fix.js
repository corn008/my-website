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
        
        // 創建簡化的HTML，專注於隱藏URL
        const docHtml = `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="robots" content="noindex, nofollow">
            <meta name="format-detection" content="telephone=no">
            <title>${monthTitle}遺族訪視照片</title>
            <style>
                @page { 
                    size: A4; 
                    margin: 16mm; 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                    @top-left { content: none !important; }
                    @top-right { content: none !important; }
                    @top-center { content: none !important; }
                }
                @page :first { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                }
                @page :left { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
                }
                @page :right { 
                    @bottom-left { content: none !important; }
                    @bottom-right { content: none !important; }
                    @bottom-center { content: none !important; }
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
                    }
                    body::after { display: none !important; }
                    body::before { display: none !important; }
                    *[data-print-url] { display: none !important; }
                    footer, .footer, .print-footer, .page-footer { display: none !important; }
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
                printDoc.focus(); 
                printDoc.print(); 
            } catch (err) {
                console.error('列印錯誤:', err);
                window.showNotification && window.showNotification('列印啟動失敗，請允許列印或改用瀏覽器列印', 'warning');
            }
        }, 200);

        window.showNotification && window.showNotification(`PDF 匯出就緒，共 ${filteredData.length} 筆資料`, 'success');
    } catch (err) {
        console.error('[exportToPDF] failed', err);
        window.showNotification && window.showNotification('匯出 PDF 發生錯誤：' + (err && err.message ? err.message : '未知錯誤'), 'error');
    }
}

// 替換原來的exportToPDF函數
window.exportToPDF = exportToPDFFixed;
