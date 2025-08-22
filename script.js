// 等待DOM載入完成
document.addEventListener('DOMContentLoaded', function() {
    
    // 全域變數
    let currentUser = null;
    let staffList = JSON.parse(localStorage.getItem('staffList')) || [];
    let careRecords = JSON.parse(localStorage.getItem('careRecords')) || [];
    
    // 獲取頁面元素
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const mainSection = document.getElementById('main-section');
    const logoutBtn = document.getElementById('logout-btn');
    const addStaffForm = document.getElementById('add-staff-form');
    const addStaffModal = document.getElementById('add-staff-modal');
    const staffPhotoInput = document.getElementById('staff-photo');
    const photoPreview = document.getElementById('photo-preview');
    
    // 初始化年份和月份選單
    initializeDateSelectors();
    
    // 登入表單處理
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 簡單的登入驗證（實際應用中應該使用更安全的驗證方式）
        if (username === 'admin' && password === '123456') {
            currentUser = { username: username };
            loginSection.style.display = 'none';
            mainSection.style.display = 'block';
            showNotification('登入成功！歡迎使用照護管理系統', 'success');
            loadDashboard();
        } else {
            showNotification('帳號或密碼錯誤，請重新輸入', 'error');
        }
    });
    
    // 登出功能
    logoutBtn.addEventListener('click', function() {
        currentUser = null;
        mainSection.style.display = 'none';
        loginSection.style.display = 'flex';
        loginForm.reset();
        showNotification('已成功登出', 'info');
    });
    
    // 新增人員表單處理
    addStaffForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const staffData = {
            id: Date.now(),
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            memo: formData.get('memo'),
            photo: null,
            createdAt: new Date().toISOString()
        };
        
        // 處理照片上傳
        const photoFile = formData.get('photo');
        if (photoFile && photoFile.size > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                staffData.photo = e.target.result;
                addStaffToList(staffData);
            };
            reader.readAsDataURL(photoFile);
        } else {
            addStaffToList(staffData);
        }
    });
    
    // 照片預覽功能
    staffPhotoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="照片預覽">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 全域函數
    window.showSection = function(sectionId) {
        // 隱藏所有區段
        document.querySelectorAll('main > section').forEach(section => {
            section.style.display = 'none';
        });
        
        // 顯示指定區段
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // 載入對應資料
        if (sectionId === 'staff') {
            loadStaffList();
        } else if (sectionId === 'care') {
            loadCareRecords();
        }
    };
    
    window.showAddStaffForm = function() {
        addStaffModal.style.display = 'flex';
        addStaffForm.reset();
        photoPreview.innerHTML = '';
    };
    
    window.closeModal = function() {
        addStaffModal.style.display = 'none';
    };
    
    window.filterRecords = function() {
        const year = document.getElementById('year-select').value;
        const month = document.getElementById('month-select').value;
        
        let filteredRecords = careRecords;
        
        if (year) {
            filteredRecords = filteredRecords.filter(record => {
                const recordYear = new Date(record.date).getFullYear().toString();
                return recordYear === year;
            });
        }
        
        if (month) {
            filteredRecords = filteredRecords.filter(record => {
                const recordMonth = (new Date(record.date).getMonth() + 1).toString().padStart(2, '0');
                return recordMonth === month;
            });
        }
        
        displayCareRecords(filteredRecords);
    };
    
    // 輔助函數
    function initializeDateSelectors() {
        const yearSelect = document.getElementById('year-select');
        const monthSelect = document.getElementById('month-select');
        
        // 初始化年份選單（前5年到後5年）
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = `${year}年`;
            yearSelect.appendChild(option);
        }
        
        // 初始化月份選單
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement('option');
            option.value = month.toString().padStart(2, '0');
            option.textContent = `${month}月`;
            monthSelect.appendChild(option);
        }
    }
    
    function addStaffToList(staffData) {
        staffList.push(staffData);
        localStorage.setItem('staffList', JSON.stringify(staffList));
        
        addStaffForm.reset();
        photoPreview.innerHTML = '';
        closeModal();
        
        showNotification('人員新增成功！', 'success');
        loadStaffList();
    }
    
    function loadDashboard() {
        showSection('dashboard');
    }
    
    function loadStaffList() {
        const staffListContainer = document.getElementById('staff-list');
        staffListContainer.innerHTML = '';
        
        if (staffList.length === 0) {
            staffListContainer.innerHTML = '<p style="text-align: center; color: #666;">尚無人員資料</p>';
            return;
        }
        
        staffList.forEach(staff => {
            const staffCard = document.createElement('div');
            staffCard.className = 'staff-card';
            staffCard.innerHTML = `
                ${staff.photo ? `<img src="${staff.photo}" alt="${staff.name}" class="staff-photo">` : '<div class="staff-photo" style="background: #ddd; display: flex; align-items: center; justify-content: center; color: #666;">無照片</div>'}
                <div class="staff-info">
                    <h4>${staff.name}</h4>
                    <p><strong>電話：</strong>${staff.phone}</p>
                    <p><strong>地址：</strong>${staff.address}</p>
                    ${staff.memo ? `<p><strong>備忘：</strong>${staff.memo}</p>` : ''}
                </div>
            `;
            staffListContainer.appendChild(staffCard);
        });
    }
    
    function loadCareRecords() {
        // 這裡可以載入照護記錄，目前使用模擬資料
        if (careRecords.length === 0) {
            // 添加一些模擬資料
            careRecords = [
                {
                    id: 1,
                    date: '2024-01-15',
                    staffName: '張護理師',
                    patientName: '王奶奶',
                    careType: '日常照護',
                    notes: '血壓正常，精神良好'
                },
                {
                    id: 2,
                    date: '2024-01-16',
                    staffName: '李護理師',
                    patientName: '陳爺爺',
                    careType: '藥物管理',
                    notes: '按時服藥，無異常'
                }
            ];
            localStorage.setItem('careRecords', JSON.stringify(careRecords));
        }
        
        displayCareRecords(careRecords);
    }
    
    function displayCareRecords(records) {
        const recordsList = document.getElementById('records-list');
        recordsList.innerHTML = '';
        
        if (records.length === 0) {
            recordsList.innerHTML = '<p style="text-align: center; color: #666;">該期間無照護記錄</p>';
            return;
        }
        
        records.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.style.cssText = `
                background: #f8f9fa;
                padding: 1rem;
                margin-bottom: 1rem;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            `;
            recordItem.innerHTML = `
                <h4>${record.patientName} - ${record.careType}</h4>
                <p><strong>日期：</strong>${new Date(record.date).toLocaleDateString('zh-TW')}</p>
                <p><strong>照護人員：</strong>${record.staffName}</p>
                <p><strong>備註：</strong>${record.notes}</p>
            `;
            recordsList.appendChild(recordItem);
        });
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
    addStaffModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
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
    console.log('%c歡迎使用照護管理系統！', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c這是一個使用HTML、CSS和JavaScript構建的現代化照護管理系統', 'color: #666; font-size: 14px;');
});
