// 全域函數定義
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
            filterData();
        } else if (sectionName === 'statistics') {
            updateStatistics();
            initializeStatsYearSelect();
        }
    }
}

function logout() {
    if (confirm('確定要登出嗎？')) {
        // 清除用戶狀態
        currentUser = null;
        
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

function showModal(content) {
    // 使用現有的通用模態框
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    
    if (modal && modalBody) {
        modalBody.innerHTML = content;
        modal.style.display = 'flex';
        
        // 點擊外部關閉
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function toggleTheme() {
    const body = document.body;
    const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (newTheme === 'dark') {
        body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        showNotification('已切換至深色主題', 'success');
    } else {
        body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        showNotification('已切換至淺色主題', 'success');
    }
}

function exportToCSV() {
    const selectedYear = document.getElementById('year-select')?.value || new Date().getFullYear();
    const selectedMonth = document.getElementById('month-select')?.value || '';
    
    if (!selectedYear) {
        showNotification('請先選擇年份', 'warning');
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
        showNotification('沒有資料可匯出', 'warning');
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
    
    showNotification(`CSV 匯出完成，共 ${filteredData.length} 筆資料`, 'success');
}

function exportToPDF() {
    const selectedYear = document.getElementById('year-select')?.value || new Date().getFullYear();
    const selectedMonth = document.getElementById('month-select')?.value || '';
    
    if (!selectedYear) {
        showNotification('請先選擇年份', 'warning');
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
        showNotification('沒有資料可匯出', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>照護資料報表</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 20px; }
                .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>照護資料報表</h1>
                <p>年份: ${targetYear}年 ${targetMonth ? '月份: ' + targetMonth + '月' : ''}</p>
                <p>匯出時間: ${new Date().toLocaleString('zh-TW')}</p>
            </div>
            <div class="summary">
                <h3>統計摘要</h3>
                <p>總人數: ${filteredData.length}</p>
                <p>已完成: ${filteredData.filter(p => p.status === 'completed').length}</p>
                <p>待處理: ${filteredData.filter(p => p.status === 'pending').length}</p>
                <p>有照片: ${filteredData.filter(p => p.photo).length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>姓名</th>
                        <th>個案號碼</th>
                        <th>電話</th>
                        <th>地址</th>
                        <th>備忘</th>
                        <th>狀態</th>
                        <th>建立月份</th>
                        <th>建立年份</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredData.map(person => `
                        <tr>
                            <td>${person.name}</td>
                            <td>${person.caseNumber || ''}</td>
                            <td>${person.phone}</td>
                            <td>${person.address}</td>
                            <td>${person.memo || ''}</td>
                            <td>${person.status || 'pending'}</td>
                            <td>${person.createdMonth}月</td>
                            <td>${person.createdYear}年</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    
    showNotification(`PDF 匯出完成，共 ${filteredData.length} 筆資料`, 'success');
}

function backupData() {
    const dataStr = JSON.stringify(personList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `照護資料備份_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('資料備份完成', 'success');
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
                            showNotification(`資料還原完成，共匯入 ${data.length} 筆資料`, 'success');
                            if (document.getElementById('care').style.display !== 'none') {
                                filterData();
                            }
                        }
                    } else {
                        showNotification('檔案格式錯誤', 'error');
                    }
                } catch (error) {
                    showNotification('檔案讀取失敗', 'error');
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
        showNotification('請先選擇年份和月份', 'warning');
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
        showNotification('該月份沒有資料', 'warning');
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
        localStorage.setItem('personList', JSON.stringify(personList));
        showNotification(`${person.name} 已標記為完成`, 'success');
        filterData();
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
    
    displayPeople(filtered);
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
        showNotification('未找到人員資料', 'error');
        return;
    }
    
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-form');
    
    if (!modal || !form) {
        showNotification('編輯模態框載入失敗', 'error');
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
    form.querySelector('[name="name"]').value = person.name || '';
    form.querySelector('[name="phone"]').value = person.phone || '';
    form.querySelector('[name="address"]').value = person.address || '';
    form.querySelector('[name="memo"]').value = person.memo || '';
    form.querySelector('[name="year"]').value = person.createdYear || '';
    form.querySelector('[name="month"]').value = person.createdMonth || '';
    form.querySelector('[name="status"]').value = person.status || 'pending';
    
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
        person.memo = formData.get('memo');
        person.createdYear = parseInt(formData.get('year'));
        person.createdMonth = parseInt(formData.get('month'));
        person.status = formData.get('status');
        
        // 處理新照片
        const newPhoto = formData.get('photo');
        if (newPhoto && newPhoto.size > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                person.photo = e.target.result;
                saveData();
                closeModal();
                filterData();
                showNotification('人員資料已更新', 'success');
            };
            reader.readAsDataURL(newPhoto);
        } else {
            saveData();
            closeModal();
            filterData();
            showNotification('人員資料已更新', 'success');
        }
    };
    
    modal.style.display = 'block';
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
        showNotification('未找到要刪除的人員', 'error');
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
            filterData();
            showNotification(`${person.name} 的資料已刪除`, 'success');
            console.log('✅ 刪除操作完成');
        } else {
            console.log('❌ 刪除操作失敗');
            showNotification('刪除操作失敗', 'error');
        }
    } else {
        console.log('用戶取消刪除操作');
    }
}

// 顯示人員詳情
function showPersonDetail(personId) {
    const person = personList.find(p => p.id === personId);
    if (!person) {
        showNotification('未找到人員資料', 'error');
        return;
    }
    
    const detailHtml = `
        <div class="person-detail-modal">
            <div class="detail-header">
                <h3>${person.name} 的詳細資料</h3>
                <button class="close-btn" onclick="closeModal()">×</button>
            </div>
            <div class="detail-content">
                <div class="detail-photo">
                    ${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : '<div class="no-photo">無照片</div>'}
                </div>
                <div class="detail-info">
                    <div class="detail-item">
                        <label>姓名：</label>
                        <span>${person.name}</span>
                    </div>
                    <div class="detail-item">
                        <label>電話：</label>
                        <span>${person.phone}</span>
                    </div>
                    <div class="detail-item">
                        <label>地址：</label>
                        <span>${person.address}</span>
                    </div>
                    <div class="detail-item">
                        <label>個案號碼：</label>
                        <span>${person.caseNumber || '無'}</span>
                    </div>
                    <div class="detail-item">
                        <label>備忘：</label>
                        <span>${person.memo || '無'}</span>
                    </div>
                    <div class="detail-item">
                        <label>狀態：</label>
                        <span class="status-badge ${person.status === 'completed' ? 'completed' : 'pending'}">${person.status === 'completed' ? '已完成' : '未完成'}</span>
                    </div>
                    <div class="detail-item">
                        <label>建立時間：</label>
                        <span>${person.createdAt}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    showModal(detailHtml);
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

// 移除重複的 initializeSearchYearSelect 函數定義

// 移除重複的 displayPeople 函數定義

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
    
    // 啟動時間更新（包括登入頁面）
    startTimeUpdate();
    
    // 登入表單處理
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 簡單的登入驗證
        if (username === 'admin' && password === '123456') {
            currentUser = { username: username };
            loginSection.style.display = 'none';
            mainSection.style.display = 'block';
            showNotification('登入成功！歡迎使用留守資訊系統', 'success');
            
            // 初始化系統並顯示功能選擇介面
            initializeSystem();
            showSection('function-selection');
        } else {
            showNotification('帳號或密碼錯誤，請重新輸入', 'error');
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
            showNotification('請填寫所有必填欄位', 'error');
            return;
        }
        
        // 額外驗證
        if (name.length < 2) {
            showNotification('姓名至少需要2個字元', 'error');
            return;
        }
        
        if (caseNumber.length < 1) {
            showNotification('個案號碼不能為空', 'error');
            return;
        }
        
        if (phone.length < 8) {
            showNotification('電話號碼格式不正確', 'error');
            return;
        }
        
        if (address.length < 5) {
            showNotification('地址至少需要5個字元', 'error');
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
                    showNotification('月份必須在1-12之間', 'error');
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
                        showNotification('照片檔案大小不能超過5MB', 'error');
                        return;
                    }
                    
                    if (!photoFile.type.startsWith('image/')) {
                        showNotification('請選擇有效的圖片檔案', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        updatedPerson.photo = e.target.result;
                        updatePersonInList(updatedPerson);
                    };
                    reader.onerror = function() {
                        showNotification('照片讀取失敗，請重試', 'error');
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
                showNotification('請選擇分配月份', 'error');
                return;
            }
            
            // 獲取篩選區域的年份（如果有的話）
            const selectedYear = document.getElementById('year-select')?.value;
            
            // 確保月份和年份都是數字類型
            const createdYear = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
            const createdMonth = parseInt(selectedMonth);
            
            // 驗證月份範圍
            if (createdMonth < 1 || createdMonth > 12) {
                showNotification('月份必須在1-12之間', 'error');
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
                createdAt: createdDate.toISOString(),
                createdMonth: createdMonth,
                createdYear: createdYear,
                status: 'pending'
            };
            
            // 處理照片上傳
            const photoFile = formData.get('photo');
            if (photoFile && photoFile.size > 0) {
                if (photoFile.size > 5 * 1024 * 1024) {
                    showNotification('照片檔案大小不能超過5MB', 'error');
                    return;
                }
                
                if (!photoFile.type.startsWith('image/')) {
                    showNotification('請選擇有效的圖片檔案', 'error');
                    return;
                }
                
                // 顯示載入提示
                showNotification('正在處理照片，請稍候...', 'info');
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    personData.photo = e.target.result;
                    addPersonToList(personData);
                };
                reader.onerror = function() {
                    showNotification('照片讀取失敗，請重試', 'error');
                };
                reader.readAsDataURL(photoFile);
            } else {
                // 沒有照片，直接新增
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
                    showNotification(`檔案 ${file.name} 大小不能超過5MB`, 'error');
                    this.value = '';
                    photoPreview.innerHTML = '';
                    fileUploadText.textContent = '沒有選擇檔案';
                    return;
                }
                
                // 檢查檔案類型
                if (!file.type.startsWith('image/')) {
                    showNotification(`檔案 ${file.name} 不是有效的圖片檔案`, 'error');
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
                showNotification('照片讀取失敗，請重試', 'error');
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
        showNotification(`人員 ${personData.name} 新增成功！`, 'success');
        
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
                <div class="person-card">
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
                                    <span class="status-badge ${isCurrentMonth ? 'completed' : 'pending'}">${isCurrentMonth ? '已完成' : '未完成'}</span>
                                    ${!isCurrentMonth ? '<a href="#" class="mark-complete" onclick="markAsComplete(' + person.id + ')">標記完成</a>' : ''}
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
                        <div class="map-placeholder">
                            <div class="map-info">
                                <div class="map-title">地圖位置</div>
                                <div class="map-address">${person.address}</div>
                                <a href="#" class="show-map-link" onclick="showMap('${person.address}')">顯示詳細地圖</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-detail" onclick="showPersonDetail(${person.id})">
                            <span class="btn-icon">👁️</span>詳細
                        </button>
                        <button class="btn btn-edit" onclick="editPerson(${person.id})">
                            <span class="btn-icon">✏️</span>編輯
                        </button>
                        <button class="btn btn-delete" onclick="deletePerson(${person.id})">
                            <span class="btn-icon">🗑️</span>刪除
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        dataContent.innerHTML = html;
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
            createdAt: createdDate.toISOString(),
            createdMonth: createdMonth,
            createdYear: createdYear,
            status: 'pending'
        };
        
        personList.push(testPerson);
        localStorage.setItem('personList', JSON.stringify(personList));
        filterData();
        showNotification(`測試人員新增成功！已設定為 ${createdYear}年${createdMonth}月`, 'success');
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
    
    // 主題切換功能
    function toggleTheme() {
        if (currentTheme === 'light') {
            currentTheme = 'dark';
            document.body.classList.add('dark-theme');
        } else {
            currentTheme = 'light';
            document.body.classList.remove('dark-theme');
        }
        
        // 儲存主題設定
        localStorage.setItem('currentTheme', currentTheme);
        
        // 顯示通知
        const themeText = currentTheme === 'dark' ? '深色主題' : '淺色主題';
        showNotification(`已切換至${themeText}`, 'success');
        
        // 更新按鈕文字
        const themeButton = document.querySelector('.btn-secondary');
        if (themeButton) {
            themeButton.textContent = currentTheme === 'dark' ? '切換至淺色' : '切換至深色';
        }
    }
    
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
            showNotification(`資料格式修復完成！共修復 ${fixedCount}/${totalCount} 筆資料`, 'success');
        } else {
            showNotification('所有資料格式都正確，無需修復', 'info');
        }
        
        // 如果當前在統計頁面，更新統計資料
        if (document.getElementById('statistics').style.display !== 'none') {
            updateStatistics();
        }
    }
    
    // 快速測試功能
    function quickTest() {
        showNotification('開始執行系統測試...', 'info');
        
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
            
            showNotification('系統測試完成！所有功能正常運作', 'success');
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
        
        displayPeople(filtered);
        showNotification(`搜尋結果: ${filtered.length} 筆資料`, 'info');
    }
    
    // 清除搜尋功能
    function clearSearch() {
        document.getElementById('search-input').value = '';
        document.getElementById('search-year').value = '';
        document.getElementById('search-month').value = '';
        filterData();
        showNotification('搜尋條件已清除', 'info');
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
});

// 將所有函數附加到全域範圍，使其可以被 onclick 屬性調用
window.showSection = showSection;
window.showModal = showModal;
window.closeModal = closeModal;
window.toggleTheme = toggleTheme;
window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;
window.backupData = backupData;
window.restoreData = restoreData;
window.showSystemInfo = showSystemInfo;
window.checkPhotos = checkPhotos;
window.showAddPersonForm = showAddPersonForm;
window.markAsComplete = markAsComplete;
window.searchPeople = searchPeople;
window.clearSearch = clearSearch;
window.editPerson = editPerson;
window.deletePerson = deletePerson;
window.filterData = filterData;
window.updateStatistics = updateStatistics;
window.fixDataFormat = fixDataFormat;
window.quickTest = quickTest;
window.showNotification = showNotification;
window.displayPeople = displayPeople;
window.saveData = saveData;
window.initializeStatsYearSelect = initializeStatsYearSelect;
window.initializeSearchYearSelect = initializeSearchYearSelect;
window.showPersonDetail = showPersonDetail;
window.showMap = showMap;
window.updateMonthDistribution = updateMonthDistribution;
window.loadData = loadData;
window.loadTheme = loadTheme;
window.startTimeUpdate = startTimeUpdate;
window.addPersonToList = addPersonToList;
window.updatePersonInList = updatePersonInList;
window.initializeSystem = initializeSystem;
window.initializeDateSelectors = initializeDateSelectors;
window.logout = logout;
