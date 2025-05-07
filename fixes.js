/**
 * fixes.js
 * This file implements missing functions and fixes in the investment management system
 */

// Fix for the showPage function - Add null checks before accessing classList
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        if (page) page.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) selectedPage.classList.add('active');
    
    // Mark the current menu item as active
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item) item.classList.remove('active');
    });
    
    const menuItem = document.querySelector(`.menu-item[href="#${pageId}"]`);
    if (menuItem) menuItem.classList.add('active');
    
    // Update the page content if needed
    switch (pageId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'investors':
            loadInvestors();
            break;
        case 'investments':
            loadInvestments();
            break;
        case 'profits':
            loadProfits();
            break;
        case 'operations':
            loadOperations();
            break;
        case 'reports':
            if (typeof populateReportInvestors === 'function') {
                populateReportInvestors();
            }
            loadReports();
            break;
        case 'financial':
            if (typeof loadFinancialData === 'function') {
                loadFinancialData();
            } else {
                // Implement the missing loadFinancialData function
                window.loadFinancialData = loadFinancialData;
            }
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'settings':
            loadSettings();
            break;
        case 'analytics':
            if (typeof loadAnalytics === 'function') {
                loadAnalytics();
            } else {
                // Implement the missing loadAnalytics function
                window.loadAnalytics = loadAnalytics;
            }
            break;
    }
};

/**
 * Populate investor select dropdown for reports
 */
function populateReportInvestors() {
    const select = document.getElementById('reportInvestor');
    if (!select) return;
    
    // Clear previous options
    select.innerHTML = '<option value="">جميع المستثمرين</option>';
    
    // Sort investors by name
    const sortedInvestors = [...investors].sort((a, b) => a.name.localeCompare(b.name));
    
    // Add investor options
    sortedInvestors.forEach(investor => {
        const option = document.createElement('option');
        option.value = investor.id;
        option.textContent = investor.name;
        select.appendChild(option);
    });
    
    console.log('Report investors populated successfully');
}

/**
 * Load analytics data and populate charts
 */
function loadAnalytics() {
    console.log('Loading analytics data...');
    
    // Update overview cards
    updateAnalyticsOverviewCards();
    
    // Load charts for the active tab
    const activeTab = document.querySelector('#analytics .tab.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadAnalyticsForTab(tabId);
    } else {
        // Default to overview tab
        loadAnalyticsForTab('overview');
    }
}

/**
 * Update analytics overview cards
 */
function updateAnalyticsOverviewCards() {
    // Monthly growth rate
    const monthlyGrowthRate = document.getElementById('monthlyGrowthRate');
    if (monthlyGrowthRate) {
        // Calculate average monthly growth
        const growthRate = calculateMonthlyGrowthRate();
        monthlyGrowthRate.textContent = growthRate.toFixed(2) + '%';
    }
    
    // Average investment
    const averageInvestment = document.getElementById('averageInvestment');
    if (averageInvestment && investments.length > 0) {
        const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const average = totalAmount / investments.length;
        averageInvestment.textContent = formatCurrency(average.toFixed(0));
    }
    
    // Retention rate
    const retentionRate = document.getElementById('retentionRate');
    if (retentionRate && investments.length > 0) {
        const activeInvestments = investments.filter(inv => inv.status === 'active').length;
        const rate = (activeInvestments / investments.length) * 100;
        retentionRate.textContent = rate.toFixed(2) + '%';
    }
    
    // Total return
    const totalReturn = document.getElementById('totalReturn');
    if (totalReturn) {
        // Calculate total profits
        const today = new Date();
        let totalProfit = 0;
        
        investments
            .filter(inv => inv.status === 'active')
            .forEach(inv => {
                const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
                totalProfit += profit;
            });
        
        totalReturn.textContent = formatCurrency(totalProfit.toFixed(2));
    }
}

/**
 * Calculate monthly growth rate based on investments
 * @returns {number} Growth rate percentage
 */
function calculateMonthlyGrowthRate() {
    // Group investments by month
    const investmentsByMonth = {};
    
    investments.forEach(inv => {
        const date = new Date(inv.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!investmentsByMonth[monthKey]) {
            investmentsByMonth[monthKey] = 0;
        }
        
        investmentsByMonth[monthKey] += inv.amount;
    });
    
    // Convert to array and sort by date
    const monthlyData = Object.keys(investmentsByMonth).map(key => {
        const [year, month] = key.split('-').map(Number);
        return {
            date: new Date(year, month - 1, 1),
            amount: investmentsByMonth[key]
        };
    }).sort((a, b) => a.date - b.date);
    
    // Calculate average growth rate
    let totalGrowth = 0;
    let monthCount = 0;
    
    for (let i = 1; i < monthlyData.length; i++) {
        const prevMonth = monthlyData[i - 1].amount;
        const currentMonth = monthlyData[i].amount;
        
        if (prevMonth > 0) {
            const growthRate = ((currentMonth - prevMonth) / prevMonth) * 100;
            totalGrowth += growthRate;
            monthCount++;
        }
    }
    
    return monthCount > 0 ? totalGrowth / monthCount : 0;
}

/**
 * Load analytics data for a specific tab
 * @param {string} tabId - The tab ID to load data for
 */
function loadAnalyticsForTab(tabId) {
    console.log(`Loading analytics for tab: ${tabId}`);
    
    switch (tabId) {
        case 'overview':
            loadPerformanceChart();
            break;
        case 'investments':
            loadInvestmentsDistributionChart();
            loadInvestmentsStats();
            break;
        case 'profits':
            loadProfitsGrowthChart();
            loadTopInvestorsProfits();
            break;
        case 'investors':
            loadInvestorsGrowthChart();
            loadInvestorsByCity();
            loadInvestorsByOccupation();
            break;
        case 'trends':
            loadGrowthTrendsChart();
            loadFuturePredictions();
            break;
    }
}

/**
 * Load performance chart for analytics overview
 */
function loadPerformanceChart() {
    const chartData = generateChartData('monthly');
    
    // Create config with growth rate data
    const growthRateData = [];
    
    for (let i = 1; i < chartData.length; i++) {
        const prevTotal = chartData[i-1].investments;
        const currentTotal = chartData[i].investments;
        const growthRate = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
        growthRateData.push(growthRate);
    }
    
    // Prepend with 0 for the first month
    growthRateData.unshift(0);
    
    const config = {
        type: 'line',
        datasets: [
            {
                label: 'معدل النمو',
                data: growthRateData,
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'إجمالي الاستثمارات',
                data: chartData.map(d => d.investments),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: true
            },
            {
                label: 'إجمالي الأرباح',
                data: chartData.map(d => d.profits),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 2,
                fill: true
            }
        ]
    };
    
    // Load chart if the function exists
    if (typeof loadChart === 'function') {
        loadChart('performanceChart', chartData, config);
    } else {
        console.error("loadChart function not defined");
    }
}

/**
 * Load investments distribution chart
 */
function loadInvestmentsDistributionChart() {
    // This function would create a pie chart for investments distribution
    console.log("loadInvestmentsDistributionChart not fully implemented");
}

/**
 * Load investments statistics table
 */
function loadInvestmentsStats() {
    const tbody = document.getElementById('investmentsStatsTableBody');
    if (!tbody) return;
    
    // Clear the table
    tbody.innerHTML = '';
    
    // Define investment categories based on amount
    const categories = [
        { name: 'صغير', min: 0, max: 5000000 },
        { name: 'متوسط', min: 5000000, max: 20000000 },
        { name: 'كبير', min: 20000000, max: Infinity }
    ];
    
    // Calculate statistics for each category
    const stats = categories.map(category => {
        const categoryInvestments = investments.filter(inv => 
            inv.amount >= category.min && inv.amount < category.max
        );
        
        const count = categoryInvestments.length;
        const totalAmount = categoryInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        const avgAmount = count > 0 ? totalAmount / count : 0;
        
        return {
            category: category.name,
            count,
            totalAmount,
            avgAmount
        };
    });
    
    // Calculate total for percentage
    const totalInvestmentAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Add rows to table
    stats.forEach(stat => {
        const row = document.createElement('tr');
        const percentage = totalInvestmentAmount > 0 ? (stat.totalAmount / totalInvestmentAmount * 100).toFixed(2) : 0;
        
        row.innerHTML = `
            <td>${stat.category}</td>
            <td>${stat.count}</td>
            <td>${formatCurrency(stat.totalAmount)}</td>
            <td>${formatCurrency(stat.avgAmount.toFixed(0))}</td>
            <td>${percentage}%</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Load other analytics chart and table functions
 * These functions would be implemented in a similar way
 */
function loadProfitsGrowthChart() {
    console.log("loadProfitsGrowthChart not fully implemented");
}

function loadTopInvestorsProfits() {
    console.log("loadTopInvestorsProfits not fully implemented");
}

function loadInvestorsGrowthChart() {
    console.log("loadInvestorsGrowthChart not fully implemented");
}

function loadInvestorsByCity() {
    console.log("loadInvestorsByCity not fully implemented");
}

function loadInvestorsByOccupation() {
    console.log("loadInvestorsByOccupation not fully implemented");
}

function loadGrowthTrendsChart() {
    console.log("loadGrowthTrendsChart not fully implemented");
}

function loadFuturePredictions() {
    console.log("loadFuturePredictions not fully implemented");
}

/**
 * Load financial data and update financial page
 */
function loadFinancialData() {
    console.log('Loading financial data...');
    
    // Update financial cards
    updateFinancialCards();
    
    // Load financial chart
    loadFinancialChart();
    
    // Load income table
    loadIncomeTable();
    
    // Load active tab content
    const activeTab = document.querySelector('#financial .tab.active');
    if (activeTab) {
        const tabId = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        loadFinancialForTab(tabId);
    } else {
        // Default to summary tab
        loadFinancialForTab('summary');
    }
}

/**
 * Update financial cards with current data
 */
function updateFinancialCards() {
    // Calculate total income (total investments)
    const totalIncome = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalIncomeElement = document.getElementById('totalIncome');
    if (totalIncomeElement) {
        totalIncomeElement.textContent = formatCurrency(totalIncome);
    }
    
    // Calculate total expenses (30% of profits as a placeholder)
    const today = new Date();
    let totalProfit = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfit += profit;
        });
    
    const totalExpenses = totalProfit * 0.3; // Assuming 30% expenses
    const totalExpensesElement = document.getElementById('totalExpenses');
    if (totalExpensesElement) {
        totalExpensesElement.textContent = formatCurrency(totalExpenses.toFixed(2));
    }
    
    // Calculate net profit
    const netProfit = totalProfit - totalExpenses;
    const netProfitElement = document.getElementById('netProfit');
    if (netProfitElement) {
        netProfitElement.textContent = formatCurrency(netProfit.toFixed(2));
    }
    
    // Calculate current balance
    const totalWithdrawals = operations
        .filter(op => op.type === 'withdrawal' && op.status === 'active')
        .reduce((sum, op) => sum + op.amount, 0);
    
    const currentBalance = totalIncome - totalWithdrawals;
    const currentBalanceElement = document.getElementById('currentBalance');
    if (currentBalanceElement) {
        currentBalanceElement.textContent = formatCurrency(currentBalance);
    }
}

/**
 * Load financial chart
 */
function loadFinancialChart() {
    const chartData = generateChartData('monthly');
    
    // Create config with financial data
    const config = {
        type: 'bar',
        datasets: [
            {
                label: 'الإيرادات',
                data: chartData.map(d => d.investments),
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: '#3498db',
                borderWidth: 1
            },
            {
                label: 'المصروفات',
                data: chartData.map(d => d.profits * 0.3), // 30% of profits as expenses
                backgroundColor: 'rgba(231, 76, 60, 0.6)',
                borderColor: '#e74c3c',
                borderWidth: 1
            },
            {
                label: 'صافي الربح',
                data: chartData.map(d => d.profits * 0.7), // 70% of profits as net
                backgroundColor: 'rgba(46, 204, 113, 0.6)',
                borderColor: '#2ecc71',
                borderWidth: 1
            }
        ]
    };
    
    // Load chart if the function exists
    if (typeof loadChart === 'function') {
        loadChart('financialChart', chartData, config);
    } else {
        console.error("loadChart function not defined");
    }
}

/**
 * Load income table
 */
function loadIncomeTable() {
    const tbody = document.getElementById('incomeTableBody');
    if (!tbody) return;
    
    // Clear the table
    tbody.innerHTML = '';
    
    // Calculate total investments
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0);
    
    // Calculate total withdrawals
    const totalWithdrawals = operations
        .filter(op => op.type === 'withdrawal' && op.status === 'active')
        .reduce((sum, op) => sum + op.amount, 0);
    
    // Calculate total profits
    const today = new Date();
    let totalProfit = 0;
    
    investments
        .filter(inv => inv.status === 'active')
        .forEach(inv => {
            const profit = calculateProfit(inv.amount, inv.date, today.toISOString());
            totalProfit += profit;
        });
    
    // Calculate profit payments
    const totalPaidProfit = operations
        .filter(op => op.type === 'profit' && op.status === 'active')
        .reduce((sum, op) => sum + op.amount, 0);
    
    // Net income
    const netIncome = totalInvestments - totalWithdrawals + totalProfit - totalPaidProfit;
    
    // Add rows to table
    tbody.innerHTML = `
        <tr>
            <td>إجمالي الاستثمارات</td>
            <td>${formatCurrency(totalInvestments)}</td>
            <td><span class="status active">+</span></td>
        </tr>
        <tr>
            <td>إجمالي السحوبات</td>
            <td>${formatCurrency(totalWithdrawals)}</td>
            <td><span class="status pending">-</span></td>
        </tr>
        <tr>
            <td>إجمالي الأرباح</td>
            <td>${formatCurrency(totalProfit.toFixed(2))}</td>
            <td><span class="status active">+</span></td>
        </tr>
        <tr>
            <td>الأرباح المدفوعة</td>
            <td>${formatCurrency(totalPaidProfit.toFixed(2))}</td>
            <td><span class="status pending">-</span></td>
        </tr>
        <tr>
            <td><strong>صافي الدخل</strong></td>
            <td><strong>${formatCurrency(netIncome.toFixed(2))}</strong></td>
            <td></td>
        </tr>
    `;
}

/**
 * Load financial data for a specific tab
 * @param {string} tabId - The tab ID to load data for
 */
function loadFinancialForTab(tabId) {
    console.log(`Loading financial data for tab: ${tabId}`);
    
    switch (tabId) {
        case 'summary':
            // Already loaded in loadFinancialData
            break;
        case 'income':
            loadIncomeReport();
            break;
        case 'cashflow':
            loadCashflowReport();
            break;
        case 'projections':
            loadFinancialProjections();
            break;
    }
}

/**
 * Load income report
 */
function loadIncomeReport() {
    console.log("loadIncomeReport not fully implemented");
}

/**
 * Load cashflow report
 */
function loadCashflowReport() {
    console.log("loadCashflowReport not fully implemented");
}

/**
 * Load financial projections
 */
function loadFinancialProjections() {
    console.log("loadFinancialProjections not fully implemented");
}

// Assign functions to window object
window.populateReportInvestors = populateReportInvestors;
window.loadAnalytics = loadAnalytics;
window.loadFinancialData = loadFinancialData;
window.loadAnalyticsForTab = loadAnalyticsForTab;
window.loadFinancialForTab = loadFinancialForTab;

// Log that fixes have been applied
console.log('Investment system fixes applied successfully');