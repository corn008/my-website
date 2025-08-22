// 等待DOM載入完成
document.addEventListener('DOMContentLoaded', function() {
    
    // 全域變數
    let currentUser = null;
    let personList = JSON.parse(localStorage.getItem('personList')) || [];
    let currentTheme = localStorage.getItem('currentTheme') || 'light';
    let timeInterval = null;
    
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
            startTimeUpdate();
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
                
                // 簡化邏輯：使用篩選條件中的年份，如果沒有則保持原來的年份
                const updatedYear = selectedYear ? parseInt(selectedYear) : personList[personIndex].createdYear;
                const updatedMonth = parseInt(selectedMonth);
                
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
            
            // 簡化邏輯：直接使用表單選擇的月份和篩選條件中的年份
            const createdYear = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
            const createdMonth = parseInt(selectedMonth);
            
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
    
    window.closeModal = function() {
        addPersonModal.style.display = 'none';
    };
    
    window.exportCSV = function() {
        if (personList.length === 0) {
            showNotification('目前沒有資料可匯出', 'error');
            return;
        }
        
        // 獲取當前篩選的資料
        const year = document.getElementById('year-select')?.value;
        const month = document.getElementById('month-select')?.value;
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
        
        let exportData = personList;
        
        // 應用相同的篩選邏輯
        if (searchTerm) {
            exportData = exportData.filter(person => 
                person.name.toLowerCase().includes(searchTerm) ||
                person.caseNumber.toLowerCase().includes(searchTerm) ||
                person.phone.includes(searchTerm) ||
                person.address.toLowerCase().includes(searchTerm)
            );
        }
        
        if (year) {
            exportData = exportData.filter(person => {
                const personYear = new Date(person.createdAt).getFullYear();
                return personYear.toString() === year;
            });
        }
        
        if (month) {
            exportData = exportData.filter(person => {
                const personMonth = person.createdMonth || new Date(person.createdAt).getMonth() + 1;
                return personMonth.toString() === month;
            });
        }
        
        // 創建CSV內容
        const headers = ['姓名', '個案號碼', '電話', '地址', '備忘', '創建日期', '狀態'];
        const csvContent = [
            headers.join(','),
            ...exportData.map(person => [
                `"${person.name}"`,
                `"${person.caseNumber}"`,
                `"${person.phone}"`,
                `"${person.address}"`,
                `"${person.memo || ''}"`,
                `"${new Date(person.createdAt).toLocaleDateString('zh-TW')}"`,
                `"${person.status === 'completed' ? '已完成' : '未完成'}"`
            ].join(','))
        ].join('\n');
        
        // 下載CSV檔案
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `留守人員資料_${year || '全部'}_${month || '全部'}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`已成功匯出 ${exportData.length} 筆資料`, 'success');
    };
    
    window.exportPDF = function() {
        if (personList.length === 0) {
            showNotification('目前沒有資料可匯出', 'error');
            return;
        }
        
        // 獲取當前篩選的資料
        const year = document.getElementById('year-select')?.value;
        const month = document.getElementById('month-select')?.value;
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
        
        let exportData = personList;
        
        // 應用相同的篩選邏輯
        if (searchTerm) {
            exportData = exportData.filter(person => 
                person.name.toLowerCase().includes(searchTerm) ||
                person.caseNumber.toLowerCase().includes(searchTerm) ||
                person.phone.includes(searchTerm) ||
                person.address.toLowerCase().includes(searchTerm)
            );
        }
        
        if (year) {
            exportData = exportData.filter(person => {
                const personYear = new Date(person.createdAt).getFullYear();
                return personYear.toString() === year;
            });
        }
        
        if (month) {
            exportData = exportData.filter(person => {
                const personMonth = person.createdMonth || new Date(person.createdAt).getMonth() + 1;
                return personMonth.toString() === month;
            });
        }
        
        // 創建PDF內容
        const printWindow = window.open('', '_blank');
        const currentDate = new Date().toLocaleDateString('zh-TW');
        const filterInfo = `篩選條件: ${year ? year + '年' : '全部年份'} ${month ? month + '月' : '全部月份'} ${searchTerm ? '搜尋: ' + searchTerm : ''}`;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>留守人員資料</title>
                <style>
                    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .subtitle { font-size: 16px; color: #666; margin-bottom: 10px; }
                    .filter-info { font-size: 14px; color: #888; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .status-completed { color: #28a745; font-weight: bold; }
                    .status-pending { color: #6c757d; font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">留守資訊系統 - 人員資料報表</div>
                    <div class="subtitle">匯出時間: ${currentDate}</div>
                    <div class="filter-info">${filterInfo}</div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>個案號碼</th>
                            <th>電話</th>
                            <th>地址</th>
                            <th>備忘</th>
                            <th>創建日期</th>
                            <th>狀態</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${exportData.map(person => `
                            <tr>
                                <td>${person.name}</td>
                                <td>${person.caseNumber}</td>
                                <td>${person.phone}</td>
                                <td>${person.address}</td>
                                <td>${person.memo || '-'}</td>
                                <td>${new Date(person.createdAt).toLocaleDateString('zh-TW')}</td>
                                <td class="status-${person.status}">${person.status === 'completed' ? '已完成' : '未完成'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    共 ${exportData.length} 筆資料 | 留守資訊系統
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // 延遲一下再列印，確保內容載入完成
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
        
        showNotification(`已準備列印 ${exportData.length} 筆資料`, 'success');
    };
    
    window.checkPhotos = function() {
        if (personList.length === 0) {
            showNotification('目前沒有資料可檢查', 'error');
            return;
        }
        
        const withPhotos = personList.filter(p => p.photo);
        const withoutPhotos = personList.filter(p => !p.photo);
        
        // 創建詳細的檢查報告
        const reportWindow = window.open('', '_blank', 'width=600,height=500');
        const currentDate = new Date().toLocaleDateString('zh-TW');
        
        reportWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>照片檢查報告</title>
                <style>
                    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; background: #f8f9fa; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
                    .title { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 10px; }
                    .subtitle { font-size: 16px; color: #666; }
                    .stats { display: flex; justify-content: space-around; margin: 30px 0; }
                    .stat-item { text-align: center; padding: 20px; border-radius: 10px; }
                    .stat-total { background: #e3f2fd; color: #1976d2; }
                    .stat-with-photo { background: #e8f5e8; color: #388e3c; }
                    .stat-without-photo { background: #fff3e0; color: #f57c00; }
                    .stat-number { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
                    .stat-label { font-size: 14px; }
                    .section { margin: 30px 0; }
                    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-left: 4px solid #667eea; padding-left: 15px; }
                    .person-list { list-style: none; padding: 0; }
                    .person-item { padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; }
                    .person-name { font-weight: bold; color: #333; }
                    .person-details { color: #666; font-size: 14px; margin-top: 5px; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
                    .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin: 10px; }
                    .btn:hover { background: #5a6fd8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="title">📸 照片檢查報告</div>
                        <div class="subtitle">檢查時間: ${currentDate}</div>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-item stat-total">
                            <div class="stat-number">${personList.length}</div>
                            <div class="stat-label">總人數</div>
                        </div>
                        <div class="stat-item stat-with-photo">
                            <div class="stat-number">${withPhotos.length}</div>
                            <div class="stat-label">有照片</div>
                        </div>
                        <div class="stat-item stat-without-photo">
                            <div class="stat-number">${withoutPhotos.length}</div>
                            <div class="stat-label">無照片</div>
                        </div>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">📷 有照片的人員 (${withPhotos.length}人)</div>
                        <ul class="person-list">
                            ${withPhotos.length > 0 ? withPhotos.map(person => `
                                <li class="person-item">
                                    <div class="person-name">${person.name}</div>
                                    <div class="person-details">個案號碼: ${person.caseNumber} | 電話: ${person.phone}</div>
                                </li>
                            `).join('') : '<li class="person-item">無</li>'}
                        </ul>
                    </div>
                    
                    <div class="section">
                        <div class="section-title">❌ 無照片的人員 (${withoutPhotos.length}人)</div>
                        <ul class="person-list">
                            ${withoutPhotos.length > 0 ? withoutPhotos.map(person => `
                                <li class="person-item">
                                    <div class="person-name">${person.name}</div>
                                    <div class="person-details">個案號碼: ${person.caseNumber} | 電話: ${person.phone}</div>
                                </li>
                            `).join('') : '<li class="person-item">無</li>'}
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <button class="btn" onclick="window.print()">列印報告</button>
                        <button class="btn" onclick="window.close()">關閉視窗</button>
                        <br><br>
                        留守資訊系統 | 照片檢查報告
                    </div>
                </div>
            </body>
            </html>
        `);
        
        reportWindow.document.close();
        
        showNotification(`照片檢查完成！${withPhotos.length}人有照片，${withoutPhotos.length}人無照片`, 'success');
    };
    
    window.toggleTheme = function() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.body.classList.toggle('dark-theme', currentTheme === 'dark');
        
        // 儲存主題設定到localStorage
        localStorage.setItem('currentTheme', currentTheme);
        
        // 更新按鈕文字
        const themeBtn = document.querySelector('.header-btn[onclick="toggleTheme()"]');
        if (themeBtn) {
            themeBtn.textContent = currentTheme === 'dark' ? '淺色主題' : '深色主題';
        }
        
        showNotification(`已切換到${currentTheme === 'dark' ? '深色' : '淺色'}主題`, 'info');
    };
    
    window.logout = function() {
        currentUser = null;
        mainSection.style.display = 'none';
        loginSection.style.display = 'flex';
        loginForm.reset();
        stopTimeUpdate();
        showNotification('已成功登出', 'info');
    };
    
    window.markComplete = function(personId) {
        const person = personList.find(p => p.id === personId);
        if (person) {
            person.status = 'completed';
            localStorage.setItem('personList', JSON.stringify(personList));
            filterData();
            showNotification('已標記為完成', 'success');
        }
    };
    
    window.showPersonDetail = function(personId) {
        const person = personList.find(p => p.id === personId);
        if (person) {
            // 創建詳細資料視窗
            const detailWindow = window.open('', '_blank', 'width=700,height=600');
            const currentDate = new Date().toLocaleDateString('zh-TW');
            const createdDate = new Date(person.createdAt).toLocaleDateString('zh-TW');
            
            detailWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${person.name} - 詳細資料</title>
                    <style>
                        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; background: #f8f9fa; }
                        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #667eea; padding-bottom: 20px; }
                        .title { font-size: 28px; font-weight: bold; color: #333; margin-bottom: 10px; }
                        .subtitle { font-size: 16px; color: #666; }
                        .photo-section { text-align: center; margin: 30px 0; }
                        .photo { width: 200px; height: 200px; border-radius: 50%; object-fit: cover; border: 5px solid #667eea; }
                        .no-photo { width: 200px; height: 200px; border-radius: 50%; background: #ddd; display: flex; align-items: center; justify-content: center; color: #666; font-size: 16px; margin: 0 auto; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
                        .info-item { background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea; }
                        .info-label { font-weight: bold; color: #333; margin-bottom: 10px; font-size: 16px; }
                        .info-value { color: #666; font-size: 14px; }
                        .memo-section { background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 30px 0; }
                        .memo-title { font-weight: bold; color: #1976d2; margin-bottom: 10px; font-size: 16px; }
                        .memo-content { color: #333; font-size: 14px; }
                        .status-section { text-align: center; margin: 30px 0; }
                        .status-badge { display: inline-block; padding: 10px 20px; border-radius: 25px; font-size: 16px; font-weight: bold; }
                        .status-completed { background: #28a745; color: white; }
                        .status-pending { background: #6c757d; color: white; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
                        .btn { background: #667eea; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; margin: 10px; }
                        .btn:hover { background: #5a6fd8; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="title">👤 ${person.name}</div>
                            <div class="subtitle">詳細資料檢視 | ${currentDate}</div>
                        </div>
                        
                        <div class="photo-section">
                            ${person.photo ? `<img src="${person.photo}" alt="${person.name}" class="photo">` : '<div class="no-photo">無照片</div>'}
                        </div>
                        
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">📋 個案號碼</div>
                                <div class="info-value">${person.caseNumber}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">📞 電話</div>
                                <div class="info-value">${person.phone}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">📍 地址</div>
                                <div class="info-value">${person.address}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">📅 創建日期</div>
                                <div class="info-value">${createdDate}</div>
                            </div>
                        </div>
                        
                        ${person.memo ? `
                            <div class="memo-section">
                                <div class="memo-title">📝 備忘</div>
                                <div class="memo-content">${person.memo}</div>
                            </div>
                        ` : ''}
                        
                        <div class="status-section">
                            <div class="status-badge status-${person.status}">
                                ${person.status === 'completed' ? '✅ 已完成' : '⏳ 未完成'}
                            </div>
                        </div>
                        
                        <div class="footer">
                            <button class="btn" onclick="window.print()">列印資料</button>
                            <button class="btn" onclick="window.close()">關閉視窗</button>
                            <br><br>
                            留守資訊系統 | 人員詳細資料
                        </div>
                    </div>
                </body>
                </html>
            `);
            
            detailWindow.document.close();
        }
    };
    
    window.editPerson = function(personId) {
        const person = personList.find(p => p.id === personId);
        if (person) {
            // 填充表單資料
            document.getElementById('person-name').value = person.name;
            document.getElementById('person-case-number').value = person.caseNumber;
            document.getElementById('person-phone').value = person.phone;
            document.getElementById('person-address').value = person.address;
            document.getElementById('person-memo').value = person.memo || '';
            
            // 設定月份
            const monthSelect = document.getElementById('person-month');
            if (monthSelect && person.createdMonth) {
                monthSelect.value = person.createdMonth.toString().padStart(2, '0');
            }
            
            // 顯示照片預覽
            if (person.photo) {
                photoPreview.innerHTML = `<img src="${person.photo}" alt="照片預覽">`;
            } else {
                photoPreview.innerHTML = '';
            }
            
            // 更新表單標題和按鈕
            const modalTitle = document.querySelector('.modal-header h3');
            const submitBtn = document.querySelector('.modal-form .btn-primary');
            if (modalTitle) modalTitle.textContent = '編輯人員';
            if (submitBtn) submitBtn.textContent = '更新';
            
            // 設定編輯模式
            addPersonForm.dataset.editMode = 'true';
            addPersonForm.dataset.editId = personId;
            
            // 顯示模態框
            showAddPersonForm();
        }
    };
    
    window.deletePerson = function(personId) {
        if (confirm('確定要刪除此人員嗎？')) {
            personList = personList.filter(p => p.id !== personId);
            localStorage.setItem('personList', JSON.stringify(personList));
            filterData();
            showNotification('人員已刪除', 'success');
        }
    };
    
    window.showMap = function(address) {
        // 創建地圖視窗
        const mapWindow = window.open('', '_blank', 'width=800,height=600');
        
        mapWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>地圖位置 - ${address}</title>
                <style>
                    body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
                    .container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
                    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .subtitle { font-size: 16px; opacity: 0.9; }
                    .map-container { padding: 20px; }
                    .map-placeholder { background: #f8f9fa; border: 2px dashed #e9ecef; border-radius: 10px; padding: 40px; text-align: center; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .map-icon { font-size: 64px; margin-bottom: 20px; }
                    .map-title { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 10px; }
                    .map-address { color: #666; font-size: 16px; margin-bottom: 20px; }
                    .map-actions { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; }
                    .btn { background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-block; }
                    .btn:hover { background: #5a6fd8; }
                    .btn-secondary { background: #6c757d; }
                    .btn-secondary:hover { background: #5a6268; }
                    .btn-success { background: #28a745; }
                    .btn-success:hover { background: #218838; }
                    .info-section { background: #e3f2fd; padding: 20px; margin: 20px; border-radius: 10px; }
                    .info-title { font-weight: bold; color: #1976d2; margin-bottom: 10px; }
                    .info-content { color: #333; line-height: 1.6; }
                    .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="title">🗺️ 地圖位置</div>
                        <div class="subtitle">${address}</div>
                    </div>
                    
                    <div class="map-container">
                        <div class="map-placeholder">
                            <div class="map-icon">📍</div>
                            <div class="map-title">地圖位置</div>
                            <div class="map-address">${address}</div>
                            <div class="map-actions">
                                <a href="https://www.google.com/maps/search/${encodeURIComponent(address)}" target="_blank" class="btn btn-success">🌐 開啟 Google 地圖</a>
                                <a href="https://maps.apple.com/?q=${encodeURIComponent(address)}" target="_blank" class="btn btn-secondary">🍎 開啟 Apple 地圖</a>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <div class="info-title">📍 地址資訊</div>
                            <div class="info-content">
                                <strong>完整地址：</strong>${address}<br>
                                <strong>建議操作：</strong>點擊上方按鈕開啟對應地圖應用程式，或複製地址到其他地圖服務使用。
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <button class="btn btn-secondary" onclick="window.print()">列印地圖資訊</button>
                        <button class="btn" onclick="window.close()">關閉視窗</button>
                        <br><br>
                        留守資訊系統 | 地圖位置查詢
                    </div>
                </div>
            </body>
            </html>
        `);
        
        mapWindow.document.close();
    };
    
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
        
        // 根據年份篩選
        if (year) {
            filteredData = filteredData.filter(person => {
                // 優先使用 createdYear，如果沒有則從 createdAt 提取
                const personYear = person.createdYear || new Date(person.createdAt).getFullYear();
                return personYear.toString() === year;
            });
        }
        
        // 根據月份篩選
        if (month) {
            filteredData = filteredData.filter(person => {
                // 優先使用 createdMonth，如果沒有則從 createdAt 提取
                const personMonth = person.createdMonth || new Date(person.createdAt).getMonth() + 1;
                // 將篩選條件中的月份轉換為數字進行比較
                const filterMonthNum = parseInt(month);
                return personMonth === filterMonthNum;
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
                                    ${!isCurrentMonth ? '<a href="#" class="mark-complete" onclick="markComplete(' + person.id + ')">標記完成</a>' : ''}
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
        
        if (currentTimeElement) {
            currentTimeElement.textContent = timeString;
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
});
