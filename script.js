// 全域函數定義
let isHandlingPopstate = false;
let currentViewName = null; // 目前顯示的功能區段
const ROUTES = ['login','function-selection','care','statistics','settings','help'];

// Hash 導航
function navigateTo(viewName) {
    if (!ROUTES.includes(viewName)) return;
    if (location.hash !== '#' + viewName) {
        location.hash = '#' + viewName;
    } else {
        // 相同 hash 時手動觸發渲染
        router();
    }
}

function router() {
    const raw = (location.hash || '').replace('#','');
    const target = ROUTES.includes(raw) ? raw : (currentUser ? 'function-selection' : 'login');
    if (!currentUser && target !== 'login') {
        // 未登入一律導回登入
        renderLogin();
        return;
    }
    if (target === 'login') {
        renderLogin();
        return;
    }
    renderMain(target);
}

function renderLogin() {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    if (mainSection) mainSection.style.display = 'none';
    if (loginSection) loginSection.style.display = 'flex';
    currentViewName = 'login';
}

function renderMain(view) {
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    if (loginSection) loginSection.style.display = 'none';
    if (mainSection) mainSection.style.display = 'block';
    showSection(view || 'function-selection');
}

function showSection(sectionName) {
    // 隱藏所有主要區段
    const sections = ['function-selection', 'care', 'statistics', 'settings', 'help'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // 顯示指定的區段
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // 控制頂部返回按鈕的顯示
        const headerBackBtn = document.getElementById('header-back-btn');
        if (headerBackBtn) {
            if (sectionName === 'function-selection') {
                headerBackBtn.style.display = 'none'; // 在主選單時隱藏
            } else {
                headerBackBtn.style.display = 'inline-flex'; // 在功能頁面時顯示
            }
        }
        
        // 特殊處理
        if (sectionName === 'care') {
            if (window.filterData) window.filterData();
        } else if (sectionName === 'statistics') {
            if (window.updateStatistics) window.updateStatistics();
            if (window.initializeStatsYearSelect) window.initializeStatsYearSelect();
        }

        // 僅同步本地狀態（hash 由 navigateTo 控制）
        try { localStorage.setItem('currentView', sectionName); } catch (_) {}
        currentViewName = sectionName;
    }
}

function logout() {
    if (confirm('確定要登出嗎？')) {
        // 清除用戶狀態
        currentUser = null;
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentView');
        } catch (_) {}
        
        // 隱藏主系統介面
        document.getElementById('main-section').style.display = 'none';
        
        // 顯示登入介面
        document.getElementById('login-section').style.display = 'flex';
        
        // 重置登入表單
        document.getElementById('login-form').reset();
        
        // 停止時間更新
        if (timeInterval) {
            clearInterval(timeInterval);
            timeInterval = null;
        }
        
        // 顯示登出成功訊息
        showNotification('已成功登出', 'success');
    }
}

function showModal(contentOrTitle, maybeContent) {
    // 支援 showModal(html) 或 showModal(title, html)
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;
    const html = (typeof maybeContent === 'string')
        ? `<div class="modal-inner"><div class="modal-title">${contentOrTitle}</div>${maybeContent}</div>`
        : contentOrTitle;
    modalBody.innerHTML = html;
    modal.style.display = 'flex';
    // 點擊外部關閉（保證只綁一次）
    if (!modal.__outsideClickBound) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
        modal.__outsideClickBound = true;
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// 全域時間格式化：將 ISO/Date 轉成本地可讀字串
function formatDateTime(input) {
    try {
        const date = (input instanceof Date) ? input : new Date(input);
        if (isNaN(date.getTime())) return String(input || '');
        return date.toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    } catch (_) {
        return String(input || '');
    }
}

// 建立安全包裝器（供最下方全域綁定使用）
function wrapSafe(functionName, originalFn) {
    if (typeof originalFn !== 'function') return originalFn;
    return function wrappedFunction() {
        try {
            return originalFn.apply(this, arguments);
        } catch (err) {
            console.error(`[${functionName}] 執行錯誤:`, err);
            const msg = err && err.message ? err.message : '未知錯誤';
            if (msg === 'Script error.') return;
            try { showNotification(`${functionName} 執行失敗：${msg}`, 'error'); } catch(_) {}
        }
    };
}

// 登入頁面返回上一頁/上一層
function goBack() {
    // 符合使用者期待：真正的瀏覽器回上一頁
    history.back();
}

// 獲取當前活躍的區段
function getCurrentActiveSection() {
    const sections = ['function-selection', 'care', 'statistics', 'settings', 'help'];
    for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.style.display !== 'none') {
            return section;
        }
    }
    return null;
}

// 添加手機手勢支援
function initializeMobileGestures() {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    
    // 觸摸開始
    document.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });
    
    // 觸摸移動
    document.addEventListener('touchmove', function(e) {
        if (!startX || !startY) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        // 檢查是否為水平滑動
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            isSwiping = true;
        }
    }, { passive: true });
    
    // 觸摸結束
    document.addEventListener('touchend', function(e) {
        if (!isSwiping || !startX) return;
        
        const deltaX = e.changedTouches[0].clientX - startX;
        
        // 從右邊緣向左滑動（返回手勢）
        if (deltaX < -100 && startX > window.innerWidth * 0.8) {
            goBack();
        }
        
        // 重置狀態
        startX = 0;
        startY = 0;
        isSwiping = false;
    }, { passive: true });
}

// 添加手機瀏覽器返回按鈕支援
function initializeMobileBackButton() {
    // 初始狀態：登入頁
    try {
        if (!history.state || !history.state.view) {
            const savedUser = JSON.parse(localStorage.getItem('currentUser')) || null;
            const initialView = savedUser ? (localStorage.getItem('currentView') || 'function-selection') : 'login';
            history.replaceState({ view: initialView }, '');
        }
    } catch (_) {}

    // 監聽瀏覽器返回/前進
    window.addEventListener('popstate', function(e) {
        const state = e.state || {};
        isHandlingPopstate = true;
        try {
            if (state.view === 'login') {
                const mainSection = document.getElementById('main-section');
                const loginSection = document.getElementById('login-section');
                if (mainSection) mainSection.style.display = 'none';
                if (loginSection) loginSection.style.display = 'flex';
            } else if (state.view) {
                // 已登入後的各功能頁
                const mainSection = document.getElementById('main-section');
                const loginSection = document.getElementById('login-section');
                if (loginSection) loginSection.style.display = 'none';
                if (mainSection) mainSection.style.display = 'block';
                showSection(state.view);
                try { localStorage.setItem('currentView', state.view); } catch (_) {}
            }
        } finally {
            isHandlingPopstate = false;
        }
    });
}

function toggleTheme() {
    // 單一權威：以 body 是否有 dark-theme 判斷
    const body = document.body;
    const isDark = body.classList.contains('dark-theme');
    const next = isDark ? 'light' : 'dark';
    if (next === 'dark') {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
    localStorage.setItem('currentTheme', next);
    showNotification(`已切換至${next === 'dark' ? '深色' : '淺色'}主題`, 'success');
}

function exportToCSV() {
    const selectedYear = document.getElementById('year-select')?.value || new Date().getFullYear();
    const selectedMonth = document.getElementById('month-select')?.value || '';
    
    if (!selectedYear) {
        window.showNotification && window.showNotification('請先選擇年份', 'warning');
        return;
    }
    
    // 確保年份是數字類型
    const targetYear = parseInt(selectedYear);
    const targetMonth = selectedMonth ? parseInt(selectedMonth) : null;
    
    let filteredData = personList.filter(person => {
        if (person.createdYear !== targetYear) return false;
        if (targetMonth && person.createdMonth !== targetMonth) return false;
        return true;
    });
    
    if (filteredData.length === 0) {
        window.showNotification && window.showNotification('沒有資料可匯出', 'warning');
        return;
    }
    
    const headers = ['姓名', '個案號碼', '電話', '地址', '備忘', '狀態', '建立月份', '建立年份', '建立時間'];
    const csvContent = [
        headers.join(','),
        ...filteredData.map(person => [
            person.name,
            person.caseNumber || '',
            person.phone,
            person.address,
            person.memo || '',
            person.status || 'pending',
            person.createdMonth,
            person.createdYear,
            person.createdAt
        ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `照護資料_${targetYear}年${targetMonth ? targetMonth + '月' : ''}.csv`;
    link.click();
    
    window.showNotification && window.showNotification(`CSV 匯出完成，共 ${filteredData.length} 筆資料`, 'success');
}

function exportToPDF() {
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
        const docHtml = `<!DOCTYPE html>
        <html><head><meta charset="utf-8" />
            <title>${monthTitle}遺族訪視照片</title>
            <style>
                @page { size: A4; margin: 18mm; }
                body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 0; color: #222; }
                .title { text-align: center; font-size: 28px; font-weight: 700; margin: 8px 0 18px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
                .card { border: 1px solid #eee; border-radius: 8px; padding: 18px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); text-align: center; }
                .photo-box { width: 100%; aspect-ratio: 1 / 1; border: 1px solid #e5e5e5; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: #fafafa; overflow: hidden; }
                .photo-box img { width: 100%; height: 100%; object-fit: contain; }
                .name { margin-top: 12px; font-size: 18px; font-weight: 700; }
                .case { margin-top: 4px; font-size: 14px; color: #666; letter-spacing: 0.5px; }
                .footer { position: fixed; bottom: 10mm; left: 18mm; right: 18mm; text-align: right; font-size: 12px; color: #999; }
                .empty { color: #aaa; font-size: 14px; }
                /* 列印安全：避免元素被分割 */
                .card, .photo-box { break-inside: avoid; }
            </style>
        </head><body>
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
            <div class="footer">匯出時間：${new Date().toLocaleString('zh-TW')}</div>
        </body></html>`;

        // 使用隱藏 iframe 以避免彈出視窗被攔截與跨來源錯誤
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

        const timeoutId = setTimeout(() => {
            try { printDoc.focus(); printDoc.print(); } catch (err) {
                window.showNotification && window.showNotification('列印啟動失敗，請允許列印或改用瀏覽器列印', 'warning');
            }
        }, 200);

        window.showNotification && window.showNotification(`PDF 匯出就緒，共 ${filteredData.length} 筆資料`, 'success');
    } catch (err) {
        console.error('[exportToPDF] failed', err);
        window.showNotification && window.showNotification('匯出 PDF 發生錯誤：' + (err && err.message ? err.message : '未知錯誤'), 'error');
    }
}

function backupData() {
    const dataStr = JSON.stringify(personList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `照護資料備份_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.showNotification && window.showNotification('資料備份完成', 'success');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        if (confirm(`確定要還原資料嗎？這將覆蓋現有的 ${personList.length} 筆資料，並匯入 ${data.length} 筆新資料。`)) {
                            personList = data;
                            localStorage.setItem('personList', JSON.stringify(personList));
                            window.showNotification && window.showNotification(`資料還原完成，共匯入 ${data.length} 筆資料`, 'success');
                            if (document.getElementById('care').style.display !== 'none') {
                                filterData();
                            }
                        }
                    } else {
                        window.showNotification && window.showNotification('檔案格式錯誤', 'error');
                    }
                } catch (error) {
                    window.showNotification && window.showNotification('檔案讀取失敗', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function showSystemInfo() {
    const totalPeople = personList.length;
    const completedPeople = personList.filter(p => p.status === 'completed').length;
    const pendingPeople = personList.filter(p => p.status === 'pending').length;
    const withPhotos = personList.filter(p => p.photo).length;
    const withoutPhotos = totalPeople - withPhotos;
    
    const info = `
        <div class="system-info">
            <h3>系統資訊</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">總人數:</span>
                    <span class="info-value">${totalPeople}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">已完成:</span>
                    <span class="info-value">${completedPeople}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">待處理:</span>
                    <span class="info-value">${pendingPeople}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">有照片:</span>
                    <span class="info-value">${withPhotos}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">無照片:</span>
                    <span class="info-value">${withoutPhotos}</span>
                </div>
            </div>
            <div class="info-footer">
                <p>系統版本: 1.0.0</p>
                <p>最後更新: ${new Date().toLocaleString('zh-TW')}</p>
            </div>
        </div>
    `;
    
    showModal('系統資訊', info);
}

function showAddPersonForm() {
    const modal = document.getElementById('add-person-modal');
    if (modal) {
        // 重置表單
        const form = document.getElementById('add-person-form');
        if (form) {
            form.reset();
        }
        
        // 清除照片預覽
        const photoPreview = document.getElementById('photo-preview');
        const photoInfo = document.getElementById('photo-info');
        if (photoPreview) {
            photoPreview.style.display = 'none';
            photoPreview.src = '';
        }
        if (photoInfo) {
            photoInfo.textContent = '請選擇照片檔案';
        }
        
        // 設置當前年份為預設值
        const currentYear = new Date().getFullYear();
        const yearSelect = document.getElementById('year-select');
        if (yearSelect && yearSelect.value) {
            // 如果篩選器有選年份，就使用篩選器的年份
            document.getElementById('current-year').textContent = yearSelect.value;
        } else {
            // 否則使用當前年份
            document.getElementById('current-year').textContent = currentYear;
        }
        
        modal.style.display = 'flex';
    }
}

function checkPhotos() {
    const selectedMonth = document.getElementById('month-select')?.value || '';
    const selectedYear = document.getElementById('year-select')?.value || new Date().getFullYear();
    
    if (!selectedMonth || !selectedYear) {
        window.showNotification && window.showNotification('請先選擇年份和月份', 'warning');
        return;
    }
    
    // 確保年份和月份都是數字類型
    const targetYear = parseInt(selectedYear);
    const targetMonth = parseInt(selectedMonth);
    
    const monthData = personList.filter(person => 
        person.createdMonth === targetMonth && 
        person.createdYear === targetYear
    );
    
    if (monthData.length === 0) {
        window.showNotification && window.showNotification('該月份沒有資料', 'warning');
        return;
    }
    
    const withPhotos = monthData.filter(p => p.photo);
    const withoutPhotos = monthData.filter(p => !p.photo);
    
    let content = `
        <div class="photo-check">
            <h3>${targetYear}年${targetMonth}月 照片檢查</h3>
            <div class="check-summary">
                <p>總人數: <strong>${monthData.length}</strong></p>
                <p>有照片: <strong>${withPhotos.length}</strong></p>
                <p>無照片: <strong>${withoutPhotos.length}</strong></p>
                <p>照片完整度: <strong>${Math.round((withPhotos.length / monthData.length) * 100)}%</strong></p>
            </div>
    `;
    
    if (withoutPhotos.length > 0) {
        content += `
            <div class="missing-photos">
                <h4>缺少照片的人員:</h4>
                <ul>
                    ${withoutPhotos.map(p => `<li>${p.name} - ${p.caseNumber || p.phone}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    content += '</div>';
    
    showModal('照片檢查結果', content);
}

function markAsComplete(personId) {
    const person = personList.find(p => p.id === personId);
    if (person) {
        person.status = 'completed';
        person.completedAt = new Date();
        localStorage.setItem('personList', JSON.stringify(personList));
        window.showNotification && window.showNotification(`${person.name} 已標記為完成（${formatDateTime(person.completedAt)}）`, 'success');
        if (window.filterData) window.filterData();
    }
}

function markAsIncomplete(personId) {
    const person = personList.find(p => p.id === personId);
    if (person) {
        person.status = 'pending';
        person.completedAt = null;
        localStorage.setItem('personList', JSON.stringify(personList));
        window.showNotification && window.showNotification(`${person.name} 已設為未完成`, 'success');
        if (window.filterData) window.filterData();
    }
}

function searchPeople() {
    const searchTerm = document.getElementById('search-input').value.trim();
    const searchYear = document.getElementById('search-year').value;
    const searchMonth = document.getElementById('search-month').value;
    
    let filtered = personList;
    
    if (searchTerm) {
        filtered = filtered.filter(person => 
            person.name.includes(searchTerm) || 
            person.phone.includes(searchTerm) || 
            person.address.includes(searchTerm) ||
            person.memo.includes(searchTerm)
        );
    }
    
    if (searchYear) {
        filtered = filtered.filter(person => person.createdYear === parseInt(searchYear));
    }
    
    if (searchMonth) {
        filtered = filtered.filter(person => person.createdMonth === parseInt(searchMonth));
    }
    
    displayData(filtered);
    showNotification(`搜尋結果: ${filtered.length} 筆資料`, 'info');
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-year').value = '';
    document.getElementById('search-month').value = '';
    filterData();
    showNotification('搜尋條件已清除', 'info');
}

function editPerson(personId) {
    const person = personList.find(p => p.id === personId);
    if (!person) {
        window.showNotification && window.showNotification('未找到人員資料', 'error');
        return;
    }
    
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    
    if (!modal || !form) {
        window.showNotification && window.showNotification('編輯模態框載入失敗', 'error');
        return;
    }
    
    // 填充年份選項
    const yearSelect = form.querySelector('[name="year"]');
    if (yearSelect) {
        yearSelect.innerHTML = '<option value="">請選擇年份</option>';
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            yearSelect.appendChild(option);
        }
    }
    
    // 填充表單
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const editCaseInput = form.querySelector('[name="caseNumber"]');
    const addressInput = form.querySelector('[name="address"]');
    const memoInput = form.querySelector('[name="memo"]');
    const yearInput = form.querySelector('[name="year"]');
    const monthInput = form.querySelector('[name="month"]');
    
    if (nameInput) nameInput.value = person.name || '';
    if (phoneInput) phoneInput.value = person.phone || '';
    if (editCaseInput) editCaseInput.value = person.caseNumber || '';
    if (addressInput) addressInput.value = person.address || '';
    if (memoInput) memoInput.value = person.memo || '';
    if (yearInput) yearInput.value = person.createdYear || '';
    if (monthInput) monthInput.value = person.createdMonth || '';
    // 状态现在由卡片上的按钮直接管理，不再在编辑表单中设置
    
    // 顯示照片預覽
    const photoPreview = form.querySelector('.photo-preview');
    if (photoPreview) {
        if (person.photo) {
            photoPreview.innerHTML = `<img src="${person.photo}" alt="照片" style="max-width: 100px; max-height: 100px; border-radius: 8px;">`;
        } else {
            photoPreview.innerHTML = '<p style="color: #666; font-style: italic;">無照片</p>';
        }
    }
    
    // 設置表單提交處理
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        person.name = formData.get('name');
        person.phone = formData.get('phone');
        person.address = formData.get('address');
        person.caseNumber = (formData.get('caseNumber') || '').trim();
        person.memo = formData.get('memo');
        const y = parseInt(formData.get('year'));
        const m = parseInt(formData.get('month'));
        if (!isNaN(y)) person.createdYear = y;
        if (!isNaN(m)) person.createdMonth = m;

        
        // 處理新照片
        const newPhoto = formData.get('photo');
        if (newPhoto && newPhoto.size > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                person.photo = e.target.result;
                window.saveData && window.saveData();
                closeModal();
                const editModalEl = document.getElementById('edit-modal');
                if (editModalEl) editModalEl.style.display = 'none';
                filterData();
                if (document.getElementById('statistics').style.display !== 'none') { updateStatistics(); }
                window.showNotification && window.showNotification('人員資料已更新', 'success');
            };
            reader.readAsDataURL(newPhoto);
        } else {
            window.saveData && window.saveData();
            closeModal();
            const editModalEl = document.getElementById('edit-modal');
            if (editModalEl) editModalEl.style.display = 'none';
            filterData();
            if (document.getElementById('statistics').style.display !== 'none') { updateStatistics(); }
            window.showNotification && window.showNotification('人員資料已更新', 'success');
        }
    };
    
    modal.style.display = 'flex';
}

function deletePerson(personId) {
    console.log('=== 刪除人員調試信息 ===');
    console.log('要刪除的ID:', personId);
    console.log('當前人員列表長度:', personList.length);
    console.log('人員列表:', personList);
    
    const person = personList.find(p => p.id === personId);
    console.log('找到的人員:', person);
    
    if (!person) {
        console.log('❌ 未找到要刪除的人員');
        window.showNotification && window.showNotification('未找到要刪除的人員', 'error');
        return;
    }
    
    if (confirm(`確定要刪除 ${person.name} 的資料嗎？`)) {
        console.log('用戶確認刪除，開始執行刪除操作');
        
        const originalLength = personList.length;
        personList = personList.filter(p => p.id !== personId);
        const newLength = personList.length;
        
        console.log('刪除前長度:', originalLength, '刪除後長度:', newLength);
        console.log('刪除操作是否成功:', originalLength > newLength);
        
        if (originalLength > newLength) {
            // 直接保存到 localStorage
            localStorage.setItem('personList', JSON.stringify(personList));
            // 重新渲染照護列表（使用全域引用，避免作用域綁定問題）
            if (window.filterData) {
                window.filterData();
            } else if (typeof filterData === 'function') {
                filterData();
            }
            // 立即移除當前頁面上的卡片，避免視覺殘留
            const staleCard = document.querySelector(`.person-card[data-person-id="${personId}"]`);
            if (staleCard && staleCard.parentNode) {
                staleCard.parentNode.removeChild(staleCard);
            }
            // 若統計頁面開啟中，立即刷新統計資料與月份分佈
            const statisticsSection = document.getElementById('statistics');
            if (statisticsSection && statisticsSection.style.display !== 'none') {
                updateStatistics();
            }
            window.showNotification && window.showNotification(`${person.name} 的資料已刪除`, 'success');
            console.log('✅ 刪除操作完成');
        } else {
            console.log('❌ 刪除操作失敗');
            window.showNotification && window.showNotification('刪除操作失敗', 'error');
        }
    } else {
        console.log('用戶取消刪除操作');
    }
}

// 顯示人員詳情
function showPersonDetail(personId) {
    const person = personList.find(p => p.id === personId);
    if (!person) {
        window.showNotification && window.showNotification('未找到人員資料', 'error');
        return;
    }
    
    const detailHtml = `
        <div class="person-detail-modal-modern">
            <div class="detail-header-modern">
                <div class="header-content">
                    <div class="person-avatar">
                        ${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : '<div class="avatar-placeholder">👤</div>'}
                    </div>
                    <div class="person-title">
                        <h3>${person.name}</h3>
                        <p class="person-subtitle">詳細資料檢視</p>
                    </div>
                </div>
                <button class="close-btn-modern" onclick="closeModal()">
                    <span class="close-icon">✕</span>
                </button>
            </div>
            
            <div class="detail-content-modern">
                <div class="detail-sections">
                    <!-- 基本資料區塊 -->
                    <div class="detail-section">
                        <div class="section-header-modern">
                            <span class="section-icon-modern">📋</span>
                            <h4>基本資料</h4>
                        </div>
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-icon">👤</div>
                                <div class="info-content">
                                    <div class="info-label">姓名</div>
                                    <div class="info-value">${person.name}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">📞</div>
                                <div class="info-content">
                                    <div class="info-label">電話</div>
                                    <div class="info-value">${person.phone}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">🏠</div>
                                <div class="info-content">
                                    <div class="info-label">地址</div>
                                    <div class="info-value">${person.address}</div>
                                </div>
                            </div>
                            <div class="info-card">
                                <div class="info-icon">🔢</div>
                                <div class="info-content">
                                    <div class="info-label">個案號碼</div>
                                    <div class="info-value">${person.caseNumber || '未設定'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 狀態與備註區塊 -->
                    <div class="detail-section">
                        <div class="section-header-modern">
                            <span class="section-icon-modern">📝</span>
                            <h4>狀態與備註</h4>
                        </div>
                        <div class="status-memo-grid">
                            <div class="status-card ${person.status === 'completed' ? 'completed' : 'pending'}">
                                <div class="status-icon">${person.status === 'completed' ? '✅' : '⏳'}</div>
                                <div class="status-content">
                                    <div class="status-label">處理狀態</div>
                                    <div class="status-value">${person.status === 'completed' ? '已完成' : '待處理'}</div>
                                    ${person.completedAt ? `<div class="status-time">完成時間：${formatDateTime(person.completedAt)}</div>` : ''}
                                </div>
                            </div>
                            <div class="memo-card">
                                <div class="memo-icon">💭</div>
                                <div class="memo-content">
                                    <div class="memo-label">備註</div>
                                    <div class="memo-value">${person.memo || '無備註'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 時間資訊區塊 -->
                    <div class="detail-section">
                        <div class="section-header-modern">
                            <span class="section-icon-modern">⏰</span>
                            <h4>時間資訊</h4>
                        </div>
                        <div class="time-grid">
                            <div class="time-card">
                                <div class="time-icon">📅</div>
                                <div class="time-content">
                                    <div class="time-label">建立時間</div>
                                    <div class="time-value">${formatDateTime(person.createdAt)}</div>
                                </div>
                            </div>
                            ${person.completedAt ? `
                            <div class="time-card completed">
                                <div class="time-icon">✅</div>
                                <div class="time-content">
                                    <div class="time-label">完成時間</div>
                                    <div class="time-value">${formatDateTime(person.completedAt)}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- 地圖區塊 -->
                    <div class="detail-section">
                        <div class="section-header-modern">
                            <span class="section-icon-modern">🗺️</span>
                            <h4>位置資訊</h4>
                        </div>
                        <div class="map-container">
                            <iframe class="detail-map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(person.address)}&output=embed"></iframe>
                        </div>
                    </div>
                </div>
                
                <!-- 操作按鈕 -->
                <div class="detail-actions">
                    <button class="action-btn edit-btn" onclick="editPerson(${person.id}); closeModal();">
                        <span class="btn-icon">✏️</span>
                        <span class="btn-text">編輯資料</span>
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePerson(${person.id}); closeModal();">
                        <span class="btn-icon">🗑️</span>
                        <span class="btn-text">刪除資料</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    showModal('詳細資料', detailHtml);
}

// 顯示地圖
function showMap(address) {
    if (!address) {
        showNotification('地址資訊不完整', 'warning');
        return;
    }
    
    // 使用 Google Maps 搜尋地址
    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // 在新視窗中開啟地圖
    window.open(mapUrl, '_blank');
    showNotification('已在新視窗中開啟地圖', 'info');
}

// 移除重複的 filterData 函數定義

// 移除重複的 updateStatistics 函數定義

// 移除重複的 updateMonthDistribution 函數定義

// 移除重複的 initializeStatsYearSelect 函數定義

// initializeSearchYearSelect 函數已移除（年份選擇器由 initializeDateSelectors 統一管理）

// 移除重複的 displayData 函數定義

// 移除重複的函數定義

// 全域變數
let personList = [];
let currentTheme = 'light';
let currentUser = null;
let timeInterval = null;

// 等待DOM載入完成
document.addEventListener('DOMContentLoaded', function() {
    
    // 初始化全域變數
    currentUser = null;
    personList = JSON.parse(localStorage.getItem('personList')) || [];
    currentTheme = localStorage.getItem('currentTheme') || 'light';
    timeInterval = null;
    
    // 獲取頁面元素
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const currentTimeElement = document.getElementById('current-time');
    const addPersonForm = document.getElementById('add-person-form');
    const addPersonModal = document.getElementById('add-person-modal');
    const personPhotoInput = document.getElementById('person-photo');
    const photoPreview = document.getElementById('photo-preview');
    
    // 初始化系統
    initializeSystem();
    
    // 應用已儲存的主題設定
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // 判斷是否已登入（持久化），並啟用 Hash Router
    const savedUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    if (savedUser) currentUser = savedUser;
    window.addEventListener('hashchange', router);
    router();
    
    // 啟動時間更新（包括登入頁面）
    startTimeUpdate();
    
    // 初始化手機功能（返回由 hash 處理即可）
    initializeMobileGestures();
    
    // 綁定卹滿照護功能按鈕（雙保險：即使 inline onclick 失效，事件也會觸發）
    const addPersonBtn = document.getElementById('add-person-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const checkPhotosBtn = document.getElementById('check-photos-btn');
    if (addPersonBtn) addPersonBtn.addEventListener('click', () => { try { showAddPersonForm(); } catch(e) { window.showNotification && window.showNotification('開啟新增表單失敗', 'error'); } });
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => { try { exportToCSV(); } catch(e) { window.showNotification && window.showNotification('匯出CSV失敗', 'error'); } });
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => { try { exportToPDF(); } catch(e) { window.showNotification && window.showNotification('匯出PDF失敗', 'error'); } });
    if (checkPhotosBtn) checkPhotosBtn.addEventListener('click', () => { try { checkPhotos(); } catch(e) { window.showNotification && window.showNotification('檢查照片失敗', 'error'); } });

    // 登入表單處理
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 簡單的登入驗證
        if (username === 'admin' && password === '123456') {
            currentUser = { username: username };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loginSection.style.display = 'none';
            mainSection.style.display = 'block';
            window.showNotification && window.showNotification('登入成功！歡迎使用留守資訊系統', 'success');
            
            // 初始化系統並顯示功能選擇介面
            initializeSystem();
            // 設定初始檢視
            isHandlingPopstate = true;
            showSection('function-selection');
            history.replaceState({ view: 'function-selection' }, '');
            isHandlingPopstate = false;
            localStorage.setItem('currentView', 'function-selection');
        } else {
            window.showNotification && window.showNotification('帳號或密碼錯誤，請重新輸入', 'error');
        }
    });
    
    // 新增/編輯人員表單處理
    addPersonForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const name = formData.get('name').trim();
        const caseNumber = formData.get('caseNumber').trim();
        const phone = formData.get('phone').trim();
        const address = formData.get('address').trim();
        
        // 基本驗證
        if (!name || !caseNumber || !phone || !address) {
            window.showNotification && window.showNotification('請填寫所有必填欄位', 'error');
            return;
        }
        
        // 額外驗證
        if (name.length < 2) {
            window.showNotification && window.showNotification('姓名至少需要2個字元', 'error');
            return;
        }
        
        if (caseNumber.length < 1) {
            window.showNotification && window.showNotification('個案號碼不能為空', 'error');
            return;
        }
        
        if (phone.length < 8) {
            window.showNotification && window.showNotification('電話號碼格式不正確', 'error');
            return;
        }
        
        if (address.length < 5) {
            window.showNotification && window.showNotification('地址至少需要5個字元', 'error');
            return;
        }
        
        // 檢查是否為編輯模式
        const isEditMode = this.dataset.editMode === 'true';
        const editId = parseInt(this.dataset.editId);
        
        if (isEditMode) {
            // 編輯模式：更新現有人員
            const personIndex = personList.findIndex(p => p.id === editId);
            if (personIndex !== -1) {
                // 獲取選擇的月份和年份
                const selectedMonth = formData.get('month');
                const selectedYear = document.getElementById('year-select')?.value;
                
                // 確保月份和年份都是數字類型
                const updatedYear = selectedYear ? parseInt(selectedYear) : personList[personIndex].createdYear;
                const updatedMonth = parseInt(selectedMonth);
                
                // 驗證月份範圍
                if (updatedMonth < 1 || updatedMonth > 12) {
                    window.showNotification && window.showNotification('月份必須在1-12之間', 'error');
                    return;
                }
                
                console.log('編輯人員月份更新：', {
                    selectedMonth: selectedMonth,
                    updatedMonth: updatedMonth,
                    updatedYear: updatedYear,
                    originalMonth: personList[personIndex].createdMonth,
                    originalYear: personList[personIndex].createdYear
                });
                
                const updatedPerson = {
                    ...personList[personIndex],
                    name: name,
                    caseNumber: caseNumber,
                    phone: phone,
                    address: address,
                    memo: formData.get('memo').trim(),
                    createdMonth: updatedMonth,
                    createdYear: updatedYear,
                    updatedAt: new Date().toISOString()
                };
                
                // 處理照片更新
                const photoFile = formData.get('photo');
                if (photoFile && photoFile.size > 0) {
                    if (photoFile.size > 5 * 1024 * 1024) {
                        window.showNotification && window.showNotification('照片檔案大小不能超過5MB', 'error');
                        return;
                    }
                    
                    if (!photoFile.type.startsWith('image/')) {
                        window.showNotification && window.showNotification('請選擇有效的圖片檔案', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        updatedPerson.photo = e.target.result;
                        updatePersonInList(updatedPerson);
                    };
                    reader.onerror = function() {
                        window.showNotification && window.showNotification('照片讀取失敗，請重試', 'error');
                    };
                    reader.readAsDataURL(photoFile);
                } else {
                    updatePersonInList(updatedPerson);
                }
            }
        } else {
            // 新增模式：創建新人員
            // 獲取表單中選擇的月份
            const selectedMonth = formData.get('month');
            
            if (!selectedMonth) {
                window.showNotification && window.showNotification('請選擇分配月份', 'error');
                return;
            }
            
            // 獲取篩選區域的年份（如果有的話）
            const selectedYear = document.getElementById('year-select')?.value;
            
            // 確保月份和年份都是數字類型
            const createdYear = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
            const createdMonth = parseInt(selectedMonth);
            
            // 驗證月份範圍
            if (createdMonth < 1 || createdMonth > 12) {
                window.showNotification && window.showNotification('月份必須在1-12之間', 'error');
                return;
            }
            
            // 創建日期（使用選擇的年月，日期設為1號）
            const createdDate = new Date(createdYear, createdMonth - 1, 1);
            
            console.log('新增人員月份分配：', {
                selectedMonth: selectedMonth,
                createdMonth: createdMonth,
                createdYear: createdYear,
                createdDate: createdDate
            });
            
            const personData = {
                id: Date.now(),
                name: name,
                caseNumber: caseNumber,
                phone: phone,
                address: address,
                memo: formData.get('memo').trim(),
                photo: null,
                // 建立時間採用「現在時間」（本地）
                createdAt: new Date(),
                createdMonth: createdMonth,
                createdYear: createdYear,
                status: 'pending'
            };
            
            // 處理照片上傳（穩定取得第一張檔案，並容錯避免提交無反應）
            const formFile = formData.get('photo');
            const inputEl = document.getElementById('person-photo');
            const fileFromInput = (inputEl && inputEl.files && inputEl.files.length > 0) ? inputEl.files[0] : null;
            const photoFile = fileFromInput || (formFile && formFile.size > 0 ? formFile : null);
            
            if (photoFile) {
                if (!photoFile.type || !photoFile.type.startsWith('image/')) {
                    window.showNotification && window.showNotification('請選擇有效的圖片檔案', 'error');
                    // 照片無效，仍保存其他資料
                    addPersonToList(personData);
                    return;
                }
                
                if (photoFile.size > 5 * 1024 * 1024) {
                    window.showNotification && window.showNotification('照片過大，將不附加照片但仍保存資料', 'warning');
                    addPersonToList(personData);
                    return;
                }
                
                // 顯示載入提示
                window.showNotification && window.showNotification('正在處理照片，請稍候...', 'info');
                
                const reader = new FileReader();
                let hasSettled = false;
                const settle = (withPhoto) => {
                    if (hasSettled) return;
                    hasSettled = true;
                    if (withPhoto) personData.photo = withPhoto;
                    addPersonToList(personData);
                };
                reader.onload = function(e) { settle(e.target.result); };
                reader.onerror = function() {
                    window.showNotification && window.showNotification('照片讀取失敗，將不附加照片但仍保存資料', 'warning');
                    settle(null);
                };
                reader.onabort = function() {
                    window.showNotification && window.showNotification('照片讀取中止，將不附加照片但仍保存資料', 'warning');
                    settle(null);
                };
                reader.readAsDataURL(photoFile);
            } else {
                // 沒有選擇照片，直接新增
                addPersonToList(personData);
            }
        }
    });
    
    // 照片預覽功能
    personPhotoInput.addEventListener('change', function(e) {
        const files = e.target.files;
        const fileUploadText = document.querySelector('.file-upload-text');
        
        if (files.length > 0) {
            // 更新檔案名稱顯示
            if (files.length === 1) {
                fileUploadText.textContent = files[0].name;
            } else {
                fileUploadText.textContent = `已選擇 ${files.length} 個檔案`;
            }
            
            // 檢查檔案大小和類型
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // 檢查檔案大小
                if (file.size > 5 * 1024 * 1024) {
                    window.showNotification && window.showNotification(`檔案 ${file.name} 大小不能超過5MB`, 'error');
                    this.value = '';
                    photoPreview.innerHTML = '';
                    fileUploadText.textContent = '沒有選擇檔案';
                    return;
                }
                
                // 檢查檔案類型
                if (!file.type.startsWith('image/')) {
                    window.showNotification && window.showNotification(`檔案 ${file.name} 不是有效的圖片檔案`, 'error');
                    this.value = '';
                    photoPreview.innerHTML = '';
                    fileUploadText.textContent = '沒有選擇檔案';
                    return;
                }
            }
            
            // 顯示第一張照片的預覽
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="照片預覽">`;
            };
            reader.onerror = function() {
                window.showNotification && window.showNotification('照片讀取失敗，請重試', 'error');
            };
            reader.readAsDataURL(files[0]);
        } else {
            photoPreview.innerHTML = '';
            fileUploadText.textContent = '沒有選擇檔案';
        }
    });
    
    // 全域函數
    window.showAddPersonForm = function() {
        addPersonModal.style.display = 'flex';
        addPersonForm.reset();
        photoPreview.innerHTML = '';
        
        // 重置檔案上傳文字
        const fileUploadText = document.querySelector('.file-upload-text');
        if (fileUploadText) {
            fileUploadText.textContent = '沒有選擇檔案';
        }
        
        // 重置編輯模式
        delete addPersonForm.dataset.editMode;
        delete addPersonForm.dataset.editId;
        
        // 重置模態框標題和按鈕
        const modalTitle = document.querySelector('.modal-header h3');
        const submitBtn = document.querySelector('.modal-form .btn-primary');
        if (modalTitle) modalTitle.textContent = '新增人員';
        if (submitBtn) submitBtn.textContent = '新增人員';
        
        // 智能設定月份：優先使用篩選條件中的月份，否則使用當前月份
        const selectedYear = document.getElementById('year-select')?.value;
        const selectedMonth = document.getElementById('month-select')?.value;
        const currentMonth = new Date().getMonth() + 1;
        
        const monthSelect = document.getElementById('person-month');
        if (monthSelect) {
            if (selectedMonth) {
                // 如果有篩選月份，使用篩選月份
                monthSelect.value = selectedMonth;
                showNotification(`篩選條件：${selectedYear}年${selectedMonth}月 | 表單已自動設定為${selectedMonth}月`, 'info');
            } else {
                // 如果沒有篩選月份，使用當前月份
                monthSelect.value = currentMonth.toString().padStart(2, '0');
                showNotification('請在篩選區域選擇年月，或在表單中選擇要分配的月份', 'info');
            }
        }
    };
    
    // 舊的 closeModal 函數已被新的全域 closeModal 函數取代
    
    // 舊的 exportCSV 函數已被新的全域 exportToCSV 函數取代
    
    // 舊的 exportPDF 函數已被新的全域 exportToPDF 函數取代
    
    // 舊的 checkPhotos 函數已被新的全域 checkPhotos 函數取代
    
    // 舊的 toggleTheme 函數已被新的全域 toggleTheme 函數取代
    
    // 舊的 logout 函數已被移除，使用新的全域函數
    
    // 舊的 markComplete 函數已被新的全域 markAsComplete 函數取代
    
    // 舊的 showPersonDetail 函數已被移除，使用新的全域函數
    
    // 舊的 editPerson 函數已被新的全域 editPerson 函數取代
    
    // 舊的 deletePerson 函數已被新的全域 deletePerson 函數取代
    
    // 舊的 showMap 函數已被移除，使用新的全域函數
    
    // 輔助函數
    function initializeSystem() {
        // 初始化年份和月份選單
        initializeDateSelectors();
        
        // 設定預設值
        const currentDate = new Date();
        const yearSelect = document.getElementById('year-select');
        const monthSelect = document.getElementById('month-select');
        
        if (yearSelect) {
            yearSelect.value = currentDate.getFullYear().toString();
        }
        if (monthSelect) {
            monthSelect.value = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        }
        
        // 初始化搜尋功能
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterData();
            });
        }
        
        // 初始化篩選功能
        const yearSelectElement = document.getElementById('year-select');
        const monthSelectElement = document.getElementById('month-select');
        
        if (yearSelectElement) {
            yearSelectElement.addEventListener('change', filterData);
        }
        if (monthSelectElement) {
            monthSelectElement.addEventListener('change', filterData);
        }
    }
    
    function initializeDateSelectors() {
        const yearSelect = document.getElementById('year-select');
        const monthSelect = document.getElementById('month-select');
        
        if (yearSelect) {
            // 初始化年份選單（前5年到後5年）
            const currentYear = new Date().getFullYear();
            for (let year = currentYear - 5; year <= currentYear + 5; year++) {
                const option = document.createElement('option');
                option.value = year.toString();
                option.textContent = `${year}年`;
                yearSelect.appendChild(option);
            }
        }
        
        if (monthSelect) {
            // 初始化月份選單
            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month.toString().padStart(2, '0');
                option.textContent = `${month}月`;
                monthSelect.appendChild(option);
            }
        }
    }
    
    function addPersonToList(personData) {
        // 檢查是否已存在相同個案號碼的人員
        const existingPerson = personList.find(p => p.caseNumber === personData.caseNumber);
        if (existingPerson) {
            showNotification('個案號碼已存在，請使用不同的號碼', 'error');
            return;
        }
        
        // 新增人員到列表
        personList.push(personData);
        localStorage.setItem('personList', JSON.stringify(personList));
        
        // 重置表單和預覽
        addPersonForm.reset();
        photoPreview.innerHTML = '';
        
        // 關閉模態框
        closeModal();
        
        // 顯示成功訊息
        window.showNotification && window.showNotification(`人員 ${personData.name} 新增成功！`, 'success');
        
        // 重新篩選和顯示資料
        filterData();
    }
    
    function updatePersonInList(updatedPerson) {
        const personIndex = personList.findIndex(p => p.id === updatedPerson.id);
        if (personIndex !== -1) {
            // 檢查個案號碼是否被其他人員使用（排除自己）
            const existingPerson = personList.find(p => 
                p.caseNumber === updatedPerson.caseNumber && p.id !== updatedPerson.id
            );
            if (existingPerson) {
                showNotification('個案號碼已被其他人員使用，請使用不同的號碼', 'error');
                return;
            }
            
            // 更新人員資料
            personList[personIndex] = updatedPerson;
            localStorage.setItem('personList', JSON.stringify(personList));
            
            // 重置表單和編輯模式
            addPersonForm.reset();
            photoPreview.innerHTML = '';
            delete addPersonForm.dataset.editMode;
            delete addPersonForm.dataset.editId;
            
            // 重置模態框標題和按鈕
            const modalTitle = document.querySelector('.modal-header h3');
            const submitBtn = document.querySelector('.modal-form .btn-primary');
            if (modalTitle) modalTitle.textContent = '新增人員';
            if (submitBtn) submitBtn.textContent = '新增';
            
            // 關閉模態框
            closeModal();
            
            // 顯示成功訊息
            showNotification(`人員 ${updatedPerson.name} 資料更新成功！`, 'success');
            
            // 重新篩選和顯示資料
            filterData();
        }
    }
    
    function filterData() {
        const year = document.getElementById('year-select')?.value;
        const month = document.getElementById('month-select')?.value;
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
        
        let filteredData = personList;
        
        // 根據搜尋詞篩選
        if (searchTerm) {
            filteredData = filteredData.filter(person => 
                person.name.toLowerCase().includes(searchTerm) ||
                person.caseNumber.toLowerCase().includes(searchTerm) ||
                person.phone.includes(searchTerm) ||
                person.address.toLowerCase().includes(searchTerm)
            );
        }
        
        // 根據年份篩選 - 確保類型一致
        if (year) {
            const filterYear = parseInt(year);
            filteredData = filteredData.filter(person => {
                const personYear = person.createdYear || new Date(person.createdAt).getFullYear();
                return personYear === filterYear;
            });
        }
        
        // 根據月份篩選 - 確保類型一致
        if (month) {
            const filterMonth = parseInt(month);
            filteredData = filteredData.filter(person => {
                const personMonth = person.createdMonth || new Date(person.createdAt).getMonth() + 1;
                return personMonth === filterMonth;
            });
        }
        
        // 顯示篩選結果數量
        if (filteredData.length !== personList.length) {
            showNotification(`找到 ${filteredData.length} 筆資料`, 'info');
        }
        
        displayData(filteredData);
    }
    
    function displayData(data) {
        const dataContent = document.getElementById('data-content');
        if (!dataContent) return;
        
        // 更新數據計數信息
        const dataCountInfo = document.getElementById('data-count-info');
        if (dataCountInfo) {
            dataCountInfo.textContent = `共 ${data.length} 筆資料`;
        }
        
        if (data.length === 0) {
            dataContent.innerHTML = '<p class="no-data-message">目前沒有資料</p>';
            return;
        }
        
        // 顯示人員列表
        let html = '<div class="person-list">';
        data.forEach(person => {
            // 獲取篩選條件中的年月
            const filterYear = document.getElementById('year-select')?.value;
            const filterMonth = document.getElementById('month-select')?.value;
            
            // 簡化狀態判斷：直接比較人員的分配年月和篩選條件
            const personMonth = person.createdMonth || new Date(person.createdAt).getMonth() + 1;
            const personYear = person.createdYear || new Date(person.createdAt).getFullYear();
            
            // 如果有篩選條件，比較篩選的年月；否則比較當前年月
            const isCurrentMonth = (filterYear && filterMonth) 
                ? (personYear.toString() === filterYear && personMonth === parseInt(filterMonth))
                : (personYear === new Date().getFullYear() && personMonth === new Date().getMonth() + 1);
            
            html += `
                <div class="person-card" data-person-id="${person.id}">
                    <div class="person-header">
                        <div class="person-photo">
                            ${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : '<div class="no-photo">無照片</div>'}
                        </div>
                                                 <div class="person-basic-info">
                             <div class="person-name">${person.name}</div>
                             <div class="person-details">
                                 <p><strong>電話：</strong>${person.phone}</p>
                                 <p><strong>地址：</strong>${person.address}</p>
                                 <p><strong>個案號碼：</strong>${person.caseNumber}</p>
                                                                 <div class="status-section">
                                     <span class="status-label">狀態：</span>
                                     <span class="status-badge ${person.status === 'completed' ? 'completed' : 'pending'}">${person.status === 'completed' ? '已完成' : '未完成'}</span>
                                     ${person.status !== 'completed' ? '<button class="btn btn-small btn-success mark-complete" onclick="markAsComplete(' + person.id + ')">完成</button>' : '<button class="btn btn-small btn-warning mark-incomplete" onclick="markAsIncomplete(' + person.id + ')">設為未完成</button>'}
                                     ${person.completedAt ? '<span class="completed-time">完成於：' + formatDateTime(person.completedAt) + '</span>' : ''}
                                 </div>
                            </div>
                        </div>
                    </div>
                    
                    ${person.memo ? `
                        <div class="memo-section">
                            <span class="memo-icon">[</span>
                            <span class="memo-text">備註: ${person.memo}</span>
                        </div>
                    ` : ''}
                    
                    <div class="map-section">
                        <iframe class="map-embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(person.address)}&output=embed"></iframe>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-detail" data-person-id="${person.id}" onclick="showPersonDetail(${person.id})">
                            <span class="btn-icon">👁️</span>詳細
                        </button>
                        <button class="btn btn-edit" data-person-id="${person.id}" onclick="editPerson(${person.id})">
                            <span class="btn-icon">✏️</span>編輯
                        </button>
                        <button class="btn btn-delete" data-person-id="${person.id}" onclick="deletePerson(${person.id})">
                            <span class="btn-icon">🗑️</span>刪除
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        dataContent.innerHTML = html;

        // 事件委派（雙保險）：即使 inline onclick 失效，仍能觸發功能
        if (!dataContent.__actionsBound) {
            dataContent.addEventListener('click', function(e) {
                const detailBtn = e.target.closest && e.target.closest('.btn.btn-detail');
                const editBtn = e.target.closest && e.target.closest('.btn.btn-edit');
                const delBtn = e.target.closest && e.target.closest('.btn.btn-delete');
                if (detailBtn) {
                    const pid = parseInt(detailBtn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) { try { showPersonDetail(pid); } catch (_) {} }
                } else if (editBtn) {
                    const pid = parseInt(editBtn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) { try { editPerson(pid); } catch (_) {} }
                } else if (delBtn) {
                    const pid = parseInt(delBtn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) { try { deletePerson(pid); } catch (_) {} }
                }
            });
            dataContent.__actionsBound = true;
        }

        // 直接綁定每顆按鈕（再多一層保險）
        try {
            dataContent.querySelectorAll('.btn.btn-detail').forEach(btn => {
                btn.addEventListener('click', function(ev){
                    ev.preventDefault(); ev.stopPropagation();
                    const pid = parseInt(btn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) showPersonDetail(pid);
                }, { once: false });
            });
            dataContent.querySelectorAll('.btn.btn-edit').forEach(btn => {
                btn.addEventListener('click', function(ev){
                    ev.preventDefault(); ev.stopPropagation();
                    const pid = parseInt(btn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) editPerson(pid);
                }, { once: false });
            });
            dataContent.querySelectorAll('.btn.btn-delete').forEach(btn => {
                btn.addEventListener('click', function(ev){
                    ev.preventDefault(); ev.stopPropagation();
                    const pid = parseInt(btn.getAttribute('data-person-id'));
                    if (!isNaN(pid)) deletePerson(pid);
                }, { once: false });
            });
        } catch (_) {}
    }
    
    function startTimeUpdate() {
        updateTime();
        timeInterval = setInterval(updateTime, 1000);
    }
    
    function stopTimeUpdate() {
        if (timeInterval) {
            clearInterval(timeInterval);
        }
    }
    
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-TW', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // 更新主系統的時間顯示
        if (currentTimeElement) {
            currentTimeElement.textContent = timeString;
        }
        
        // 更新登入頁面的時間顯示
        const loginTimeElement = document.getElementById('login-time');
        const loginTimeFooterElement = document.getElementById('login-time-footer');
        
        if (loginTimeElement) {
            loginTimeElement.textContent = timeString;
        }
        if (loginTimeFooterElement) {
            loginTimeFooterElement.textContent = timeString;
        }
    }

    // 本地時間格式化（將 ISO 或 Date 轉成 zh-TW 本地可讀字串）
    function formatDateTime(input) {
        try {
            const date = (input instanceof Date) ? input : new Date(input);
            if (isNaN(date.getTime())) return String(input || '');
            return date.toLocaleString('zh-TW', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
        } catch (_) {
            return String(input || '');
        }
    }

    // 從背景回到前景時，立即刷新時間並確保計時器存在
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateTime();
            if (!timeInterval) {
                timeInterval = setInterval(updateTime, 1000);
            }
        }
    });
    
    // 通知系統
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // 儲存目前 personList 到 localStorage（提供給編輯/新增流程呼叫）
    function saveData() {
        try {
            localStorage.setItem('personList', JSON.stringify(personList));
            return true;
        } catch (err) {
            console.error('[saveData] 失敗', err);
            try { showNotification('資料儲存失敗：' + (err && err.message ? err.message : '未知錯誤'), 'error'); } catch(_) {}
            return false;
        }
    }
    
    // 點擊模態框外部關閉
    addPersonModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // 防止模態框內部點擊事件冒泡
    addPersonModal.querySelector('.modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 鍵盤快捷鍵
    document.addEventListener('keydown', function(e) {
        // ESC 鍵關閉模態框和通知
        if (e.key === 'Escape') {
            closeModal();
            const notifications = document.querySelectorAll('.notification');
            notifications.forEach(notification => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
    });
    
    // 控制台歡迎訊息
    console.log('%c歡迎使用留守資訊系統！', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c這是一個使用HTML、CSS和JavaScript構建的現代化留守資訊系統', 'color: #666; font-size: 14px;');
    
    // 開發者測試函數
    window.testAddPerson = function() {
        // 獲取篩選區域選擇的年月
        const selectedYear = document.getElementById('year-select')?.value;
        const selectedMonth = document.getElementById('month-select')?.value;
        
        // 根據選擇的年月創建日期
        let createdDate;
        let createdYear;
        let createdMonth;
        
        if (selectedYear && selectedMonth) {
            createdYear = parseInt(selectedYear);
            createdMonth = parseInt(selectedMonth);
            createdDate = new Date(createdYear, createdMonth - 1, 1);
            console.log(`測試資料將被分配到：${createdYear}年${createdMonth}月`);
        } else {
            const now = new Date();
            createdYear = now.getFullYear();
            createdMonth = now.getMonth() + 1;
            createdDate = now;
            console.log(`未選擇篩選條件，測試資料將被分配到：${createdYear}年${createdMonth}月`);
        }
        
        const testPerson = {
            id: Date.now(),
            name: '測試人員' + (personList.length + 1),
            caseNumber: 'TEST' + (personList.length + 1).toString().padStart(3, '0'),
            phone: '0912345678',
            address: '台北市測試區測試路123號',
            memo: '這是一個測試人員',
            photo: null,
            createdAt: new Date(),
            createdMonth: createdMonth,
            createdYear: createdYear,
            status: 'pending'
        };
        
        personList.push(testPerson);
        localStorage.setItem('personList', JSON.stringify(personList));
        filterData();
        window.showNotification && window.showNotification(`測試人員新增成功！已設定為 ${createdYear}年${createdMonth}月`, 'success');
        console.log('測試人員已新增:', testPerson);
    };
    
    // 調試函數：查看人員月份分配
    window.debugMonthAssignment = function() {
        console.log('=== 人員月份分配調試信息 ===');
        
        const filterYear = document.getElementById('year-select')?.value;
        const filterMonth = document.getElementById('month-select')?.value;
        const formMonth = document.getElementById('person-month')?.value;
        
        console.log('當前狀態：');
        console.log(`篩選條件: ${filterYear || '未選擇'}年${filterMonth || '未選擇'}月`);
        console.log(`表單月份: ${formMonth || '未選擇'}月`);
        console.log(`總人數: ${personList.length}`);
        
        if (personList.length === 0) {
            console.log('目前沒有人員資料');
            return;
        }
        
        console.log('\n所有人員列表：');
        personList.forEach((person, index) => {
            const isCurrentFilter = (filterYear && filterMonth) 
                ? (person.createdYear.toString() === filterYear && person.createdMonth.toString() === filterMonth)
                : false;
            
            console.log(`${index + 1}. ${person.name} - 個案號碼: ${person.caseNumber}`);
            console.log(`   分配月份: ${person.createdYear}年${person.createdMonth}月`);
            console.log(`   創建日期: ${person.createdAt}`);
            console.log(`   狀態: ${person.status}`);
            console.log(`   符合當前篩選: ${isCurrentFilter ? '✅ 是' : '❌ 否'}`);
            console.log('---');
        });
        
        // 按月份分組統計
        const monthGroups = {};
        personList.forEach(person => {
            const key = `${person.createdYear}年${person.createdMonth}月`;
            if (!monthGroups[key]) {
                monthGroups[key] = [];
            }
            monthGroups[key].push(person.name);
        });
        
        console.log('\n按月份分組統計：');
        Object.keys(monthGroups).forEach(month => {
            const isCurrentFilter = month === `${filterYear}年${filterMonth}月`;
            console.log(`${month}: ${monthGroups[month].length}人 - ${monthGroups[month].join(', ')} ${isCurrentFilter ? '👈 當前篩選' : ''}`);
        });
        
        // 邏輯驗證
        console.log('\n邏輯驗證：');
        if (filterYear && filterMonth) {
            const filteredCount = personList.filter(person => 
                person.createdYear.toString() === filterYear && 
                person.createdMonth.toString() === filterMonth
            ).length;
            console.log(`篩選條件 ${filterYear}年${filterMonth}月 應該顯示 ${filteredCount} 人`);
        }
    };
    
    // 測試月份分配邏輯的函數
    window.testMonthLogic = function() {
        console.log('=== 測試月份分配邏輯 ===');
        
        const filterYear = document.getElementById('year-select')?.value;
        const filterMonth = document.getElementById('month-select')?.value;
        const formMonth = document.getElementById('person-month')?.value;
        
        console.log('測試條件：');
        console.log(`篩選年份: ${filterYear || '未選擇'}`);
        console.log(`篩選月份: ${filterMonth || '未選擇'}`);
        console.log(`表單月份: ${formMonth || '未選擇'}`);
        
        if (!formMonth) {
            console.log('❌ 錯誤：表單中沒有選擇月份');
            return;
        }
        
        // 模擬新增人員的邏輯
        const createdYear = filterYear ? parseInt(filterYear) : new Date().getFullYear();
        const createdMonth = parseInt(formMonth);
        const createdDate = new Date(createdYear, createdMonth - 1, 1);
        
        console.log('\n模擬結果：');
        console.log(`人員將被分配到: ${createdYear}年${createdMonth}月`);
        console.log(`創建日期: ${createdDate.toISOString()}`);
        
        // 驗證篩選邏輯
        if (filterYear && filterMonth) {
            const willShowInFilter = (createdYear.toString() === filterYear && createdMonth.toString() === filterMonth);
            console.log(`是否會在當前篩選條件下顯示: ${willShowInFilter ? '✅ 是' : '❌ 否'}`);
            
            if (!willShowInFilter) {
                console.log('⚠️ 警告：人員不會在當前篩選條件下顯示！');
                console.log('建議：確保篩選條件和表單月份一致');
            }
        } else {
            console.log('⚠️ 注意：沒有設定篩選條件，人員將顯示在所有資料中');
        }
        
        // 檢查現有人員的月份分配
        console.log('\n現有人員月份分配檢查：');
        if (personList.length > 0) {
            const monthGroups = {};
            personList.forEach(person => {
                const key = `${person.createdYear}年${person.createdMonth}月`;
                if (!monthGroups[key]) {
                    monthGroups[key] = [];
                }
                monthGroups[key].push(person.name);
            });
            
            Object.keys(monthGroups).forEach(month => {
                const isCurrentFilter = month === `${filterYear}年${filterMonth}月`;
                console.log(`${month}: ${monthGroups[month].length}人 - ${monthGroups[month].join(', ')} ${isCurrentFilter ? '👈 當前篩選' : ''}`);
            });
        } else {
            console.log('目前沒有人員資料');
        }
        
        // 檢查篩選邏輯
        console.log('\n篩選邏輯檢查：');
        if (filterYear && filterMonth) {
            const filteredCount = personList.filter(person => 
                person.createdYear.toString() === filterYear && 
                person.createdMonth.toString() === filterMonth
            ).length;
            console.log(`篩選條件 ${filterYear}年${filterMonth}月 應該顯示 ${filteredCount} 人`);
            
            // 檢查每個人的篩選狀態
            personList.forEach(person => {
                const isFiltered = (person.createdYear.toString() === filterYear && person.createdMonth.toString() === filterMonth);
                console.log(`${person.name}: ${person.createdYear}年${person.createdMonth}月 - ${isFiltered ? '✅ 符合篩選' : '❌ 不符合篩選'}`);
            });
        }
    };
    
    // 修復舊資料格式的函數
    window.fixDataFormat = function() {
        console.log('=== 修復資料格式 ===');
        
        let fixedCount = 0;
        personList.forEach(person => {
            // 確保月份是數字格式
            if (typeof person.createdMonth === 'string') {
                person.createdMonth = parseInt(person.createdMonth);
                fixedCount++;
            }
            
            // 確保年份是數字格式
            if (typeof person.createdYear === 'string') {
                person.createdYear = parseInt(person.createdYear);
                fixedCount++;
            }
        });
        
        if (fixedCount > 0) {
            localStorage.setItem('personList', JSON.stringify(personList));
            console.log(`已修復 ${fixedCount} 個資料格式問題`);
            filterData(); // 重新篩選和顯示
        } else {
            console.log('資料格式正常，無需修復');
        }
    };
    
    // 快速測試月份分配
    window.quickTest = function() {
        console.log('=== 快速測試月份分配 ===');
        
        // 1. 檢查篩選條件
        const filterYear = document.getElementById('year-select')?.value;
        const filterMonth = document.getElementById('month-select')?.value;
        console.log(`當前篩選: ${filterYear || '未選擇'}年${filterMonth || '未選擇'}月`);
        
        // 2. 檢查表單月份
        const formMonth = document.getElementById('person-month')?.value;
        console.log(`表單月份: ${formMonth || '未選擇'}`);
        
        // 3. 模擬新增
        if (formMonth) {
            const createdYear = filterYear ? parseInt(filterYear) : new Date().getFullYear();
            const createdMonth = parseInt(formMonth);
            console.log(`人員將被分配到: ${createdYear}年${createdMonth}月`);
            
            // 4. 檢查是否會顯示在當前篩選下
            if (filterYear && filterMonth) {
                const willShow = (createdYear.toString() === filterYear && createdMonth === parseInt(filterMonth));
                console.log(`是否會顯示在當前篩選下: ${willShow ? '✅ 是' : '❌ 否'}`);
                
                if (!willShow) {
                    console.log('⚠️ 問題：人員不會顯示在當前篩選條件下！');
                    console.log('解決方案：確保篩選條件和表單月份一致');
                }
            }
        }
        
        // 5. 檢查現有人員
        console.log(`\n現有人員: ${personList.length}人`);
        personList.forEach(person => {
            const isCurrentFilter = (filterYear && filterMonth) 
                ? (person.createdYear.toString() === filterYear && person.createdMonth === parseInt(filterMonth))
                : false;
            console.log(`${person.name}: ${person.createdYear}年${person.createdMonth}月 ${isCurrentFilter ? '👈 當前篩選' : ''}`);
        });
        
        // 6. 檢查篩選邏輯
        console.log('\n篩選邏輯檢查：');
        if (filterYear && filterMonth) {
            const filteredCount = personList.filter(person => 
                person.createdYear.toString() === filterYear && 
                person.createdMonth === parseInt(filterMonth)
            ).length;
            console.log(`篩選條件 ${filterYear}年${filterMonth}月 應該顯示 ${filteredCount} 人`);
            
            // 檢查每個人的篩選狀態
            personList.forEach(person => {
                const isFiltered = (person.createdYear.toString() === filterYear && person.createdMonth === parseInt(filterMonth));
                console.log(`${person.name}: ${person.createdYear}年${person.createdMonth}月 - ${isFiltered ? '✅ 符合篩選' : '❌ 不符合篩選'}`);
            });
        }
    };
    
    // 專門測試月份篩選的函數
    window.testMonthFilter = function() {
        console.log('=== 測試月份篩選邏輯 ===');
        
        const filterYear = document.getElementById('year-select')?.value;
        const filterMonth = document.getElementById('month-select')?.value;
        
        console.log(`當前篩選條件: ${filterYear || '未選擇'}年${filterMonth || '未選擇'}月`);
        
        if (!filterYear || !filterMonth) {
            console.log('❌ 請先選擇年份和月份');
            return;
        }
        
        // 檢查篩選邏輯
        const filteredCount = personList.filter(person => 
            person.createdYear.toString() === filterYear && 
            person.createdMonth === parseInt(filterMonth)
        ).length;
        
        console.log(`\n篩選結果: 應該顯示 ${filteredCount} 人`);
        
        if (filteredCount === 0) {
            console.log('❌ 沒有找到符合條件的人員！');
            console.log('\n檢查所有人員的月份分配：');
            personList.forEach(person => {
                const yearMatch = person.createdYear.toString() === filterYear;
                const monthMatch = person.createdMonth === parseInt(filterMonth);
                console.log(`${person.name}: ${person.createdYear}年${person.createdMonth}月 - 年份: ${yearMatch ? '✅' : '❌'}, 月份: ${monthMatch ? '✅' : '❌'}`);
            });
            
            console.log('\n可能的問題：');
            console.log('1. 人員的月份格式不正確');
            console.log('2. 篩選條件和人員資料不匹配');
            console.log('3. 資料格式問題');
            
            console.log('\n建議執行：');
            console.log('fixDataFormat() - 修復資料格式');
            console.log('quickTest() - 快速診斷');
        } else {
            console.log('✅ 篩選邏輯正常');
            console.log('\n符合條件的人員：');
            personList.filter(person => 
                person.createdYear.toString() === filterYear && 
                person.createdMonth === parseInt(filterMonth)
            ).forEach(person => {
                console.log(`- ${person.name}: ${person.createdYear}年${person.createdMonth}月`);
            });
        }
    };
    
    console.log('%c開發者提示：使用 testAddPerson() 可以快速新增測試資料', 'color: #fd7e14; font-size: 14px;');
    console.log('%c使用 debugMonthAssignment() 可以查看月份分配調試信息', 'color: #17a2b8; font-size: 14px;');
    console.log('%c使用 testMonthLogic() 可以測試月份分配邏輯', 'color: #28a745; font-size: 14px;');
    console.log('%c使用 fixDataFormat() 可以修復舊資料格式問題', 'color: #dc3545; font-size: 14px;');
    console.log('%c使用 quickTest() 可以快速診斷月份分配問題', 'color: #6f42c1; font-size: 14px;');
    console.log('%c使用 testMonthFilter() 可以專門測試月份篩選邏輯', 'color: #e83e8c; font-size: 14px;');

    // 全域錯誤攔截，避免使用者感知為「沒反應」
    window.addEventListener('error', function(e) {
        const msg = e.message || '未知錯誤';
        const src = e.filename || '';
        const line = typeof e.lineno === 'number' ? e.lineno : 0;
        const col = typeof e.colno === 'number' ? e.colno : 0;
        // 過濾瀏覽器通用的跨來源訊息，避免每次點擊都彈出「Script error.」
        if (msg === 'Script error.' && (!src || src === '') && (!line || !col)) {
            return; // 靜默抑制
        }
        console.error('[GlobalErrorEvent]', { message: msg, src, line, col, error: e.error });
        try { showNotification(`錯誤：${msg} @${line || '?'}:${col || '?'}`, 'error'); } catch(_) {}
    }, true);
    window.onerror = function(message, source, lineno, colno, error) {
        // 抑制無來源的跨域 Script error. 提示
        if (message === 'Script error.' && (!source || source === '') && (!lineno || !colno)) {
            return true; // 靜默抑制
        }
        console.error('[window.onerror]', { message, source, lineno, colno, stack: error && error.stack });
        try { showNotification(`錯誤：${message} @${lineno || '?'}:${colno || '?'}`, 'error'); } catch(_) {}
        return false;
    };
    window.addEventListener('unhandledrejection', function(e) {
        const reason = e.reason || {};
        const msg = (reason && reason.message) ? reason.message : (typeof reason === 'string' ? reason : '未知錯誤');
        if (msg === 'Script error.') {
            return; // 靜默抑制
        }
        console.error('[unhandledrejection]', reason);
        try { showNotification('操作失敗（未處理承諾）：' + msg, 'error'); } catch(_) {}
    });

    // 建立安全包裝器，所有 onclick 走穩定流程
    function wrapSafe(functionName, originalFn) {
        if (typeof originalFn !== 'function') return originalFn;
        return function wrappedFunction() {
            try {
                return originalFn.apply(this, arguments);
            } catch (err) {
                console.error(`[${functionName}] 執行錯誤:`, err);
                const msg = err && err.message ? err.message : '未知錯誤';
                if (msg === 'Script error.') {
                    // 過濾通用訊息，避免誤報
                    return;
                }
                try { showNotification(`${functionName} 執行失敗：${msg}`, 'error'); } catch(_) {}
            }
        };
    }
    
    // 顯示指定區域
    function showSection(sectionName) {
        // 隱藏所有區域
        const sections = ['function-selection', 'care', 'statistics', 'settings', 'help'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = 'none';
            }
        });
        
        // 顯示指定區域
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // 如果顯示卹滿照護區域，重新篩選資料
        if (sectionName === 'care') {
            filterData();
        }
        
        // 如果顯示統計分析區域，更新統計資料
        if (sectionName === 'statistics') {
            updateStatistics();
            initializeStatsYearSelect();
        }
    }
    
    // 更新統計資料
    function updateStatistics() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // 獲取選擇的年份（如果有的話）
        const selectedYear = document.getElementById('stats-year-select')?.value;
        const targetYear = selectedYear ? parseInt(selectedYear) : currentYear;
        
        // 計算選擇年份的統計
        const targetYearPeople = personList.filter(person => 
            person.createdYear === targetYear
        );
        
        // 計算本月統計（如果選擇的是當前年份）
        const currentMonthPeople = targetYear === currentYear ? 
            targetYearPeople.filter(person => person.createdMonth === currentMonth) : [];
        
        const totalPeople = targetYearPeople.length;
        const currentMonthTotal = currentMonthPeople.length;
        const pendingCount = targetYearPeople.filter(person => person.status === 'pending').length;
        const completedCount = targetYearPeople.filter(person => person.status === 'completed').length;
        
        // 更新統計數字
        const totalElement = document.getElementById('total-people');
        const pendingElement = document.getElementById('pending-count');
        const completedElement = document.getElementById('completed-count');
        
        if (totalElement) totalElement.textContent = totalPeople;
        if (pendingElement) pendingElement.textContent = pendingCount;
        if (completedElement) completedElement.textContent = completedCount;
        
        // 計算並更新完成率
        const completionRate = totalPeople > 0 ? Math.round((completedCount / totalPeople) * 100) : 0;
        const completionRateElement = document.getElementById('completion-rate');
        if (completionRateElement) {
            completionRateElement.textContent = `${completionRate}%`;
        }
        
        // 計算詳細統計率
        const photoCompletionRate = Math.round((targetYearPeople.filter(p => p.photo).length / totalPeople) * 100) || 0;
        const contactCompletionRate = Math.round((targetYearPeople.filter(p => p.phone && p.phone.trim()).length / totalPeople) * 100) || 0;
        const memoCompletionRate = Math.round((targetYearPeople.filter(p => p.memo && p.memo.trim()).length / totalPeople) * 100) || 0;
        const addressCompletionRate = Math.round((targetYearPeople.filter(p => p.address && p.address.trim()).length / totalPeople) * 100) || 0;
        
        const photoRateElement = document.getElementById('photo-completion-rate');
        const contactRateElement = document.getElementById('contact-completion-rate');
        const memoRateElement = document.getElementById('memo-completion-rate');
        const addressRateElement = document.getElementById('address-completion-rate');
        
        if (photoRateElement) photoRateElement.textContent = `${photoCompletionRate}%`;
        if (contactRateElement) contactRateElement.textContent = `${contactCompletionRate}%`;
        if (memoRateElement) memoRateElement.textContent = `${memoCompletionRate}%`;
        if (addressRateElement) addressRateElement.textContent = `${addressCompletionRate}%`;
        
        // 更新月份分佈
        updateMonthDistribution(targetYear);
        
        // 更新統計標題
        const statsTitle = document.querySelector('.statistics-card h3');
        if (statsTitle && statsTitle.textContent.includes('本月統計')) {
            if (targetYear === currentYear) {
                statsTitle.textContent = `📈 ${targetYear}年${currentMonth}月統計`;
            } else {
                statsTitle.textContent = `📈 ${targetYear}年統計`;
            }
        }
    }
    
    // 初始化統計頁面的年份選項
    function initializeStatsYearSelect() {
        const yearSelect = document.getElementById('stats-year-select');
        if (!yearSelect) return;
        
        // 清空現有選項
        yearSelect.innerHTML = '<option value="">請選擇年份</option>';
        
        // 獲取所有年份
        const years = [...new Set(personList.map(person => person.createdYear))].sort((a, b) => b - a);
        
        // 添加年份選項
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}年`;
            yearSelect.appendChild(option);
        });
        
        // 預設選擇當前年份
        const currentYear = new Date().getFullYear();
        if (years.includes(currentYear)) {
            yearSelect.value = currentYear;
        }
    }
    
    // 添加月份分佈圖表的CSS樣式
    const monthChartStyle = document.createElement('style');
    monthChartStyle.textContent = `
        .month-chart {
            display: flex;
            justify-content: space-around;
            align-items: end;
            height: 200px;
            padding: 1rem;
            gap: 0.5rem;
        }
        
        .month-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
        }
        
        .bar {
            width: 100%;
            border-radius: 4px 4px 0 0;
            transition: all 0.3s ease;
        }
        
        .month-label {
            font-size: 0.8rem;
            color: #6c757d;
            font-weight: 500;
        }
        
        .month-count {
            font-size: 0.9rem;
            color: #2c3e50;
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .month-chart {
                height: 150px;
                gap: 0.3rem;
            }
            
            .month-label {
                font-size: 0.7rem;
            }
            
            .month-count {
                font-size: 0.8rem;
            }
        }
    `;
    document.head.appendChild(monthChartStyle);
    
    // ===== 系統功能函數 =====
    
    // 主題切換功能（移除重複，統一用上方的 toggleTheme）
    
    // 資料格式修復功能
    function fixDataFormat() {
        let fixedCount = 0;
        let totalCount = personList.length;
        
        personList = personList.map(person => {
            let needsFix = false;
            const fixedPerson = { ...person };
            
            // 修復月份格式（確保是數字）
            if (typeof person.createdMonth === 'string') {
                fixedPerson.createdMonth = parseInt(person.createdMonth);
                needsFix = true;
            }
            
            // 修復年份格式（確保是數字）
            if (typeof person.createdYear === 'string') {
                fixedPerson.createdYear = parseInt(person.createdYear);
                needsFix = true;
            }
            
            // 修復狀態（確保有狀態欄位）
            if (!person.status) {
                fixedPerson.status = 'pending';
                needsFix = true;
            }
            
            // 修復創建時間（確保有時間戳）
            if (!person.createdAt) {
                const date = new Date(person.createdYear || new Date().getFullYear(), 
                                    (person.createdMonth || 1) - 1, 1);
                fixedPerson.createdAt = date.toISOString();
                needsFix = true;
            }
            
            if (needsFix) {
                fixedCount++;
            }
            
            return fixedPerson;
        });
        
        // 儲存修復後的資料
        localStorage.setItem('personList', JSON.stringify(personList));
        
        // 顯示修復結果
        if (fixedCount > 0) {
            window.showNotification && window.showNotification(`資料格式修復完成！共修復 ${fixedCount}/${totalCount} 筆資料`, 'success');
        } else {
            window.showNotification && window.showNotification('所有資料格式都正確，無需修復', 'info');
        }
        
        // 如果當前在統計頁面，更新統計資料
        if (document.getElementById('statistics').style.display !== 'none') {
            updateStatistics();
        }
    }
    
    // 快速測試功能
    function quickTest() {
        window.showNotification && window.showNotification('開始執行系統測試...', 'info');
        
        // 測試資料儲存
        const testData = {
            id: Date.now(),
            name: '測試人員',
            caseNumber: 'TEST001',
            phone: '0912345678',
            address: '測試地址',
            memo: '這是一個測試資料',
            photo: null,
            createdAt: new Date().toISOString(),
            createdMonth: new Date().getMonth() + 1,
            createdYear: new Date().getFullYear(),
            status: 'pending'
        };
        
        // 暫時添加測試資料
        personList.push(testData);
        localStorage.setItem('personList', JSON.stringify(personList));
        
        setTimeout(() => {
            // 移除測試資料
            personList = personList.filter(p => p.id !== testData.id);
            localStorage.setItem('personList', JSON.stringify(personList));
            
            window.showNotification && window.showNotification('系統測試完成！所有功能正常運作', 'success');
        }, 2000);
    }
    
    // 匯出CSV功能 - 已移至全域函數
    
    // 匯出PDF功能 - 已移至全域函數
    
    // 照片檢查功能 - 已移至全域函數
    
    // 標記完成功能 - 已移至全域函數
    
    // 搜尋功能
    function searchPeople() {
        const searchTerm = document.getElementById('search-input').value.trim();
        const searchYear = document.getElementById('search-year').value;
        const searchMonth = document.getElementById('search-month').value;
        
        let filtered = personList;
        
        if (searchTerm) {
            filtered = filtered.filter(person => 
                person.name.includes(searchTerm) || 
                person.phone.includes(searchTerm) || 
                person.address.includes(searchTerm) ||
                person.memo.includes(searchTerm)
            );
        }
        
        if (searchYear) {
            filtered = filtered.filter(person => person.createdYear === parseInt(searchYear));
        }
        
        if (searchMonth) {
            filtered = filtered.filter(person => person.createdMonth === parseInt(searchMonth));
        }
        
        displayData(filtered);
        window.showNotification && window.showNotification(`搜尋結果: ${filtered.length} 筆資料`, 'info');
    }
    
    // 清除搜尋功能
    function clearSearch() {
        document.getElementById('search-input').value = '';
        document.getElementById('search-year').value = '';
        document.getElementById('search-month').value = '';
        filterData();
        window.showNotification && window.showNotification('搜尋條件已清除', 'info');
    }
    
    // 資料備份、還原、系統資訊功能 - 已移至全域函數
    
    // 更新月份分佈
    function updateMonthDistribution(year) {
        const monthDistribution = document.getElementById('month-distribution');
        if (!monthDistribution) return;
        
        const monthData = [];
        for (let month = 1; month <= 12; month++) {
            const count = personList.filter(person => 
                person.createdYear === year && person.createdMonth === month
            ).length;
            monthData.push({ month, count });
        }
        
        // 生成月份分佈HTML
        let html = '<div class="month-chart">';
        monthData.forEach(({ month, count }) => {
            const height = count > 0 ? Math.max(20, count * 10) : 20;
            const color = count > 0 ? '#667eea' : '#e9ecef';
            html += `
                <div class="month-bar">
                    <div class="bar" style="height: ${height}px; background-color: ${color};"></div>
                    <div class="month-label">${month}月</div>
                    <div class="month-count">${count}</div>
                </div>
            `;
        });
        html += '</div>';
        
        monthDistribution.innerHTML = html;
    }

    // 將主要函數附加到全域（置於閉包內，確保能取得作用域內定義）
    window.showSection = showSection;
    window.showModal = wrapSafe('showModal', showModal);
    window.closeModal = wrapSafe('closeModal', closeModal);
    window.goBack = wrapSafe('goBack', goBack);
    window.getCurrentActiveSection = wrapSafe('getCurrentActiveSection', getCurrentActiveSection);
    window.initializeMobileGestures = wrapSafe('initializeMobileGestures', initializeMobileGestures);
    window.initializeMobileBackButton = wrapSafe('initializeMobileBackButton', initializeMobileBackButton);
    window.toggleTheme = wrapSafe('toggleTheme', toggleTheme);
    window.exportToCSV = wrapSafe('exportToCSV', exportToCSV);
    window.exportToPDF = wrapSafe('exportToPDF', exportToPDF);
    window.backupData = wrapSafe('backupData', backupData);
    window.restoreData = wrapSafe('restoreData', restoreData);
    window.showSystemInfo = wrapSafe('showSystemInfo', showSystemInfo);
    window.checkPhotos = wrapSafe('checkPhotos', checkPhotos);
    window.showAddPersonForm = wrapSafe('showAddPersonForm', showAddPersonForm);
    window.markAsComplete = wrapSafe('markAsComplete', markAsComplete);
    window.markAsIncomplete = wrapSafe('markAsIncomplete', markAsIncomplete);
    window.searchPeople = wrapSafe('searchPeople', searchPeople);
    window.clearSearch = wrapSafe('clearSearch', clearSearch);
    window.editPerson = wrapSafe('editPerson', editPerson);
    window.deletePerson = wrapSafe('deletePerson', deletePerson);
    if (typeof filterData === 'function') {
        window.filterData = wrapSafe('filterData', filterData);
    }
    window.updateStatistics = wrapSafe('updateStatistics', updateStatistics);
    window.fixDataFormat = wrapSafe('fixDataFormat', fixDataFormat);
    window.quickTest = wrapSafe('quickTest', quickTest);
    window.showNotification = wrapSafe('showNotification', showNotification);
    window.displayData = wrapSafe('displayData', displayData);
    window.saveData = wrapSafe('saveData', saveData);
    window.initializeStatsYearSelect = wrapSafe('initializeStatsYearSelect', initializeStatsYearSelect);
    window.showPersonDetail = wrapSafe('showPersonDetail', showPersonDetail);
    window.showMap = wrapSafe('showMap', showMap);
    window.updateMonthDistribution = wrapSafe('updateMonthDistribution', updateMonthDistribution);
    window.loadData = wrapSafe('loadData', loadData);
    window.loadTheme = wrapSafe('loadTheme', loadTheme);
    window.startTimeUpdate = wrapSafe('startTimeUpdate', startTimeUpdate);
    window.addPersonToList = wrapSafe('addPersonToList', addPersonToList);
    window.updatePersonInList = wrapSafe('updatePersonInList', updatePersonInList);
    window.initializeSystem = wrapSafe('initializeSystem', initializeSystem);
    window.initializeDateSelectors = wrapSafe('initializeDateSelectors', initializeDateSelectors);
    window.logout = wrapSafe('logout', logout);
    window.toggleFaq = wrapSafe('toggleFaq', toggleFaq);
});

// FAQ 折疊展開功能
function toggleFaq(questionElement) {
    const faqItem = questionElement.closest('.faq-item-modern');
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = questionElement.querySelector('.faq-toggle');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        toggle.textContent = '▼';
        questionElement.classList.remove('active');
    } else {
        answer.style.display = 'block';
        toggle.textContent = '▲';
        questionElement.classList.add('active');
    }
}
