       // Global Variables
       let investors = [];
       let investments = [];
       let operations = [];
       let settings = {
           monthlyProfitRate: 1.75, // Default 1.75% monthly
           companyName: 'شركة الاستثمار العراقية',
           minInvestment: 1000000,
           profitDistributionPeriod: 'monthly',
           profitDistributionDay: 1,
           earlyWithdrawalFee: 0.5,
           maxPartialWithdrawal: 50,
           currency: 'IQD',
           acceptedCurrencies: ['IQD', 'USD']
       };
       let currentInvestorId = null;

       // ============ Utility Functions ============
       
       // Generate a unique ID
       function generateId() {
           return Date.now().toString(36) + Math.random().toString(36).substring(2);
       }

       // Generate Operation ID
       function generateOperationId() {
           const year = new Date().getFullYear();
           const count = operations.length + 1;
           return `OP-${year}-${count.toString().padStart(3, '0')}`;
       }

       // Format number with commas
       function formatNumber(num) {
           return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
       }

       // Format date to local format
       function formatDate(dateString) {
           const date = new Date(dateString);
           return date.toLocaleDateString('ar-IQ');
       }

       // Calculate days difference between two dates
       function daysDifference(date1, date2) {
           const d1 = new Date(date1);
           const d2 = new Date(date2);
           const diffTime = Math.abs(d2 - d1);
           return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
       }

       // Calculate monthly profit
       function calculateMonthlyProfit(amount) {
           return (amount * settings.monthlyProfitRate) / 100;
       }

       // Calculate profit for a specific date range
       function calculateProfit(amount, startDate, endDate) {
           const start = new Date(startDate);
           const end = new Date(endDate);
           const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
           const days = end.getDate() - start.getDate();
           const totalDays = daysDifference(startDate, endDate);
           
           // Calculate monthly profit
           const monthlyProfit = calculateMonthlyProfit(amount);
           
           // If less than a month, calculate pro-rated profit
           if (months === 0) {
               const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
               return (monthlyProfit * totalDays) / daysInMonth;
           } else {
               // Calculate complete months profit + remaining days
               const completeMonthsProfit = monthlyProfit * months;
               const daysInLastMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
               const remainingDaysProfit = (monthlyProfit * days) / daysInLastMonth;
               
               return completeMonthsProfit + remainingDaysProfit;
           }
       }

       // Create a notification
       function createNotification(title, message, type) {
           const notification = document.createElement('div');
           notification.className = `alert alert-${type}`;
           notification.style.position = 'fixed';
           notification.style.top = '20px';
           notification.style.right = '20px';
           notification.style.zIndex = '9999';
           notification.style.minWidth = '300px';
           notification.style.maxWidth = '500px';
           notification.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
           notification.style.transform = 'translateX(100%)';
           notification.style.opacity = '0';
           notification.style.transition = 'all 0.3s ease';
           
           notification.innerHTML = `
               <div class="alert-icon">
                   <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
               </div>
               <div class="alert-content">
                   <div class="alert-title">${title}</div>
                   <div class="alert-text">${message}</div>
               </div>
               <div class="modal-close" style="position: absolute; top: 10px; left: 10px; cursor: pointer;" onclick="this.parentNode.remove()">
                   <i class="fas fa-times"></i>
               </div>
           `;
           
           document.body.appendChild(notification);
           
           setTimeout(() => {
               notification.style.transform = 'translateX(0)';
               notification.style.opacity = '1';
           }, 100);
           
           setTimeout(() => {
               notification.style.transform = 'translateX(100%)';
               notification.style.opacity = '0';
               setTimeout(() => {
                   notification.remove();
               }, 300);
           }, 5000);
       }

       // ============ UI Functions ============
       
      
   // Add this code to the existing JavaScript file
   function toggleSidebar() {
       document.querySelector('.sidebar').classList.toggle('active');
   }
   
   // Add full collapse functionality (optional)
   function collapseSidebar() {
       document.querySelector('.sidebar').classList.toggle('collapsed');
   }
   
   // Add dark mode toggle (optional)
   function toggleDarkMode() {
       document.body.classList.toggle('dark-mode');
   }
   
   // Add this to initialize components
   document.addEventListener('DOMContentLoaded', function() {
       // Add sidebar toggle button to DOM
       const sidebarToggleBtn = document.createElement('div');
       sidebarToggleBtn.className = 'sidebar-toggle';
       sidebarToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
       sidebarToggleBtn.onclick = toggleSidebar;
       document.body.appendChild(sidebarToggleBtn);
   });


       // Show specific page
       function showPage(pageId) {
           // Hide all pages
           document.querySelectorAll('.page').forEach(page => {
               page.classList.remove('active');
           });
           
           // Show the selected page
           document.getElementById(pageId).classList.add('active');
           
           // Mark the current menu item as active
           document.querySelectorAll('.menu-item').forEach(item => {
               item.classList.remove('active');
           });
           
           document.querySelector(`.menu-item[href="#${pageId}"]`).classList.add('active');
           
           // Update the page content if needed
           if (pageId === 'dashboard') {
               updateDashboard();
           } else if (pageId === 'investors') {
               loadInvestors();
           } else if (pageId === 'investments') {
               loadInvestments();
           } else if (pageId === 'profits') {
               loadProfits();
           } else if (pageId === 'operations') {
               loadOperations();
           } else if (pageId === 'reports') {
               populateReportInvestors();
           } else if (pageId === 'settings') {
               loadSettings();
           }
       }

       // Toggle notification panel
       function toggleNotificationPanel() {
           document.getElementById('notificationPanel').classList.toggle('active');
       }

       // Open modal
       function openModal(modalId) {
           document.getElementById(modalId).classList.add('active');
       }

       // Close modal
       function closeModal(modalId) {
           document.getElementById(modalId).classList.remove('active');
       }

       // Switch tab in modal
       function switchModalTab(tabId, modalId) {
           // Hide all tabs
           document.querySelectorAll(`#${modalId} .modal-tab-content`).forEach(tab => {
               tab.classList.remove('active');
           });
           
           // Show the selected tab
           document.getElementById(tabId).classList.add('active');
           
           // Mark the current tab as active
           document.querySelectorAll(`#${modalId} .modal-tab`).forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#${modalId} .modal-tab[onclick="switchModalTab('${tabId}', '${modalId}')"]`).classList.add('active');
       }

       // Switch analytics tab
       function switchAnalyticsTab(tabId) {
           // Hide all tabs
           document.querySelectorAll('.analytics-tab-content').forEach(tab => {
               tab.classList.remove('active');
           });
           
           // Show the selected tab
           document.getElementById(`analytics${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
           
           // Mark the current tab as active
           document.querySelectorAll('#analytics .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#analytics .tab[onclick="switchAnalyticsTab('${tabId}')"]`).classList.add('active');
       }

       // Switch investments tab
       function switchInvestmentsTab(tabId) {
           // Mark the current tab as active
           document.querySelectorAll('#investments .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#investments .tab[onclick="switchInvestmentsTab('${tabId}')"]`).classList.add('active');
           
           // Update table content based on selected tab
           if (tabId === 'active') {
               document.querySelector('#investments .table-title').textContent = 'الاستثمارات النشطة';
               loadInvestments('active');
           } else if (tabId === 'closed') {
               document.querySelector('#investments .table-title').textContent = 'الاستثمارات المغلقة';
               loadInvestments('closed');
           } else {
               document.querySelector('#investments .table-title').textContent = 'جميع الاستثمارات';
               loadInvestments('all');
           }
       }

       // Switch profits tab
       function switchProfitsTab(tabId) {
           // Mark the current tab as active
           document.querySelectorAll('#profits .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#profits .tab[onclick="switchProfitsTab('${tabId}')"]`).classList.add('active');
       }

       // Switch operations tab
       function switchOperationsTab(tabId) {
           // Mark the current tab as active
           document.querySelectorAll('#operations .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#operations .tab[onclick="switchOperationsTab('${tabId}')"]`).classList.add('active');
           
           // Update table content based on selected tab
           loadOperations(tabId);
       }

       // Switch reports tab
       function switchReportsTab(tabId) {
           // Mark the current tab as active
           document.querySelectorAll('#reports .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#reports .tab[onclick="switchReportsTab('${tabId}')"]`).classList.add('active');
       }

       // Switch financial tab
       function switchFinancialTab(tabId) {
           // Mark the current tab as active
           document.querySelectorAll('#financial .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#financial .tab[onclick="switchFinancialTab('${tabId}')"]`).classList.add('active');
       }

       // Switch calendar view
       function switchCalendarView(viewId) {
           // Mark the current tab as active
           document.querySelectorAll('#calendar .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#calendar .tab[onclick="switchCalendarView('${viewId}')"]`).classList.add('active');
       }

       // Switch settings tab
       function switchSettingsTab(tabId) {
           // Hide all tabs
           document.querySelectorAll('.settings-tab-content').forEach(tab => {
               tab.classList.remove('active');
           });
           
           // Show the selected tab
           document.getElementById(`${tabId}Settings`).classList.add('active');
           
           // Mark the current tab as active
           document.querySelectorAll('#settings .tab').forEach(tab => {
               tab.classList.remove('active');
           });
           
           document.querySelector(`#settings .tab[onclick="switchSettingsTab('${tabId}')"]`).classList.add('active');
       }

       // Update days message when investment date changes
       function updateDaysMessage() {
           const dateInput = document.getElementById('investmentDate');
           const messageDiv = document.getElementById('daysMessage');
           
           if (!dateInput || !messageDiv || !dateInput.value) return;
           
           const selectedDate = new Date(dateInput.value);
           const today = new Date();
           
           // Reset time to compare only dates
           selectedDate.setHours(0, 0, 0, 0);
           today.setHours(0, 0, 0, 0);
           
           const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));
           
           if (diffDays > 0) {
               messageDiv.textContent = `تم اختيار تاريخ سابق (منذ ${diffDays} يوم)`;
               messageDiv.style.color = 'var(--warning-color)';
           } else if (diffDays < 0) {
               messageDiv.textContent = `تم اختيار تاريخ مستقبلي (بعد ${Math.abs(diffDays)} يوم)`;
               messageDiv.style.color = 'var(--info-color)';
           } else {
               messageDiv.textContent = 'تم اختيار تاريخ اليوم';
               messageDiv.style.color = 'var(--success-color)';
           }
       }

       // Update expected profit when investment amount changes
       function updateExpectedProfit() {
           const amountInput = document.getElementById('investmentAmount');
           const profitInput = document.getElementById('expectedProfit');
           
           if (!amountInput || !profitInput || !amountInput.value) {
               if (profitInput) profitInput.value = '';
               return;
           }
           
           const amount = parseFloat(amountInput.value);
           const monthlyProfit = calculateMonthlyProfit(amount);
           
           profitInput.value = formatNumber(monthlyProfit.toFixed(2)) + ' د.ع';
       }

       // Print table
       function printTable(tableId) {
           const table = document.getElementById(tableId);
           if (!table) return;
           
           const printWindow = window.open('', '_blank');
           printWindow.document.write(`
               <html dir="rtl">
               <head>
                   <title>طباعة</title>
                   <style>
                       body {
                           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                           direction: rtl;
                       }
                       table {
                           width: 100%;
                           border-collapse: collapse;
                           margin-bottom: 20px;
                       }
                       th, td {
                           border: 1px solid #ddd;
                           padding: 8px;
                           text-align: right;
                       }
                       th {
                           background-color: #f2f2f2;
                       }
                       h1 {
                           text-align: center;
                           margin-bottom: 20px;
                       }
                       .header {
                           display: flex;
                           justify-content: space-between;
                           margin-bottom: 20px;
                       }
                       .date {
                           text-align: left;
                       }
                       .status {
                           padding: 5px 10px;
                           border-radius: 50px;
                           font-size: 0.75rem;
                           font-weight: 600;
                           text-align: center;
                           display: inline-block;
                       }
                       .status.active {
                           background: rgba(46, 204, 113, 0.1);
                           color: #2ecc71;
                       }
                       .status.pending {
                           background: rgba(243, 156, 18, 0.1);
                           color: #f39c12;
                       }
                       .status.closed {
                           background: rgba(231, 76, 60, 0.1);
                           color: #e74c3c;
                       }
                   </style>
               </head>
               <body>
                   <div class="header">
                       <h2>${settings.companyName}</h2>
                       <div class="date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-IQ')}</div>
                   </div>
                   <h1>${document.querySelector('.page.active .page-title').textContent}</h1>
                   ${table.outerHTML}
               </body>
               </html>
           `);
           printWindow.document.close();
           printWindow.focus();
           printWindow.print();
       }

       // Open add investor modal
       function openAddInvestorModal() {
           // Reset form
           document.getElementById('investorForm').reset();
           document.getElementById('initialInvestmentForm').reset();
           
           // Set default date to today
           document.getElementById('initialInvestmentDate').valueAsDate = new Date();
           
           openModal('addInvestorModal');
       }

       // Open new investment modal
       function openNewInvestmentModal(investorId = null) {
           // Reset form
           document.getElementById('newInvestmentForm').reset();
           
           // Set default date to today
           document.getElementById('investmentDate').valueAsDate = new Date();
           
           // Update days message
           updateDaysMessage();
           
           // Populate investor select
           populateInvestorSelect('investmentInvestor');
           
           // If investor ID is provided, select it
           if (investorId) {
               document.getElementById('investmentInvestor').value = investorId;
           }
           
           openModal('newInvestmentModal');
       }

       // Open withdraw modal
       function openWithdrawModal(investmentId = null) {
           // Reset form
           document.getElementById('withdrawForm').reset();
           
           // Set default date to today
           document.getElementById('withdrawDate').valueAsDate = new Date();
           
           // Populate investor select
           populateInvestorSelect('withdrawInvestor');
           
           // If investment ID is provided, find the investment and select investor and investment
           if (investmentId) {
               const investment = investments.find(inv => inv.id === investmentId);
               if (investment) {
                   document.getElementById('withdrawInvestor').value = investment.investorId;
                   // Populate investment select
                   populateInvestmentSelect();
                   // Wait for select to be populated
                   setTimeout(() => {
                       document.getElementById('withdrawInvestment').value = investmentId;
                       // Update available amount
                       updateAvailableAmount();
                   }, 100);
               }
           }
           
           openModal('withdrawModal');
       }

       // Open pay profit modal
       function openPayProfitModal(investorId = null) {
           // Reset form
           document.getElementById('payProfitForm').reset();
           
           // Set default date to today
           document.getElementById('profitDate').valueAsDate = new Date();
           
           // Hide custom period fields
           document.getElementById('customProfitPeriod').style.display = 'none';
           
           // Populate investor select
           populateInvestorSelect('profitInvestor');
           
           // If investor ID is provided, select it
           if (investorId) {
               document.getElementById('profitInvestor').value = investorId;
               // Update due profit
               updateDueProfit();
           }
           
           openModal('payProfitModal');
       }

       // View investor details
       function viewInvestor(id) {
           // Set current investor ID
           currentInvestorId = id;
           
           // Find investor
           const investor = investors.find(inv => inv.id === id);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Populate investor details tab
           const detailsTab = document.getElementById('investorDetails');
           
           // Calculate total investment for this investor
           const totalInvestment = investments
               .filter(inv => inv.investorId === investor.id && inv.status === 'active')
               .reduce((total, inv) => total + inv.amount, 0);
           
           // Calculate total profit for this investor
           const today = new Date();
           let totalProfit = 0;
           
           investments
               .filter(inv => inv.investorId === investor.id && inv.status === 'active')
               .forEach(inv => {
                   const profit = calculateProfit(inv.amount, inv.date, today);
                   totalProfit += profit;
               });
           
           detailsTab.innerHTML = `
               <div style="display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                   <div style="width: 120px; height: 120px; background: var(--gray-200); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--gray-600); font-size: 3rem;">
                       <i class="fas fa-user"></i>
                   </div>
                   <div style="flex: 1; min-width: 250px;">
                       <h2 style="margin-bottom: 10px; color: var(--gray-800);">${investor.name}</h2>
                       <p style="margin-bottom: 5px;"><i class="fas fa-phone" style="width: 20px; color: var(--gray-600);"></i> ${investor.phone}</p>
                       <p style="margin-bottom: 5px;"><i class="fas fa-map-marker-alt" style="width: 20px; color: var(--gray-600);"></i> ${investor.address || 'غير محدد'}</p>
                       <p style="margin-bottom: 5px;"><i class="fas fa-id-card" style="width: 20px; color: var(--gray-600);"></i> ${investor.idCard || 'غير محدد'}</p>
                       <p style="margin-bottom: 5px;"><i class="fas fa-calendar-alt" style="width: 20px; color: var(--gray-600);"></i> تاريخ الانضمام: ${formatDate(investor.joinDate)}</p>
                   </div>
                   <div style="min-width: 200px;">
                       <div class="card" style="margin-bottom: 10px; border-right: 4px solid var(--primary-color);">
                           <div style="font-size: 0.9rem; color: var(--gray-600);">إجمالي الاستثمار</div>
                           <div style="font-size: 1.5rem; font-weight: 700;">${formatNumber(totalInvestment)} د.ع</div>
                       </div>
                       <div class="card" style="border-right: 4px solid var(--warning-color);">
                           <div style="font-size: 0.9rem; color: var(--gray-600);">إجمالي الأرباح</div>
                           <div style="font-size: 1.5rem; font-weight: 700;">${formatNumber(totalProfit.toFixed(2))} د.ع</div>
                       </div>
                   </div>
               </div>
               <div style="background: var(--gray-100); border-radius: var(--border-radius); padding: 15px; margin-bottom: 20px;">
                   <h3 style="margin-bottom: 10px; color: var(--gray-700);">معلومات إضافية</h3>
                   <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                       <div>
                           <div style="font-size: 0.8rem; color: var(--gray-600);">البريد الإلكتروني</div>
                           <div>${investor.email || 'غير محدد'}</div>
                       </div>
                       <div>
                           <div style="font-size: 0.8rem; color: var(--gray-600);">تاريخ الميلاد</div>
                           <div>${investor.birthdate ? formatDate(investor.birthdate) : 'غير محدد'}</div>
                       </div>
                       <div>
                           <div style="font-size: 0.8rem; color: var(--gray-600);">المدينة</div>
                           <div>${investor.city || 'غير محدد'}</div>
                       </div>
                       <div>
                           <div style="font-size: 0.8rem; color: var(--gray-600);">المهنة</div>
                           <div>${investor.occupation || 'غير محدد'}</div>
                       </div>
                   </div>
               </div>
               <div>
                   <h3 style="margin-bottom: 10px; color: var(--gray-700);">ملاحظات</h3>
                   <p style="background: white; border-radius: var(--border-radius); padding: 15px; border: 1px solid var(--gray-200);">${investor.notes || 'لا توجد ملاحظات'}</p>
               </div>
           `;
           
       // Populate investor investments tab
           const investmentsTab = document.getElementById('investorInvestments');
           
           // Get investor investments
           const investorInvestments = investments.filter(inv => inv.investorId === investor.id);
           
           if (investorInvestments.length === 0) {
               investmentsTab.innerHTML = `
                   <div class="alert alert-info">
                       <div class="alert-icon">
                           <i class="fas fa-info"></i>
                       </div>
                       <div class="alert-content">
                           <div class="alert-title">لا توجد استثمارات</div>
                           <div class="alert-text">لا توجد استثمارات لهذا المستثمر. يمكنك إضافة استثمار جديد من خلال الضغط على زر "استثمار جديد".</div>
                       </div>
                   </div>
               `;
           } else {
               investmentsTab.innerHTML = `
                   <div class="table-container" style="box-shadow: none; padding: 0;">
                       <table class="table">
                           <thead>
                               <tr>
                                   <th>#</th>
                                   <th>المبلغ</th>
                                   <th>تاريخ الاستثمار</th>
                                   <th>الربح الشهري</th>
                                   <th>إجمالي الأرباح</th>
                                   <th>الحالة</th>
                                   <th>إجراءات</th>
                               </tr>
                           </thead>
                           <tbody id="investorInvestmentsBody"></tbody>
                       </table>
                   </div>
               `;
               
               const tbody = document.getElementById('investorInvestmentsBody');
               
               investorInvestments.forEach((investment, index) => {
                   const monthlyProfit = calculateMonthlyProfit(investment.amount);
                   const totalProfit = investment.status === 'active' ? 
                       calculateProfit(investment.amount, investment.date, today) : 0;
                   
                   const row = document.createElement('tr');
                   row.innerHTML = `
                       <td>${index + 1}</td>
                       <td>${formatNumber(investment.amount)} د.ع</td>
                       <td>${formatDate(investment.date)}</td>
                       <td>${formatNumber(monthlyProfit.toFixed(2))} د.ع</td>
                       <td>${formatNumber(totalProfit.toFixed(2))} د.ع</td>
                       <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'نشط' : 'مغلق'}</span></td>
                       <td>
                           <button class="btn btn-info btn-icon action-btn" onclick="viewInvestment('${investment.id}')">
                               <i class="fas fa-eye"></i>
                           </button>
                           ${investment.status === 'active' ? `
                               <button class="btn btn-warning btn-icon action-btn" onclick="openWithdrawModal('${investment.id}')">
                                   <i class="fas fa-minus"></i>
                               </button>
                               <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investor.id}')">
                                   <i class="fas fa-money-bill"></i>
                               </button>
                           ` : ''}
                       </td>
                   `;
                   
                   tbody.appendChild(row);
               });
           }
           
           // Populate investor operations tab
           const operationsTab = document.getElementById('investorOperations');
           
           // Get investor operations
           const investorOperations = operations.filter(op => op.investorId === investor.id);
           
           if (investorOperations.length === 0) {
               operationsTab.innerHTML = `
                   <div class="alert alert-info">
                       <div class="alert-icon">
                           <i class="fas fa-info"></i>
                       </div>
                       <div class="alert-content">
                           <div class="alert-title">لا توجد عمليات</div>
                           <div class="alert-text">لا توجد عمليات لهذا المستثمر.</div>
                       </div>
                   </div>
               `;
           } else {
               operationsTab.innerHTML = `
                   <div class="table-container" style="box-shadow: none; padding: 0;">
                       <table class="table">
                           <thead>
                               <tr>
                                   <th>رقم العملية</th>
                                   <th>نوع العملية</th>
                                   <th>المبلغ</th>
                                   <th>التاريخ</th>
                                   <th>الحالة</th>
                                   <th>ملاحظات</th>
                               </tr>
                           </thead>
                           <tbody id="investorOperationsBody"></tbody>
                       </table>
                   </div>
               `;
               
               const tbody = document.getElementById('investorOperationsBody');
               
               // Sort operations by date (newest first)
               const sortedOperations = [...investorOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
               
               sortedOperations.forEach((operation) => {
                   const row = document.createElement('tr');
                   row.innerHTML = `
                       <td>${operation.id}</td>
                       <td>${getOperationTypeName(operation.type)}</td>
                       <td>${formatNumber(operation.amount)} د.ع</td>
                       <td>${formatDate(operation.date)}</td>
                       <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                       <td>${operation.notes || '-'}</td>
                   `;
                   
                   tbody.appendChild(row);
               });
           }
           
           // Populate investor profits tab
           const profitsTab = document.getElementById('investorProfits');
           
           // Get active investments for this investor
           const activeInvestments = investments.filter(inv => inv.investorId === investor.id && inv.status === 'active');
           
           if (activeInvestments.length === 0) {
               profitsTab.innerHTML = `
                   <div class="alert alert-info">
                       <div class="alert-icon">
                           <i class="fas fa-info"></i>
                       </div>
                       <div class="alert-content">
                           <div class="alert-title">لا توجد استثمارات نشطة</div>
                           <div class="alert-text">لا توجد استثمارات نشطة لهذا المستثمر لحساب الأرباح.</div>
                       </div>
                   </div>
               `;
           } else {
               // Get profit payment operations
               const profitPayments = operations.filter(op => op.investorId === investor.id && op.type === 'profit');
               
               // Calculate total profit paid
               const totalProfitPaid = profitPayments.reduce((total, op) => total + op.amount, 0);
               
               profitsTab.innerHTML = `
                   <div class="dashboard-cards" style="margin-bottom: 20px;">
                       <div class="card">
                           <div class="card-header">
                               <div>
                                   <div class="card-title">إجمالي الأرباح</div>
                                   <div class="card-value">${formatNumber(totalProfit.toFixed(2))} د.ع</div>
                               </div>
                               <div class="card-icon primary">
                                   <i class="fas fa-hand-holding-usd"></i>
                               </div>
                           </div>
                       </div>
                       <div class="card">
                           <div class="card-header">
                               <div>
                                   <div class="card-title">الأرباح المدفوعة</div>
                                   <div class="card-value">${formatNumber(totalProfitPaid.toFixed(2))} د.ع</div>
                               </div>
                               <div class="card-icon success">
                                   <i class="fas fa-check-circle"></i>
                               </div>
                           </div>
                       </div>
                       <div class="card">
                           <div class="card-header">
                               <div>
                                   <div class="card-title">الأرباح المستحقة</div>
                                   <div class="card-value">${formatNumber((totalProfit - totalProfitPaid).toFixed(2))} د.ع</div>
                               </div>
                               <div class="card-icon warning">
                                   <i class="fas fa-clock"></i>
                               </div>
                           </div>
                       </div>
                   </div>
                   
                   <div class="table-container" style="box-shadow: none; padding: 0;">
                       <div class="table-header">
                           <div class="table-title">سجل دفع الأرباح</div>
                       </div>
                       <table class="table">
                           <thead>
                               <tr>
                                   <th>رقم العملية</th>
                                   <th>المبلغ</th>
                                   <th>التاريخ</th>
                                   <th>ملاحظات</th>
                               </tr>
                           </thead>
                           <tbody id="investorProfitsBody"></tbody>
                       </table>
                   </div>
               `;
               
               const tbody = document.getElementById('investorProfitsBody');
               
               if (profitPayments.length === 0) {
                   const row = document.createElement('tr');
                   row.innerHTML = `
                       <td colspan="4" style="text-align: center;">لا توجد عمليات دفع أرباح</td>
                   `;
                   tbody.appendChild(row);
               } else {
                   // Sort profit payments by date (newest first)
                   const sortedPayments = [...profitPayments].sort((a, b) => new Date(b.date) - new Date(a.date));
                   
                   sortedPayments.forEach((payment) => {
                       const row = document.createElement('tr');
                       row.innerHTML = `
                           <td>${payment.id}</td>
                           <td>${formatNumber(payment.amount)} د.ع</td>
                           <td>${formatDate(payment.date)}</td>
                           <td>${payment.notes || '-'}</td>
                       `;
                       
                       tbody.appendChild(row);
                   });
               }
           }
           
           // Populate investor documents tab
           const documentsTab = document.getElementById('investorDocuments');
           
           documentsTab.innerHTML = `
               <div class="alert alert-info">
                   <div class="alert-icon">
                       <i class="fas fa-info"></i>
                   </div>
                   <div class="alert-content">
                       <div class="alert-title">المستندات</div>
                       <div class="alert-text">يمكنك إدارة مستندات المستثمر من هنا.</div>
                   </div>
               </div>
               
               <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                   <div class="card" style="padding: 15px; text-align: center;">
                       <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                           <i class="fas fa-id-card"></i>
                       </div>
                       <div style="font-weight: 600; margin-bottom: 5px;">صورة البطاقة الشخصية</div>
                       <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'idCard')">
                           <i class="fas fa-upload"></i> تحميل
                       </button>
                   </div>
                   <div class="card" style="padding: 15px; text-align: center;">
                       <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                           <i class="fas fa-file-contract"></i>
                       </div>
                       <div style="font-weight: 600; margin-bottom: 5px;">عقد الاستثمار</div>
                       <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'contract')">
                           <i class="fas fa-upload"></i> تحميل
                       </button>
                   </div>
                   <div class="card" style="padding: 15px; text-align: center;">
                       <div style="font-size: 3rem; color: var(--primary-color); margin-bottom: 10px;">
                           <i class="fas fa-file-alt"></i>
                       </div>
                       <div style="font-weight: 600; margin-bottom: 5px;">مستندات إضافية</div>
                       <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="uploadDocument('${investor.id}', 'other')">
                           <i class="fas fa-upload"></i> تحميل
                       </button>
                   </div>
               </div>
           `;
           
           openModal('viewInvestorModal');
       }

       // View investment details
       function viewInvestment(id) {
           // Find investment
           const investment = investments.find(inv => inv.id === id);
           
           if (!investment) {
               createNotification('خطأ', 'الاستثمار غير موجود', 'danger');
               return;
           }
           
           // Find investor
           const investor = investors.find(inv => inv.id === investment.investorId);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Calculate monthly profit
           const monthlyProfit = calculateMonthlyProfit(investment.amount);
           
           // Calculate total profit
           const today = new Date();
           const totalProfit = investment.status === 'active' ? 
               calculateProfit(investment.amount, investment.date, today) : 0;
           
           // Create investment details popup
           const modal = document.createElement('div');
           modal.className = 'modal-overlay active';
           modal.id = 'viewInvestmentModal';
           
           modal.innerHTML = `
               <div class="modal">
                   <div class="modal-header">
                       <h2 class="modal-title">تفاصيل الاستثمار</h2>
                       <div class="modal-close" onclick="document.getElementById('viewInvestmentModal').remove()">
                           <i class="fas fa-times"></i>
                       </div>
                   </div>
                   <div class="modal-body">
                       <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                           <div class="dashboard-cards">
                               <div class="card">
                                   <div class="card-header">
                                       <div>
                                           <div class="card-title">المبلغ</div>
                                           <div class="card-value">${formatNumber(investment.amount)} د.ع</div>
                                       </div>
                                       <div class="card-icon primary">
                                           <i class="fas fa-money-bill-wave"></i>
                                       </div>
                                   </div>
                               </div>
                               <div class="card">
                                   <div class="card-header">
                                       <div>
                                           <div class="card-title">الربح الشهري</div>
                                           <div class="card-value">${formatNumber(monthlyProfit.toFixed(2))} د.ع</div>
                                       </div>
                                       <div class="card-icon success">
                                           <i class="fas fa-percentage"></i>
                                       </div>
                                   </div>
                               </div>
                               <div class="card">
                                   <div class="card-header">
                                       <div>
                                           <div class="card-title">إجمالي الأرباح</div>
                                           <div class="card-value">${formatNumber(totalProfit.toFixed(2))} د.ع</div>
                                       </div>
                                       <div class="card-icon warning">
                                           <i class="fas fa-hand-holding-usd"></i>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">المستثمر</label>
                                   <input type="text" class="form-control" value="${investor.name}" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">تاريخ الاستثمار</label>
                                   <input type="text" class="form-control" value="${formatDate(investment.date)}" readonly>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">الحالة</label>
                                   <input type="text" class="form-control" value="${investment.status === 'active' ? 'نشط' : 'مغلق'}" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">مدة الاستثمار</label>
                                   <input type="text" class="form-control" value="${daysDifference(investment.date, today)} يوم" readonly>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">نسبة الربح الشهرية</label>
                                   <input type="text" class="form-control" value="${settings.monthlyProfitRate}%" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">طريقة الدفع</label>
                                   <input type="text" class="form-control" value="${investment.method || 'نقداً'}" readonly>
                               </div>
                           </div>
                           <div class="form-group">
                               <label class="form-label">ملاحظات</label>
                               <textarea class="form-control" rows="3" readonly>${investment.notes || 'لا توجد ملاحظات'}</textarea>
                           </div>
                       </div>
                       
                       <div class="table-container" style="box-shadow: none; padding: 0;">
                           <div class="table-header">
                               <div class="table-title">العمليات المرتبطة</div>
                           </div>
                           <table class="table">
                               <thead>
                                   <tr>
                                       <th>رقم العملية</th>
                                       <th>نوع العملية</th>
                                       <th>المبلغ</th>
                                       <th>التاريخ</th>
                                       <th>الحالة</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${operations
                                       .filter(op => op.investmentId === investment.id)
                                       .sort((a, b) => new Date(b.date) - new Date(a.date))
                                       .map(op => `
                                           <tr>
                                               <td>${op.id}</td>
                                               <td>${getOperationTypeName(op.type)}</td>
                                               <td>${formatNumber(op.amount)} د.ع</td>
                                               <td>${formatDate(op.date)}</td>
                                               <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                                           </tr>
                                       `).join('') || `<tr><td colspan="5" style="text-align: center;">لا توجد عمليات مرتبطة</td></tr>`
                                   }
                               </tbody>
                           </table>
                       </div>
                   </div>
                   <div class="modal-footer">
                       <button class="btn btn-light" onclick="document.getElementById('viewInvestmentModal').remove()">إغلاق</button>
                       ${investment.status === 'active' ? `
                           <button class="btn btn-warning" onclick="document.getElementById('viewInvestmentModal').remove(); openWithdrawModal('${investment.id}')">
                               <i class="fas fa-minus"></i> سحب
                           </button>
                           <button class="btn btn-primary" onclick="document.getElementById('viewInvestmentModal').remove(); openPayProfitModal('${investor.id}')">
                               <i class="fas fa-money-bill"></i> دفع أرباح
                           </button>
                       ` : ''}
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
       }

       // View operation details
       function viewOperation(id) {
           // Find operation
           const operation = operations.find(op => op.id === id);
           
           if (!operation) {
               createNotification('خطأ', 'العملية غير موجودة', 'danger');
               return;
           }
           
           // Find investor
           const investor = investors.find(inv => inv.id === operation.investorId);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Find investment if applicable
           const investment = operation.investmentId ? 
               investments.find(inv => inv.id === operation.investmentId) : null;
           
           // Create operation details popup
           const modal = document.createElement('div');
           modal.className = 'modal-overlay active';
           modal.id = 'viewOperationModal';
           
           modal.innerHTML = `
               <div class="modal">
                   <div class="modal-header">
                       <h2 class="modal-title">تفاصيل العملية</h2>
                       <div class="modal-close" onclick="document.getElementById('viewOperationModal').remove()">
                           <i class="fas fa-times"></i>
                       </div>
                   </div>
                   <div class="modal-body">
                       <div class="alert alert-${operation.status === 'pending' ? 'warning' : 'success'}">
                           <div class="alert-icon">
                               <i class="fas fa-${operation.status === 'pending' ? 'exclamation-triangle' : 'check-circle'}"></i>
                           </div>
                           <div class="alert-content">
                               <div class="alert-title">حالة العملية: ${operation.status === 'pending' ? 'معلقة' : 'مكتملة'}</div>
                               <div class="alert-text">${operation.status === 'pending' ? 'هذه العملية معلقة وتحتاج إلى موافقة.' : 'تم تنفيذ هذه العملية بنجاح.'}</div>
                           </div>
                       </div>
                       
                       <div class="form-container" style="box-shadow: none; padding: 0; margin-bottom: 20px;">
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">رقم العملية</label>
                                   <input type="text" class="form-control" value="${operation.id}" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">نوع العملية</label>
                                   <input type="text" class="form-control" value="${getOperationTypeName(operation.type)}" readonly>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">المستثمر</label>
                                   <input type="text" class="form-control" value="${investor.name}" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">المبلغ</label>
                                   <input type="text" class="form-control" value="${formatNumber(operation.amount)} د.ع" readonly>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">تاريخ العملية</label>
                                   <input type="text" class="form-control" value="${formatDate(operation.date)}" readonly>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">وقت العملية</label>
                                   <input type="text" class="form-control" value="${new Date(operation.date).toLocaleTimeString('ar-IQ')}" readonly>
                               </div>
                           </div>
                           ${investment ? `
                               <div class="form-row">
                                   <div class="form-group">
                                       <label class="form-label">الاستثمار المرتبط</label>
                                       <input type="text" class="form-control" value="${formatNumber(investment.amount)} د.ع - ${formatDate(investment.date)}" readonly>
                                   </div>
                                   <div class="form-group">
                                       <label class="form-label">حالة الاستثمار</label>
                                       <input type="text" class="form-control" value="${investment.status === 'active' ? 'نشط' : 'مغلق'}" readonly>
                                   </div>
                               </div>
                           ` : ''}
                           <div class="form-group">
                               <label class="form-label">ملاحظات</label>
                               <textarea class="form-control" rows="3" readonly>${operation.notes || 'لا توجد ملاحظات'}</textarea>
                           </div>
                       </div>
                   </div>
                   <div class="modal-footer">
                       <button class="btn btn-light" onclick="document.getElementById('viewOperationModal').remove()">إغلاق</button>
                       ${operation.status === 'pending' ? `
                           <button class="btn btn-success" onclick="approveOperation('${operation.id}')">
                               <i class="fas fa-check"></i> موافقة
                           </button>
                           <button class="btn btn-danger" onclick="rejectOperation('${operation.id}')">
                               <i class="fas fa-times"></i> رفض
                           </button>
                       ` : ''}
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
       }

       // Populate investor select
       function populateInvestorSelect(selectId) {
           const select = document.getElementById(selectId);
           
           if (!select) return;
           
           // Clear previous options
           select.innerHTML = '<option value="">اختر المستثمر</option>';
           
           // Add investor options
           investors.forEach(investor => {
               const option = document.createElement('option');
               option.value = investor.id;
               option.textContent = investor.name;
               select.appendChild(option);
           });
       }

       // Populate investment select
       function populateInvestmentSelect() {
           const investorId = document.getElementById('withdrawInvestor').value;
           const investmentSelect = document.getElementById('withdrawInvestment');
           
           // Clear previous options
           investmentSelect.innerHTML = '<option value="">اختر الاستثمار</option>';
           
           if (!investorId) return;
           
           // Find active investments for the selected investor
           const activeInvestments = investments.filter(
               inv => inv.investorId === investorId && inv.status === 'active'
           );
           
           activeInvestments.forEach(inv => {
               const option = document.createElement('option');
               option.value = inv.id;
               option.textContent = `${formatNumber(inv.amount)} د.ع - ${formatDate(inv.date)}`;
               investmentSelect.appendChild(option);
           });
       }

       // Update available amount
       function updateAvailableAmount() {
           const investmentId = document.getElementById('withdrawInvestment').value;
           const availableInput = document.getElementById('availableAmount');
           
           if (!investmentId || !availableInput) return;
           
           const investment = investments.find(inv => inv.id === investmentId);
           if (investment) {
               availableInput.value = formatNumber(investment.amount) + ' د.ع';
           }
       }

       // Update due profit
       function updateDueProfit() {
           const investorId = document.getElementById('profitInvestor').value;
           const dueProfitInput = document.getElementById('dueProfit');
           
           if (!investorId || !dueProfitInput) return;
           
           // Calculate total profit for the investor
           let totalProfit = 0;
           
           // Find active investments for the selected investor
           const activeInvestments = investments.filter(
               inv => inv.investorId === investorId && inv.status === 'active'
           );
           
           const today = new Date();
           
           activeInvestments.forEach(inv => {
               const profit = calculateProfit(inv.amount, inv.date, today);
               totalProfit += profit;
           });
           
           // Get total profit paid
           const profitPaid = operations
               .filter(op => op.investorId === investorId && op.type === 'profit')
               .reduce((total, op) => total + op.amount, 0);
           
           // Calculate due profit
           const dueProfit = Math.max(0, totalProfit - profitPaid);
           
           dueProfitInput.value = formatNumber(dueProfit.toFixed(2)) + ' د.ع';
           
           // Update profit amount
           const profitAmountInput = document.getElementById('profitAmount');
           if (profitAmountInput) {
               profitAmountInput.value = dueProfit.toFixed(0);
           }
       }

       // Toggle custom profit period
       function toggleCustomProfitPeriod() {
           const periodSelect = document.getElementById('profitPeriod');
           const customPeriod = document.getElementById('customProfitPeriod');
           
           if (!periodSelect || !customPeriod) return;
           
           if (periodSelect.value === 'custom') {
               customPeriod.style.display = 'grid';
           } else {
               customPeriod.style.display = 'none';
           }
       }

       // Get operation type name
       function getOperationTypeName(type) {
           switch (type) {
               case 'investment':
                   return 'استثمار جديد';
               case 'withdrawal':
                   return 'سحب';
               case 'profit':
                   return 'دفع أرباح';
               default:
                   return type;
           }
       }

       // ============ CRUD Operations ============
       
       // Save investor
       function saveInvestor() {
           // Get form values
           const name = document.getElementById('investorName').value;
           const phone = document.getElementById('investorPhone').value;
           const email = document.getElementById('investorEmail').value;
           const birthdate = document.getElementById('investorBirthdate').value;
           const address = document.getElementById('investorAddress').value;
           const city = document.getElementById('investorCity').value;
           const idCard = document.getElementById('investorIdCard').value;
           const idCardDate = document.getElementById('investorIdCardDate').value;
           const occupation = document.getElementById('investorOccupation').value;
           const notes = document.getElementById('investorNotes').value;
           
           // Validate required fields
           if (!name || !phone || !address || !city || !idCard) {
               createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
               return;
           }
           
           // Create new investor
           const newInvestor = {
               id: generateId(),
               name,
               phone,
               email,
               birthdate,
               address,
               city,
               idCard,
               idCardDate,
               occupation,
               notes,
               joinDate: new Date().toISOString()
           };
           
           // Add investor to array
           investors.push(newInvestor);
           
           // Check if there's an initial investment
           const initialAmount = document.getElementById('initialInvestmentAmount').value;
           const initialDate = document.getElementById('initialInvestmentDate').value;
           
           if (initialAmount && initialDate) {
               const amount = parseFloat(initialAmount);
               const method = document.getElementById('initialInvestmentMethod').value;
               const reference = document.getElementById('initialInvestmentReference').value;
               const investmentNotes = document.getElementById('initialInvestmentNotes').value;
               
               // Create new investment
               const newInvestment = {
                   id: generateId(),
                   investorId: newInvestor.id,
                   amount,
                   date: initialDate,
                   method,
                   reference,
                   notes: investmentNotes,
                   status: 'active'
               };
               
               // Add investment to array
               investments.push(newInvestment);
               
               // Create operation
               const newOperation = {
                   id: generateOperationId(),
                   investorId: newInvestor.id,
                   type: 'investment',
                   amount,
                   date: new Date().toISOString(),
                   investmentId: newInvestment.id,
                   notes: 'استثمار جديد',
                   status: 'active'
               };
               
               // Add operation to array
               operations.push(newOperation);
           }
           
           // Save data
           saveData();
           
           // Close modal
           closeModal('addInvestorModal');
           
           // Refresh investors table
           loadInvestors();
           
           // Show success notification
           createNotification('نجاح', 'تم إضافة المستثمر بنجاح', 'success');
       }

       // Save investment
       function saveInvestment() {
           // Get form values
           const investorId = document.getElementById('investmentInvestor').value;
           const amount = parseFloat(document.getElementById('investmentAmount').value);
           const date = document.getElementById('investmentDate').value;
           const method = document.getElementById('investmentMethod').value;
           const reference = document.getElementById('investmentReference').value;
           const notes = document.getElementById('investmentNotes').value;
           
           // Validate required fields
           if (!investorId || !amount || !date) {
               createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
               return;
           }
           
           // Validate amount
           if (amount <= 0 || amount < settings.minInvestment) {
               createNotification('خطأ', `المبلغ يجب أن يكون أكبر من ${formatNumber(settings.minInvestment)} د.ع`, 'danger');
               return;
           }
           
           // Create new investment
           const newInvestment = {
               id: generateId(),
               investorId,
               amount,
               date,
               method,
               reference,
               notes,
               status: 'active'
           };
           
           // Add investment to array
           investments.push(newInvestment);
           
           // Create operation
           const newOperation = {
               id: generateOperationId(),
               investorId,
               type: 'investment',
               amount,
               date: new Date().toISOString(),
               investmentId: newInvestment.id,
               notes: notes || 'استثمار جديد',
               status: 'active'
           };
           
           // Add operation to array
           operations.push(newOperation);
           
           // Save data
           saveData();
           
           // Close modal
           closeModal('newInvestmentModal');
           
           // Refresh investments table
           loadInvestments();
           
           // Show success notification
           createNotification('نجاح', 'تم إضافة الاستثمار بنجاح', 'success');
       }

       // Save withdrawal
       function saveWithdrawal() {
           // Get form values
           const investmentId = document.getElementById('withdrawInvestment').value;
           const amount = parseFloat(document.getElementById('withdrawAmount').value);
           const date = document.getElementById('withdrawDate').value;
           const method = document.getElementById('withdrawMethod').value;
           const notes = document.getElementById('withdrawNotes').value;
           
           // Validate required fields
           if (!investmentId || !amount || !date) {
               createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
               return;
           }
           
           // Find investment
           const investment = investments.find(inv => inv.id === investmentId);
           
           if (!investment) {
               createNotification('خطأ', 'الاستثمار غير موجود', 'danger');
               return;
           }
           
           // Validate amount
           if (amount <= 0 || amount > investment.amount) {
               createNotification('خطأ', 'المبلغ غير صحيح', 'danger');
               return;
           }
           
           // Check if partial withdrawal is allowed
           if (amount < investment.amount && (amount / investment.amount) * 100 > settings.maxPartialWithdrawal) {
               createNotification('خطأ', `الحد الأقصى للسحب الجزئي هو ${settings.maxPartialWithdrawal}% من المبلغ`, 'danger');
               return;
           }
           
           // Create operation
           const newOperation = {
               id: generateOperationId(),
               investorId: investment.investorId,
               type: 'withdrawal',
               amount,
               date: new Date().toISOString(),
               investmentId,
               notes: notes || 'سحب',
               status: 'pending'
           };
           
           // Add operation to array
           operations.push(newOperation);
           
           // Save data
           saveData();
           
           // Close modal
           closeModal('withdrawModal');
           
           // Refresh operations table
           loadOperations();
           
           // Show success notification
           createNotification('نجاح', 'تم تسجيل طلب السحب بنجاح', 'success');
       }

       // Save pay profit
       function savePayProfit() {
           // Get form values
           const investorId = document.getElementById('profitInvestor').value;
           const amount = parseFloat(document.getElementById('profitAmount').value);
           const date = document.getElementById('profitDate').value;
           const method = document.getElementById('profitMethod').value;
           const notes = document.getElementById('profitNotes').value;
           
           // Validate required fields
           if (!investorId || !amount || !date) {
               createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
               return;
           }
           
           // Validate amount
           if (amount <= 0) {
               createNotification('خطأ', 'المبلغ غير صحيح', 'danger');
               return;
           }
           
           // Create operation
           const newOperation = {
               id: generateOperationId(),
               investorId,
               type: 'profit',
               amount,
               date: new Date().toISOString(),
               notes: notes || 'دفع أرباح',
               status: 'active'
           };
           
           // Add operation to array
           operations.push(newOperation);
           
           // Save data
           saveData();
           
           // Close modal
           closeModal('payProfitModal');
           
           // Refresh operations table
           loadOperations();
           
           // Show success notification
           createNotification('نجاح', 'تم تسجيل دفع الأرباح بنجاح', 'success');
       }

       // Approve operation
       function approveOperation(id) {
           // Find operation
           const operation = operations.find(op => op.id === id);
           
           if (!operation) {
               createNotification('خطأ', 'العملية غير موجودة', 'danger');
               return;
           }
           
           // Update operation status
           operation.status = 'active';
           
           // If withdrawal operation, update investment
           if (operation.type === 'withdrawal' && operation.investmentId) {
               const investment = investments.find(inv => inv.id === operation.investmentId);
               
               if (investment) {
                   // Update investment amount or status
                   if (operation.amount === investment.amount) {
                       investment.status = 'closed';
                   } else {
                       investment.amount -= operation.amount;
                   }
               }
           }
           
           // Save data
           saveData();
           
           // Close operation modal if open
           const operationModal = document.getElementById('viewOperationModal');
           if (operationModal) {
               operationModal.remove();
           }
           
           // Refresh operations table
           loadOperations();
           
           // Show success notification
           createNotification('نجاح', 'تمت الموافقة على العملية بنجاح', 'success');
       }

       // Reject operation
       function rejectOperation(id) {
           // Find operation
           const operation = operations.find(op => op.id === id);
           
           if (!operation) {
               createNotification('خطأ', 'العملية غير موجودة', 'danger');
               return;
           }
           
           // Remove operation
           operations = operations.filter(op => op.id !== id);
           
           // Save data
           saveData();
           
           // Close operation modal if open
           const operationModal = document.getElementById('viewOperationModal');
           if (operationModal) {
               operationModal.remove();
           }
           
           // Refresh operations table
           loadOperations();
           
           // Show success notification
           createNotification('نجاح', 'تم رفض العملية بنجاح', 'danger');
       }

       // Edit investor
       function editInvestor(id) {
           currentInvestorId = id;
           
           // Find investor
           const investor = investors.find(inv => inv.id === id);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Close view modal if open
           const viewModal = document.getElementById('viewInvestorModal');
           if (viewModal) {
               viewModal.remove();
           }
           
           // Create edit investor modal
           const modal = document.createElement('div');
           modal.className = 'modal-overlay active';
           modal.id = 'editInvestorModal';
           
           modal.innerHTML = `
               <div class="modal">
                   <div class="modal-header">
                       <h2 class="modal-title">تعديل بيانات المستثمر</h2>
                       <div class="modal-close" onclick="document.getElementById('editInvestorModal').remove()">
                           <i class="fas fa-times"></i>
                       </div>
                   </div>
                   <div class="modal-body">
                       <form id="editInvestorForm">
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">الاسم الكامل</label>
                                   <input type="text" class="form-control" id="editInvestorName" value="${investor.name}" required>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">رقم الهاتف</label>
                                   <input type="text" class="form-control" id="editInvestorPhone" value="${investor.phone}" required>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">البريد الإلكتروني</label>
                                   <input type="email" class="form-control" id="editInvestorEmail" value="${investor.email || ''}">
                               </div>
                               <div class="form-group">
                                   <label class="form-label">تاريخ الميلاد</label>
                                   <input type="date" class="form-control" id="editInvestorBirthdate" value="${investor.birthdate || ''}">
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">العنوان</label>
                                   <input type="text" class="form-control" id="editInvestorAddress" value="${investor.address || ''}" required>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">المدينة</label>
                                   <input type="text" class="form-control" id="editInvestorCity" value="${investor.city || ''}" required>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">رقم البطاقة الشخصية</label>
                                   <input type="text" class="form-control" id="editInvestorIdCard" value="${investor.idCard || ''}" required>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">تاريخ إصدار البطاقة</label>
                                   <input type="date" class="form-control" id="editInvestorIdCardDate" value="${investor.idCardDate || ''}">
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">المهنة</label>
                                   <input type="text" class="form-control" id="editInvestorOccupation" value="${investor.occupation || ''}">
                               </div>
                               <div class="form-group">
                                   <label class="form-label">ملاحظات</label>
                                   <textarea class="form-control" id="editInvestorNotes" rows="3">${investor.notes || ''}</textarea>
                               </div>
                           </div>
                       </form>
                   </div>
                   <div class="modal-footer">
                       <button class="btn btn-light" onclick="document.getElementById('editInvestorModal').remove()">إلغاء</button>
                       <button class="btn btn-primary" onclick="updateInvestor()">حفظ التغييرات</button>
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
       }

       // Update investor
       function updateInvestor() {
           // Find investor
           const investor = investors.find(inv => inv.id === currentInvestorId);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Get form values
           const name = document.getElementById('editInvestorName').value;
           const phone = document.getElementById('editInvestorPhone').value;
           const email = document.getElementById('editInvestorEmail').value;
           const birthdate = document.getElementById('editInvestorBirthdate').value;
           const address = document.getElementById('editInvestorAddress').value;
           const city = document.getElementById('editInvestorCity').value;
           const idCard = document.getElementById('editInvestorIdCard').value;
           const idCardDate = document.getElementById('editInvestorIdCardDate').value;
           const occupation = document.getElementById('editInvestorOccupation').value;
           const notes = document.getElementById('editInvestorNotes').value;
           
           // Validate required fields
           if (!name || !phone || !address || !city || !idCard) {
               createNotification('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'danger');
               return;
           }
           
           // Update investor
           investor.name = name;
           investor.phone = phone;
           investor.email = email;
           investor.birthdate = birthdate;
           investor.address = address;
           investor.city = city;
           investor.idCard = idCard;
           investor.idCardDate = idCardDate;
           investor.occupation = occupation;
           investor.notes = notes;
           
           // Save data
           saveData();
           
           // Close modal
           document.getElementById('editInvestorModal').remove();
           
           // Refresh investors table
           loadInvestors();
           
           // Show success notification
           createNotification('نجاح', 'تم تحديث بيانات المستثمر بنجاح', 'success');
       }

       // Delete investor
       function deleteInvestor(id) {
           // Find investor
           const investor = investors.find(inv => inv.id === id);
           
           if (!investor) {
               createNotification('خطأ', 'المستثمر غير موجود', 'danger');
               return;
           }
           
           // Check if investor has active investments
           const hasActiveInvestments = investments.some(
               inv => inv.investorId === id && inv.status === 'active'
           );
           
           if (hasActiveInvestments) {
               createNotification('خطأ', 'لا يمكن حذف المستثمر لأن لديه استثمارات نشطة', 'danger');
               return;
           }
           
           // Confirm deletion
           if (!confirm('هل أنت متأكد من حذف المستثمر؟')) {
               return;
           }
           
           // Remove investor
           investors = investors.filter(inv => inv.id !== id);
           
           // Remove investor investments
           investments = investments.filter(inv => inv.investorId !== id);
           
           // Remove investor operations
           operations = operations.filter(op => op.investorId !== id);
           
           // Save data
           saveData();
           
           // Refresh investors table
           loadInvestors();
           
           // Show success notification
           createNotification('نجاح', 'تم حذف المستثمر بنجاح', 'danger');
       }

       // ============ Data Loading Functions ============
       
       // Load data from localStorage
       function loadData() {
           try {
               const storedInvestors = localStorage.getItem('investors');
               const storedInvestments = localStorage.getItem('investments');
               const storedOperations = localStorage.getItem('operations');
               const storedSettings = localStorage.getItem('settings');
               
               if (storedInvestors) {
                   investors = JSON.parse(storedInvestors);
               }
               
               if (storedInvestments) {
                   investments = JSON.parse(storedInvestments);
               }
               
               if (storedOperations) {
                   operations = JSON.parse(storedOperations);
               }
               
               if (storedSettings) {
                   settings = JSON.parse(storedSettings);
               }
           } catch (error) {
               console.error('Error loading data:', error);
               createNotification('خطأ', 'حدث خطأ أثناء تحميل البيانات', 'danger');
           }
       }

       // Save data to localStorage
       function saveData() {
           try {
               localStorage.setItem('investors', JSON.stringify(investors));
               localStorage.setItem('investments', JSON.stringify(investments));
               localStorage.setItem('operations', JSON.stringify(operations));
               localStorage.setItem('settings', JSON.stringify(settings));
           } catch (error) {
               console.error('Error saving data:', error);
               createNotification('خطأ', 'حدث خطأ أثناء حفظ البيانات', 'danger');
           }
       }

       // Update dashboard
       function updateDashboard() {
           // Calculate total investors
           document.getElementById('totalInvestors').textContent = investors.length;
           
           // Calculate total investments
           const totalInvestmentAmount = investments
               .filter(inv => inv.status === 'active')
               .reduce((total, inv) => total + inv.amount, 0);
           
           document.getElementById('totalInvestments').textContent = formatNumber(totalInvestmentAmount) + ' د.ع';
           
           // Calculate total profits
           const today = new Date();
           let totalProfits = 0;
           
           investments
               .filter(inv => inv.status === 'active')
               .forEach(inv => {
                   const profit = calculateProfit(inv.amount, inv.date, today);
                   totalProfits += profit;
               });
           
           document.getElementById('totalProfits').textContent = formatNumber(totalProfits.toFixed(2)) + ' د.ع';
           
           // Calculate total transactions
           document.getElementById('totalTransactions').textContent = operations.length;
           
           // Load recent transactions
           const recentOps = [...operations].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
           
           const tbody = document.getElementById('recentTransactionsBody');
           if (tbody) {
               tbody.innerHTML = '';
               
               recentOps.forEach(op => {
                   const investor = investors.find(inv => inv.id === op.investorId);
                   const row = document.createElement('tr');
                   
                   row.innerHTML = `
                       <td>${investor ? investor.name : 'غير معروف'}</td>
                       <td>${getOperationTypeName(op.type)}</td>
                       <td>${formatNumber(op.amount)} د.ع</td>
                       <td>${formatDate(op.date)}</td>
                       <td><span class="status ${op.status === 'pending' ? 'pending' : 'active'}">${op.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                   `;
                   
                   tbody.appendChild(row);
               });
           }
           
           // Load recent investors
           const recentInvestors = [...investors].sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate)).slice(0, 4);
           
           const investorsBody = document.getElementById('recentInvestorsBody');
           if (investorsBody) {
               investorsBody.innerHTML = '';
               
               recentInvestors.forEach(investor => {
                   // Get latest investment for this investor
                   const latestInvestment = [...investments]
                       .filter(inv => inv.investorId === investor.id)
                       .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                   
                   if (latestInvestment) {
                       const row = document.createElement('tr');
                       
                       row.innerHTML = `
                           <td>${investor.name}</td>
                           <td>${formatNumber(latestInvestment.amount)} د.ع</td>
                           <td>${formatDate(latestInvestment.date)}</td>
                       `;
                       
                       investorsBody.appendChild(row);
                   }
               });
           }
       }

       // Load investors
       function loadInvestors() {
           const tbody = document.getElementById('investorsTableBody');
           if (!tbody) return;
           
           tbody.innerHTML = '';
           
           investors.forEach((investor, index) => {
               // Calculate total investment for this investor
               const totalInvestment = investments
                   .filter(inv => inv.investorId === investor.id && inv.status === 'active')
                   .reduce((total, inv) => total + inv.amount, 0);
               
               // Calculate total profit for this investor
               const today = new Date();
               let totalProfit = 0;
               
               investments
                   .filter(inv => inv.investorId === investor.id && inv.status === 'active')
                   .forEach(inv => {
                       const profit = calculateProfit(inv.amount, inv.date, today);
                       totalProfit += profit;
                   });
               
               const row = document.createElement('tr');
               
               row.innerHTML = `
                   <td>${index + 1}</td>
                   <td>${investor.name}</td>
                   <td>${investor.phone}</td>
                   <td>${investor.address || '-'}</td>
                   <td>${investor.idCard || '-'}</td>
                   <td>${formatNumber(totalInvestment)} د.ع</td>
                   <td>${formatNumber(totalProfit.toFixed(2))} د.ع</td>
                   <td>${formatDate(investor.joinDate)}</td>
                   <td>
                       <button class="btn btn-info btn-icon action-btn" onclick="viewInvestor('${investor.id}')">
                           <i class="fas fa-eye"></i>
                       </button>
                       <button class="btn btn-warning btn-icon action-btn" onclick="editInvestor('${investor.id}')">
                           <i class="fas fa-edit"></i>
                       </button>
                       <button class="btn btn-danger btn-icon action-btn" onclick="deleteInvestor('${investor.id}')">
                           <i class="fas fa-trash"></i>
                       </button>
                   </td>
               `;
               
               tbody.appendChild(row);
           });
       }

       // Load investments
       function loadInvestments(status = 'active') {
           const tbody = document.getElementById('investmentsTableBody');
           if (!tbody) return;
           
           tbody.innerHTML = '';
           
           // Filter investments by status
           let filteredInvestments = investments;
           if (status === 'active') {
               filteredInvestments = investments.filter(inv => inv.status === 'active');
           } else if (status === 'closed') {
               filteredInvestments = investments.filter(inv => inv.status === 'closed');
           }
           
           filteredInvestments.forEach((investment, index) => {
               const investor = investors.find(inv => inv.id === investment.investorId);
               
               if (!investor) return;
               
               const monthlyProfit = calculateMonthlyProfit(investment.amount);
               
               // Calculate total profit
               const today = new Date();
               const totalProfit = investment.status === 'active' ? 
                   calculateProfit(investment.amount, investment.date, today) : 0;
               
               const row = document.createElement('tr');
               
               row.innerHTML = `
                   <td>${index + 1}</td>
                   <td>${investor.name}</td>
                   <td>${formatNumber(investment.amount)} د.ع</td>
                   <td>${formatDate(investment.date)}</td>
                   <td>${formatNumber(monthlyProfit.toFixed(2))} د.ع</td>
                   <td>${formatNumber(totalProfit.toFixed(2))} د.ع</td>
                   <td><span class="status ${investment.status === 'active' ? 'active' : 'closed'}">${investment.status === 'active' ? 'نشط' : 'مغلق'}</span></td>
                   <td>
                       <button class="btn btn-info btn-icon action-btn" onclick="viewInvestment('${investment.id}')">
                           <i class="fas fa-eye"></i>
                       </button>
                       ${investment.status === 'active' ? `
                           <button class="btn btn-warning btn-icon action-btn" onclick="openWithdrawModal('${investment.id}')">
                               <i class="fas fa-minus"></i>
                           </button>
                           <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investment.investorId}')">
                               <i class="fas fa-money-bill"></i>
                           </button>
                       ` : ''}
                   </td>
               `;
               
               tbody.appendChild(row);
           });
       }

       // Load profits
       function loadProfits() {
           const tbody = document.getElementById('profitsTableBody');
           if (!tbody) return;
           
           tbody.innerHTML = '';
           
           // Group investments by investor
           const investorProfits = {};
           
           investments.filter(inv => inv.status === 'active').forEach(investment => {
               const investorId = investment.investorId;
               
               if (!investorProfits[investorId]) {
                   investorProfits[investorId] = {
                       investments: [],
                       totalInvestment: 0,
                       totalProfit: 0,
                       paidProfit: 0,
                       dueProfit: 0
                   };
               }
               
               investorProfits[investorId].investments.push(investment);
               investorProfits[investorId].totalInvestment += investment.amount;
               
               // Calculate profit for this investment
               const today = new Date();
               const profit = calculateProfit(investment.amount, investment.date, today);
               investorProfits[investorId].totalProfit += profit;
           });
           
           // Calculate paid profit for each investor
           operations.filter(op => op.type === 'profit').forEach(operation => {
               const investorId = operation.investorId;
               
               if (investorProfits[investorId]) {
                   investorProfits[investorId].paidProfit += operation.amount;
               }
           });
           
           // Calculate due profit
           Object.keys(investorProfits).forEach(investorId => {
               investorProfits[investorId].dueProfit = Math.max(0, 
                   investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
               );
           });
           
           // Sort investors by total profit (highest first)
           const sortedInvestors = Object.keys(investorProfits).sort((a, b) => 
               investorProfits[b].totalProfit - investorProfits[a].totalProfit
           );
           
           sortedInvestors.forEach((investorId, index) => {
               const investor = investors.find(inv => inv.id === investorId);
               
               if (!investor) return;
               
               const profitData = investorProfits[investorId];
               
               const row = document.createElement('tr');
               
               row.innerHTML = `
                   <td>${index + 1}</td>
                   <td>${investor.name}</td>
                   <td>${formatNumber(profitData.totalInvestment)} د.ع</td>
                   <td>${formatDate(profitData.investments[0].date)}</td>
                   <td>${formatNumber(calculateMonthlyProfit(profitData.totalInvestment).toFixed(2))} د.ع</td>
                   <td>${formatNumber(profitData.totalProfit.toFixed(2))} د.ع</td>
                   <td>${formatNumber(profitData.paidProfit.toFixed(2))} د.ع</td>
                   <td>${formatNumber(profitData.dueProfit.toFixed(2))} د.ع</td>
                   <td>
                       <button class="btn btn-success btn-icon action-btn" onclick="openPayProfitModal('${investor.id}')">
                           <i class="fas fa-money-bill"></i>
                       </button>
                   </td>
               `;
               
               tbody.appendChild(row);
           });
       }

       // Load operations
       function loadOperations(type = 'all') {
           const tbody = document.getElementById('operationsTableBody');
           if (!tbody) return;
           
           tbody.innerHTML = '';
           
           // Filter operations by type
           let filteredOperations = operations;
           if (type === 'investments') {
               filteredOperations = operations.filter(op => op.type === 'investment');
           } else if (type === 'withdrawals') {
               filteredOperations = operations.filter(op => op.type === 'withdrawal');
           } else if (type === 'profits') {
               filteredOperations = operations.filter(op => op.type === 'profit');
           } else if (type === 'pending') {
               filteredOperations = operations.filter(op => op.status === 'pending');
           }
           
           // Sort operations by date (newest first)
           const sortedOperations = [...filteredOperations].sort((a, b) => new Date(b.date) - new Date(a.date));
           
           sortedOperations.forEach((operation) => {
               const investor = investors.find(inv => inv.id === operation.investorId);
               
               const row = document.createElement('tr');
               
               row.innerHTML = `
                   <td>${operation.id}</td>
                   <td>${investor ? investor.name : 'غير معروف'}</td>
                   <td>${getOperationTypeName(operation.type)}</td>
                   <td>${formatNumber(operation.amount)} د.ع</td>
                   <td>${formatDate(operation.date)}</td>
                   <td>${new Date(operation.date).toLocaleTimeString('ar-IQ')}</td>
                   <td><span class="status ${operation.status === 'pending' ? 'pending' : 'active'}">${operation.status === 'pending' ? 'معلق' : 'مكتمل'}</span></td>
                   <td>${operation.notes || '-'}</td>
                   <td>
                       <button class="btn btn-info btn-icon action-btn" onclick="viewOperation('${operation.id}')">
                           <i class="fas fa-eye"></i>
                       </button>
                       ${operation.status === 'pending' ? `
                           <button class="btn btn-success btn-icon action-btn" onclick="approveOperation('${operation.id}')">
                               <i class="fas fa-check"></i>
                           </button>
                           <button class="btn btn-danger btn-icon action-btn" onclick="rejectOperation('${operation.id}')">
                               <i class="fas fa-times"></i>
                           </button>
                       ` : ''}
                   </td>
               `;
               
               tbody.appendChild(row);
           });
       }

       // Load settings
       function loadSettings() {
           document.getElementById('monthlyProfitRate').value = settings.monthlyProfitRate;
           document.getElementById('companyName').value = settings.companyName;
           document.getElementById('minInvestment').value = settings.minInvestment;
           document.getElementById('profitDistributionPeriod').value = settings.profitDistributionPeriod;
           document.getElementById('profitDistributionDay').value = settings.profitDistributionDay;
           document.getElementById('earlyWithdrawalFee').value = settings.earlyWithdrawalFee;
           document.getElementById('maxPartialWithdrawal').value = settings.maxPartialWithdrawal;
           document.getElementById('currency').value = settings.currency;
       }

       // Populate report investors select
       function populateReportInvestors() {
           const select = document.getElementById('reportInvestor');
           
           if (!select) return;
           
           // Clear previous options
           select.innerHTML = '<option value="">جميع المستثمرين</option>';
           
           // Add investor options
           investors.forEach(investor => {
               const option = document.createElement('option');
               option.value = investor.id;
               option.textContent = investor.name;
               select.appendChild(option);
           });
       }

       // ============ Import/Export Functions ============
       
       // Export investors
       function exportInvestors() {
           if (investors.length === 0) {
               createNotification('تنبيه', 'لا يوجد مستثمرين للتصدير', 'warning');
               return;
           }
           
           const data = JSON.stringify(investors, null, 2);
           const blob = new Blob([data], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           const a = document.createElement('a');
           a.href = url;
           a.download = `investors_${new Date().toISOString().slice(0, 10)}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           createNotification('نجاح', 'تم تصدير المستثمرين بنجاح', 'success');
       }

       // Import investors
       function importInvestors() {
           // Create import modal
           const modal = document.createElement('div');
           modal.className = 'modal-overlay active';
           modal.id = 'importInvestorsModal';
           
           modal.innerHTML = `
               <div class="modal">
                   <div class="modal-header">
                       <h2 class="modal-title">استيراد المستثمرين</h2>
                       <div class="modal-close" onclick="document.getElementById('importInvestorsModal').remove()">
                           <i class="fas fa-times"></i>
                       </div>
                   </div>
                   <div class="modal-body">
                       <div class="alert alert-info">
                           <div class="alert-icon">
                               <i class="fas fa-info"></i>
                           </div>
                           <div class="alert-content">
                               <div class="alert-title">معلومات</div>
                               <div class="alert-text">قم بتحميل ملف JSON الذي يحتوي على بيانات المستثمرين. يجب أن يكون الملف بنفس تنسيق ملف التصدير.</div>
                           </div>
                       </div>
                       <form id="importInvestorsForm">
                           <div class="form-group">
                               <label class="form-label">ملف المستثمرين (JSON)</label>
                               <input type="file" class="form-control" id="importInvestorsFile" accept=".json" required>
                           </div>
                           <div class="form-group">
                               <div class="form-check">
                                   <input type="radio" class="form-check-input" id="importModeAppend" name="importMode" value="append" checked>
                                   <label class="form-check-label" for="importModeAppend">إضافة إلى القائمة الحالية</label>
                               </div>
                               <div class="form-check">
                                   <input type="radio" class="form-check-input" id="importModeReplace" name="importMode" value="replace">
                                   <label class="form-check-label" for="importModeReplace">استبدال القائمة الحالية</label>
                               </div>
                           </div>
                       </form>
                   </div>
                   <div class="modal-footer">
                       <button class="btn btn-light" onclick="document.getElementById('importInvestorsModal').remove()">إلغاء</button>
                       <button class="btn btn-primary" onclick="processImportInvestors()">استيراد</button>
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
       }

       // Process import investors
       function processImportInvestors() {
           const fileInput = document.getElementById('importInvestorsFile');
           const importMode = document.querySelector('input[name="importMode"]:checked').value;
           
           if (!fileInput.files.length) {
               createNotification('خطأ', 'يرجى اختيار ملف', 'danger');
               return;
           }
           
           const file = fileInput.files[0];
           const reader = new FileReader();
           
           reader.onload = function(event) {
               try {
                   const importedInvestors = JSON.parse(event.target.result);
                   
                   if (!Array.isArray(importedInvestors)) {
                       createNotification('خطأ', 'الملف المستورد غير صالح', 'danger');
                       return;
                   }
                   
                   if (importMode === 'replace') {
                       // Check if there are active investments
                       const hasActiveInvestments = investments.some(inv => inv.status === 'active');
                       
                       if (hasActiveInvestments) {
                           if (!confirm('هناك استثمارات نشطة للمستثمرين الحاليين. هل أنت متأكد من استبدال جميع المستثمرين؟')) {
                               return;
                           }
                       }
                       
                       investors = importedInvestors;
                   } else {
                       // Append mode
                       importedInvestors.forEach(investor => {
                           // Check if investor already exists
                           const existingInvestor = investors.find(inv => inv.id === investor.id);
                           
                           if (!existingInvestor) {
                               investors.push(investor);
                           }
                       });
                   }
                   
                   // Save data
                   saveData();
                   
                   // Refresh investors table
                   loadInvestors();
                   
                   // Close modal
                   document.getElementById('importInvestorsModal').remove();
                   
                   createNotification('نجاح', `تم استيراد ${importedInvestors.length} مستثمر بنجاح`, 'success');
               } catch (error) {
                   console.error('Error importing investors:', error);
                   createNotification('خطأ', 'حدث خطأ أثناء استيراد المستثمرين', 'danger');
               }
           };
           
           reader.readAsText(file);
       }

       // Export investments
       function exportInvestments() {
           if (investments.length === 0) {
               createNotification('تنبيه', 'لا يوجد استثمارات للتصدير', 'warning');
               return;
           }
           
           const data = JSON.stringify(investments, null, 2);
           const blob = new Blob([data], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           const a = document.createElement('a');
           a.href = url;
           a.download = `investments_${new Date().toISOString().slice(0, 10)}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           createNotification('نجاح', 'تم تصدير الاستثمارات بنجاح', 'success');
       }

       // Export operations
       function exportOperations() {
           if (operations.length === 0) {
               createNotification('تنبيه', 'لا يوجد عمليات للتصدير', 'warning');
               return;
           }
           
           const data = JSON.stringify(operations, null, 2);
           const blob = new Blob([data], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           const a = document.createElement('a');
           a.href = url;
           a.download = `operations_${new Date().toISOString().slice(0, 10)}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           createNotification('نجاح', 'تم تصدير العمليات بنجاح', 'success');
       }

       // Export profits
       function exportProfits() {
           // Group investments by investor
           const investorProfits = {};
           
           investments.filter(inv => inv.status === 'active').forEach(investment => {
               const investorId = investment.investorId;
               const investor = investors.find(inv => inv.id === investorId);
               
               if (!investor) return;
               
               if (!investorProfits[investorId]) {
                   investorProfits[investorId] = {
                       investor: investor.name,
                       investments: [],
                       totalInvestment: 0,
                       totalProfit: 0,
                       paidProfit: 0,
                       dueProfit: 0
                   };
               }
               
               investorProfits[investorId].investments.push(investment);
               investorProfits[investorId].totalInvestment += investment.amount;
               
               // Calculate profit for this investment
               const today = new Date();
               const profit = calculateProfit(investment.amount, investment.date, today);
               investorProfits[investorId].totalProfit += profit;
           });
           
           // Calculate paid profit for each investor
           operations.filter(op => op.type === 'profit').forEach(operation => {
               const investorId = operation.investorId;
               
               if (investorProfits[investorId]) {
                   investorProfits[investorId].paidProfit += operation.amount;
               }
           });
           
           // Calculate due profit
           Object.keys(investorProfits).forEach(investorId => {
               investorProfits[investorId].dueProfit = Math.max(0, 
                   investorProfits[investorId].totalProfit - investorProfits[investorId].paidProfit
               );
           });
           
           // Convert to array
           const profitsArray = Object.keys(investorProfits).map(investorId => ({
               ...investorProfits[investorId],
               investorId
           }));
           
           // Check if there are profits to export
           if (profitsArray.length === 0) {
               createNotification('تنبيه', 'لا يوجد أرباح للتصدير', 'warning');
               return;
           }
           
           const data = JSON.stringify(profitsArray, null, 2);
           const blob = new Blob([data], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           const a = document.createElement('a');
           a.href = url;
           a.download = `profits_${new Date().toISOString().slice(0, 10)}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           createNotification('نجاح', 'تم تصدير الأرباح بنجاح', 'success');
       }

       // Create backup
       function createBackup() {
           const data = JSON.stringify({
               investors,
               investments,
               operations,
               settings,
               backupDate: new Date().toISOString()
           }, null, 2);
           
           const blob = new Blob([data], { type: 'application/json' });
           const url = URL.createObjectURL(blob);
           
           const a = document.createElement('a');
           a.href = url;
           a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
           document.body.appendChild(a);
           a.click();
           document.body.removeChild(a);
           
           createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
       }

       // Restore backup
       function restoreBackup() {
           const fileInput = document.getElementById('restoreFile');
           
           if (!fileInput || !fileInput.files.length) {
               createNotification('خطأ', 'يرجى اختيار ملف', 'danger');
               return;
           }
           
           if (!confirm('سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد من المتابعة؟')) {
               return;
           }
           
           const file = fileInput.files[0];
           const reader = new FileReader();
           
           reader.onload = function(event) {
               try {
                   const backup = JSON.parse(event.target.result);
                   
                   if (backup.investors && backup.investments && backup.operations && backup.settings) {
                       investors = backup.investors;
                       investments = backup.investments;
                       operations = backup.operations;
                       settings = backup.settings;
                       
                       saveData();
                       
                       // Reload the current page
                       const activePage = document.querySelector('.page.active').id;
                       showPage(activePage);
                       
                       createNotification('نجاح', 'تمت استعادة النسخة الاحتياطية بنجاح', 'success');
                   } else {
                       createNotification('خطأ', 'ملف النسخة الاحتياطية غير صالح', 'danger');
                   }
               } catch (error) {
                   console.error('Error restoring backup:', error);
                   createNotification('خطأ', 'حدث خطأ أثناء استعادة النسخة الاحتياطية', 'danger');
               }
           };
           
           reader.readAsText(file);
       }

       // Download selected backup
       function downloadSelectedBackup() {
           const select = document.getElementById('previousBackups');
           
           if (!select || !select.value) {
               createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
               return;
           }
           
           // For demonstration, in a real app this would load the backup file
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Restore selected backup
       function restoreSelectedBackup() {
           const select = document.getElementById('previousBackups');
           
           if (!select || !select.value) {
               createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
               return;
           }
           
           if (!confirm('سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. هل أنت متأكد من المتابعة؟')) {
               return;
           }
           
           // For demonstration, in a real app this would restore the backup file
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Delete selected backup
       function deleteSelectedBackup() {
           const select = document.getElementById('previousBackups');
           
           if (!select || !select.value) {
               createNotification('خطأ', 'يرجى اختيار نسخة احتياطية', 'danger');
               return;
           }
           
           if (!confirm('هل أنت متأكد من حذف النسخة الاحتياطية؟')) {
               return;
           }
           
           // For demonstration, in a real app this would delete the backup file
           const option = select.options[select.selectedIndex];
           option.remove();
           
           createNotification('نجاح', 'تم حذف النسخة الاحتياطية بنجاح', 'success');
       }

       // Upload document
       function uploadDocument(investorId, type) {
           // For demonstration, in a real app this would upload the document
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // ============ Form Event Listeners ============
       function setupFormEventListeners() {
           // Investment amount input event for new investment
           const investmentAmount = document.getElementById('investmentAmount');
           if (investmentAmount) {
               investmentAmount.addEventListener('input', updateExpectedProfit);
           }
           
           // Investment date input event for new investment
           const investmentDate = document.getElementById('investmentDate');
           if (investmentDate) {
               investmentDate.addEventListener('input', updateDaysMessage);
           }
           
           // Initial investment amount input event for add investor
           const initialInvestmentAmount = document.getElementById('initialInvestmentAmount');
           if (initialInvestmentAmount) {
               initialInvestmentAmount.addEventListener('input', function() {
                   const amount = parseFloat(this.value);
                   const monthlyProfit = calculateMonthlyProfit(amount);
                   document.getElementById('initialExpectedProfit').value = 
                       formatNumber(monthlyProfit.toFixed(2)) + ' د.ع';
               });
           }
           
           // Withdraw investor select change event
           const withdrawInvestor = document.getElementById('withdrawInvestor');
           if (withdrawInvestor) {
               withdrawInvestor.addEventListener('change', populateInvestmentSelect);
           }
           
           // Withdraw investment select change event
           const withdrawInvestment = document.getElementById('withdrawInvestment');
           if (withdrawInvestment) {
               withdrawInvestment.addEventListener('change', updateAvailableAmount);
           }
           
           // Profit investor select change event
           const profitInvestor = document.getElementById('profitInvestor');
           if (profitInvestor) {
               profitInvestor.addEventListener('change', updateDueProfit);
           }
           
           // Profit period select change event
           const profitPeriod = document.getElementById('profitPeriod');
           if (profitPeriod) {
               profitPeriod.addEventListener('change', toggleCustomProfitPeriod);
           }
           
           // Add event listener for settings form
           const investmentSettingsForm = document.getElementById('investmentSettingsForm');
           if (investmentSettingsForm) {
               investmentSettingsForm.addEventListener('submit', function(e) {
                   e.preventDefault();
                   
                   // Get form values
                   const monthlyProfitRate = parseFloat(document.getElementById('monthlyProfitRate').value);
                   const minInvestment = parseFloat(document.getElementById('minInvestment').value);
                   const profitDistributionPeriod = document.getElementById('profitDistributionPeriod').value;
                   const profitDistributionDay = parseInt(document.getElementById('profitDistributionDay').value);
                   const earlyWithdrawalFee = parseFloat(document.getElementById('earlyWithdrawalFee').value);
                   const maxPartialWithdrawal = parseFloat(document.getElementById('maxPartialWithdrawal').value);
                   const currency = document.getElementById('currency').value;
                   
                   // Update settings
                   settings.monthlyProfitRate = monthlyProfitRate;
                   settings.minInvestment = minInvestment;
                   settings.profitDistributionPeriod = profitDistributionPeriod;
                   settings.profitDistributionDay = profitDistributionDay;
                   settings.earlyWithdrawalFee = earlyWithdrawalFee;
                   settings.maxPartialWithdrawal = maxPartialWithdrawal;
                   settings.currency = currency;
                   
                   // Save settings
                   saveData();
                   
                   createNotification('نجاح', 'تم حفظ الإعدادات بنجاح', 'success');
               });
           }
           
           // Add event listener for general settings form
           const generalSettingsForm = document.getElementById('generalSettingsForm');
           if (generalSettingsForm) {
               generalSettingsForm.addEventListener('submit', function(e) {
                   e.preventDefault();
                   
                   // Get form values
                   const companyName = document.getElementById('companyName').value;
                   
                   // Update settings
                   settings.companyName = companyName;
                   
                   // Save settings
                   saveData();
                   
                   createNotification('نجاح', 'تم حفظ الإعدادات بنجاح', 'success');
               });
           }
           
           // Add event listener for financial report period
           const financialReportPeriod = document.getElementById('financialReportPeriod');
           if (financialReportPeriod) {
               financialReportPeriod.addEventListener('change', function() {
                   const customDateRange = document.getElementById('customDateRange');
                   
                   if (this.value === 'custom') {
                       customDateRange.style.display = 'grid';
                   } else {
                       customDateRange.style.display = 'none';
                   }
               });
           }
       }

       // Mark all notifications as read
       function markAllAsRead() {
           // For demonstration, in a real app this would mark all notifications as read
           document.getElementById('notificationBadge').textContent = '0';
           document.getElementById('operationsBadge').textContent = '0';
           
           createNotification('نجاح', 'تم تعيين جميع الإشعارات كمقروءة', 'success');
       }

       // Logout
       function logout() {
           if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
               // For demonstration, in a real app this would log the user out
               createNotification('نجاح', 'تم تسجيل الخروج بنجاح', 'success');
               
               // Redirect to login page (in a real app)
               setTimeout(() => {
                   window.location.reload();
               }, 2000);
           }
       }

       // Calendar navigation functions
       function prevMonth() {
           // For demonstration, in a real app this would navigate to the previous month
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       function nextMonth() {
           // For demonstration, in a real app this would navigate to the next month
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Add event
       function addEvent() {
           // Create event modal
           const modal = document.createElement('div');
           modal.className = 'modal-overlay active';
           modal.id = 'addEventModal';
           
           modal.innerHTML = `
               <div class="modal">
                   <div class="modal-header">
                       <h2 class="modal-title">إضافة حدث جديد</h2>
                       <div class="modal-close" onclick="document.getElementById('addEventModal').remove()">
                           <i class="fas fa-times"></i>
                       </div>
                   </div>
                   <div class="modal-body">
                       <form id="addEventForm">
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">عنوان الحدث</label>
                                   <input type="text" class="form-control" id="eventTitle" required>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">نوع الحدث</label>
                                   <select class="form-select" id="eventType">
                                       <option value="meeting">اجتماع</option>
                                       <option value="payment">دفع أرباح</option>
                                       <option value="contract">عقد</option>
                                       <option value="other">أخرى</option>
                                   </select>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">التاريخ</label>
                                   <input type="date" class="form-control" id="eventDate" required>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">الوقت</label>
                                   <input type="time" class="form-control" id="eventTime" required>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">المستثمر (اختياري)</label>
                                   <select class="form-select" id="eventInvestor">
                                       <option value="">اختر المستثمر</option>
                                       <!-- Will be populated by JavaScript -->
                                   </select>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">الحالة</label>
                                   <select class="form-select" id="eventStatus">
                                       <option value="scheduled">مجدول</option>
                                       <option value="confirmed">مؤكد</option>
                                       <option value="completed">مكتمل</option>
                                       <option value="cancelled">ملغي</option>
                                   </select>
                               </div>
                           </div>
                           <div class="form-group">
                               <label class="form-label">ملاحظات</label>
                               <textarea class="form-control" id="eventNotes" rows="3"></textarea>
                           </div>
                       </form>
                   </div>
                   <div class="modal-footer">
                       <button class="btn btn-light" onclick="document.getElementById('addEventModal').remove()">إلغاء</button>
                       <button class="btn btn-primary" onclick="saveEvent()">حفظ الحدث</button>
                   </div>
               </div>
           `;
           
           document.body.appendChild(modal);
           
           // Populate investor select
           populateInvestorSelect('eventInvestor');
       }

       // Save event
       function saveEvent() {
           // For demonstration, in a real app this would save the event
           createNotification('نجاح', 'تم حفظ الحدث بنجاح', 'success');
           document.getElementById('addEventModal').remove();
       }

       // View event
       function viewEvent(id) {
           // For demonstration, in a real app this would show event details
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Edit event
       function editEvent(id) {
           // For demonstration, in a real app this would edit the event
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Delete event
       function deleteEvent(id) {
           // For demonstration, in a real app this would delete the event
           if (confirm('هل أنت متأكد من حذف الحدث؟')) {
               createNotification('نجاح', 'تم حذف الحدث بنجاح', 'success');
           }
       }

       // Generate income report
       function generateIncomeReport() {
           // For demonstration, in a real app this would generate a report
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // View report
       function viewReport(id) {
           // For demonstration, in a real app this would show report details
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Download report
       function downloadReport(id) {
           // For demonstration, in a real app this would download the report
           createNotification('تنبيه', 'هذه الوظيفة غير متاحة في النموذج الأولي', 'warning');
       }

       // Delete report
       function deleteReport(id) {
           // For demonstration, in a real app this would delete the report
           if (confirm('هل أنت متأكد من حذف التقرير؟')) {
               createNotification('نجاح', 'تم حذف التقرير بنجاح', 'success');
           }
       }

       // Save report
       function saveReport() {
           // For demonstration, in a real app this would save the report
           createNotification('نجاح', 'تم حفظ التقرير بنجاح', 'success');
           closeReport();
       }

       // Close report
       function closeReport() {
           document.getElementById('reportResult').style.display = 'none';
       }

       // ============ Sample Data ============
       
       // Create sample data for demonstration
       function createSampleData() {
           // Create sample investors
           const investor1 = {
               id: 'inv1',
               name: 'أحمد محمد',
               phone: '07701234567',
               email: 'ahmed@example.com',
               address: 'الحلة، بابل',
               city: 'الحلة',
               idCard: 'A12345678',
               occupation: 'مهندس',
               joinDate: '2025-01-01T00:00:00.000Z'
           };
           
           const investor2 = {
               id: 'inv2',
               name: 'سارة أحمد',
               phone: '07709876543',
               email: 'sara@example.com',
               address: 'بغداد',
               city: 'بغداد',
               idCard: 'B87654321',
               occupation: 'طبيبة',
               joinDate: '2025-01-15T00:00:00.000Z'
           };
           
           const investor3 = {
               id: 'inv3',
               name: 'محمد علي',
               phone: '07712345678',
               email: 'ali@example.com',
               address: 'النجف',
               city: 'النجف',
               idCard: 'C23456789',
               occupation: 'محامي',
               joinDate: '2025-02-01T00:00:00.000Z'
           };
           
           investors.push(investor1, investor2, investor3);
           
           // Create sample investments
           const investment1 = {
               id: 'inv1_1',
               investorId: 'inv1',
               amount: 15000000,
               date: '2025-01-01T00:00:00.000Z',
               method: 'cash',
               status: 'active'
           };
           
           const investment2 = {
               id: 'inv2_1',
               investorId: 'inv2',
               amount: 10000000,
               date: '2025-01-15T00:00:00.000Z',
               method: 'transfer',
               status: 'active'
           };
           
           const investment3 = {
               id: 'inv3_1',
               investorId: 'inv3',
               amount: 25000000,
               date: '2025-02-01T00:00:00.000Z',
               method: 'check',
               status: 'active'
           };
           
           investments.push(investment1, investment2, investment3);
           
           // Create sample operations
           const operation1 = {
               id: 'OP-2025-001',
               investorId: 'inv1',
               type: 'investment',
               amount: 15000000,
               date: '2025-01-01T10:30:45.000Z',
               investmentId: 'inv1_1',
               notes: 'استثمار جديد',
               status: 'active'
           };
           
           const operation2 = {
               id: 'OP-2025-002',
               investorId: 'inv2',
               type: 'investment',
               amount: 10000000,
               date: '2025-01-15T11:45:22.000Z',
               investmentId: 'inv2_1',
               notes: 'استثمار جديد',
               status: 'active'
           };
           
           const operation3 = {
               id: 'OP-2025-003',
               investorId: 'inv3',
               type: 'investment',
               amount: 25000000,
               date: '2025-02-01T09:15:10.000Z',
               investmentId: 'inv3_1',
               notes: 'استثمار جديد',
               status: 'active'
           };
           
           const operation4 = {
               id: 'OP-2025-004',
               investorId: 'inv1',
               type: 'profit',
               amount: 262500,
               date: '2025-02-01T14:22:30.000Z',
               notes: 'دفع الأرباح الشهرية',
               status: 'active'
           };
           
           const operation5 = {
               id: 'OP-2025-005',
               investorId: 'inv2',
               type: 'profit',
               amount: 175000,
               date: '2025-02-15T10:05:15.000Z',
               notes: 'دفع الأرباح الشهرية',
               status: 'active'
           };
           
           const operation6 = {
               id: 'OP-2025-006',
               investorId: 'inv3',
               type: 'withdrawal',
               amount: 5000000,
               date: '2025-05-01T09:30:00.000Z',
               investmentId: 'inv3_1',
               notes: 'سحب جزئي بطلب من المستثمر',
               status: 'pending'
           };
           
           operations.push(operation1, operation2, operation3, operation4, operation5, operation6);
           
           // Save data
           saveData();
       }

       // ============ Initialization ============
       function initializeApp() {
           // Load data from localStorage
           loadData();
           
           // Setup form event listeners
           setupFormEventListeners();
           
           // Show dashboard
           showPage('dashboard');
           
           // Set default date inputs to today
           const dateInputs = document.querySelectorAll('input[type="date"]');
           const today = new Date().toISOString().slice(0, 10);
           
           dateInputs.forEach(input => {
               if (input.value === '') {
                   input.value = today;
               }
           });
           
           // Check if first run
           if (investors.length === 0 && !localStorage.getItem('firstRun')) {
               // Add sample data
               createSampleData();
               localStorage.setItem('firstRun', 'true');
           }
       }

       // Initialize the app when the document is loaded
       document.addEventListener('DOMContentLoaded', initializeApp);


       // تبديل المزامنة
function toggleSync(enabled) {
    if (enabled) {
        document.getElementById('connectionInfo').style.display = 'block';
        
        // التحقق مما إذا كان المستخدم متصلاً
        if (window.currentUser) {
            document.getElementById('signOutButton').style.display = 'block';
            window.firebaseApp.enableSync();
        } else {
            // تعطيل المزامنة إذا لم يكن المستخدم متصلاً
            document.getElementById('syncEnabled').checked = false;
        }
    } else {
        document.getElementById('connectionInfo').style.display = 'none';
        window.firebaseApp.disableSync();
    }
}

// إنشاء نسخة احتياطية من صفحة الإعدادات
function createFirebaseBackupFromSettings() {
    if (!window.currentUser) {
        createNotification('خطأ', 'يرجى تسجيل الدخول أولاً', 'danger');
        return;
    }
    
    // طلب اسم النسخة الاحتياطية
    const backupName = prompt('أدخل اسم النسخة الاحتياطية (اختياري):', '');
    
    // إنشاء النسخة الاحتياطية
    window.firebaseApp.createFirebaseBackup(backupName).then(success => {
        if (success) {
            createNotification('نجاح', 'تم إنشاء نسخة احتياطية بنجاح', 'success');
        } else {
            createNotification('خطأ', 'فشل إنشاء النسخة الاحتياطية', 'danger');
        }
    }).catch(error => {
        createNotification('خطأ', 'حدث خطأ أثناء إنشاء النسخة الاحتياطية: ' + error.message, 'danger');
    });
}

// حفظ إعدادات المزامنة
function saveSyncSettings() {
    const syncEnabled = document.getElementById('syncEnabled').checked;
    const autoBackupEnabled = document.getElementById('autoBackupEnabled').checked;
    const autoBackupFrequency = document.getElementById('autoBackupFrequency').value;
    const activityLoggingEnabled = document.getElementById('activityLoggingEnabled').checked;
    
    // حفظ الإعدادات في localStorage
    localStorage.setItem('autoBackupEnabled', autoBackupEnabled);
    localStorage.setItem('autoBackupFrequency', autoBackupFrequency);
    localStorage.setItem('activityLoggingEnabled', activityLoggingEnabled);
    
    // تفعيل أو تعطيل المزامنة
    if (syncEnabled) {
        if (window.currentUser) {
            window.firebaseApp.enableSync();
        } else {
            document.getElementById('syncEnabled').checked = false;
            createNotification('خطأ', 'يرجى تسجيل الدخول لتفعيل المزامنة', 'danger');
            return;
        }
    } else {
        window.firebaseApp.disableSync();
    }
    
    // عرض رسالة نجاح
    createNotification('نجاح', 'تم حفظ إعدادات المزامنة بنجاح', 'success');
}

// تحديث حالة إعدادات المزامنة عند تحميل الصفحة
function updateSyncSettingsStatus() {
    // تحميل الإعدادات من localStorage
    const syncEnabled = localStorage.getItem('syncEnabled') === 'true';
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    const autoBackupFrequency = localStorage.getItem('autoBackupFrequency') || 'weekly';
    const activityLoggingEnabled = localStorage.getItem('activityLoggingEnabled') !== 'false';
    
    // تحديث عناصر الواجهة
    document.getElementById('syncEnabled').checked = syncEnabled;
    document.getElementById('autoBackupEnabled').checked = autoBackupEnabled;
    document.getElementById('autoBackupFrequency').value = autoBackupFrequency;
    document.getElementById('activityLoggingEnabled').checked = activityLoggingEnabled;
    
    // عرض أو إخفاء معلومات الاتصال
    if (syncEnabled) {
        document.getElementById('connectionInfo').style.display = 'block';
        
        // التحقق مما إذا كان المستخدم متصلاً
        if (window.currentUser) {
            document.getElementById('signOutButton').style.display = 'block';
            
            // تحديث معلومات الاتصال
            const connectionAlert = document.querySelector('#connectionInfo .alert');
            connectionAlert.className = 'alert alert-success';
            connectionAlert.querySelector('.alert-icon i').className = 'fas fa-check-circle';
            connectionAlert.querySelector('.alert-title').textContent = 'متصل';
            connectionAlert.querySelector('.alert-text').textContent = 'البريد الإلكتروني: ' + window.currentUser.email;
        }
    } else {
        document.getElementById('connectionInfo').style.display = 'none';
    }
}

// إضافة الوظيفة لتحديث حالة إعدادات المزامنة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تسجيل دالة تحديث حالة إعدادات المزامنة
    const originalShowPage = window.showPage;
    
    if (originalShowPage) {
        window.showPage = function(pageId) {
            // استدعاء الدالة الأصلية
            originalShowPage(pageId);
            
            // تحديث حالة إعدادات المزامنة إذا كانت الصفحة هي الإعدادات
            if (pageId === 'settings') {
                // تأخير قليل لضمان تحميل الصفحة
                setTimeout(updateSyncSettingsStatus, 100);
            }
        };
    }
});