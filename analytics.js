// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAd_Uwwp2X1mI8Zx5UuFKHy8ksp53wGMt0",
    authDomain: "damour-tracker-app.firebaseapp.com",
    projectId: "damour-tracker-app",
    storageBucket: "damour-tracker-app.firebasestorage.app",
    messagingSenderId: "1026524539942",
    appId: "1:1026524539942:web:7c155b85a34d13fc5e8ae7"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let incomeExpenseChart = null;
let categoryPieChart = null;

// Authentication Check
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        displayUserInfo(user);
        loadAnalytics();
    } else {
        window.location.href = 'index.html';
    }
});

function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.displayName || 'User';
    document.getElementById('userEmail').textContent = user.email;
    const initials = user.displayName 
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : user.email[0].toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        if (page) window.location.href = page;
    });
});

// Mobile menu
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.classList.remove('menu-open');
});

// Sign Out
document.getElementById('signOutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
});

// Load Analytics
async function loadAnalytics() {
    try {
        const transactions = await loadTransactions();
        const categories = await loadCategories();
        
        calculateYTDStats(transactions);
        calculateTopCategory(transactions, categories);
        createIncomeExpenseChart(transactions);
        createCategoryPieChart(transactions, categories);
        calculateSummary(transactions);
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Load Transactions
async function loadTransactions() {
    const snapshot = await db.collection('transactions')
        .where('userId', '==', currentUser.uid)
        .get();
    
    const transactions = [];
    snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
}

// Load Categories
async function loadCategories() {
    const snapshot = await db.collection('categories')
        .where('userId', '==', currentUser.uid)
        .get();
    
    const categories = {};
    snapshot.forEach(doc => {
        categories[doc.id] = doc.data();
    });
    return categories;
}

// Calculate YTD Stats
function calculateYTDStats(transactions) {
    const currentYear = new Date().getFullYear();
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        const date = t.date.toDate();
        if (date.getFullYear() === currentYear) {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        }
    });

    document.getElementById('totalIncomeYTD').textContent = `$${totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('totalExpenseYTD').textContent = `$${totalExpense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// Calculate Top Category
function calculateTopCategory(transactions, categories) {
    const categoryTotals = {};
    
    transactions.forEach(t => {
        if (t.type === 'expense') {
            const categoryId = t.categoryId;
            const amount = parseFloat(t.amount);
            categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + amount;
        }
    });

    let topCategoryId = null;
    let maxAmount = 0;

    Object.entries(categoryTotals).forEach(([catId, amount]) => {
        if (amount > maxAmount) {
            maxAmount = amount;
            topCategoryId = catId;
        }
    });

    if (topCategoryId && categories[topCategoryId]) {
        document.getElementById('topCategory').textContent = `$${maxAmount.toFixed(2)}`;
        document.getElementById('topCategoryName').textContent = categories[topCategoryId].name;
    } else {
        document.getElementById('topCategory').textContent = '$0.00';
        document.getElementById('topCategoryName').textContent = 'No expenses yet';
    }
}

// Create Income vs Expense Chart
function createIncomeExpenseChart(transactions) {
    const monthlyData = {};
    
    // Initialize last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.push(key);
        monthlyData[key] = { income: 0, expense: 0 };
    }

    // Aggregate data
    transactions.forEach(t => {
        const date = t.date.toDate();
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[key]) {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                monthlyData[key].income += amount;
            } else {
                monthlyData[key].expense += amount;
            }
        }
    });

    const labels = months.map(m => {
        const [year, month] = m.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[parseInt(month) - 1];
    });

    const incomeData = months.map(m => monthlyData[m].income);
    const expenseData = months.map(m => monthlyData[m].expense);

    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderColor: '#ef4444',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Create Category Pie Chart
function createCategoryPieChart(transactions, categories) {
    const categoryTotals = {};
    
    transactions.forEach(t => {
        if (t.type === 'expense') {
            const categoryId = t.categoryId;
            const amount = parseFloat(t.amount);
            categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + amount;
        }
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Top 5 categories

    const labels = sortedCategories.map(([catId]) => 
        categories[catId] ? categories[catId].name : 'Unknown'
    );
    const data = sortedCategories.map(([, amount]) => amount);
    const colors = sortedCategories.map(([catId]) => 
        categories[catId] ? categories[catId].color : '#6b7280'
    );

    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    
    if (categoryPieChart) {
        categoryPieChart.destroy();
    }

    categoryPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Create custom legend
    const legendContainer = document.getElementById('categoryLegend');
    legendContainer.innerHTML = sortedCategories.map(([catId, amount]) => {
        const categoryName = categories[catId] ? categories[catId].name : 'Unknown';
        const color = categories[catId] ? categories[catId].color : '#6b7280';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color};"></div>
                    <span style="font-size: 14px; color: #374151;">${categoryName}</span>
                </div>
                <span style="font-weight: 600; color: #111827;">$${amount.toFixed(2)}</span>
            </div>
        `;
    }).join('');
}

// Calculate Summary
function calculateSummary(transactions) {
    const monthlyData = {};
    
    transactions.forEach(t => {
        const date = t.date.toDate();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyData[key]) {
            monthlyData[key] = { income: 0, expense: 0 };
        }
        
        const amount = parseFloat(t.amount);
        if (t.type === 'income') {
            monthlyData[key].income += amount;
        } else {
            monthlyData[key].expense += amount;
        }
    });

    const months = Object.values(monthlyData);
    const monthCount = months.length || 1;

    let totalIncome = 0;
    let totalExpense = 0;

    months.forEach(m => {
        totalIncome += m.income;
        totalExpense += m.expense;
    });

    const avgMonthlyIncome = totalIncome / monthCount;
    const avgMonthlyExpense = totalExpense / monthCount;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;

    document.getElementById('savingsRate').textContent = `${Math.round(savingsRate)}%`;
    document.getElementById('avgMonthlyExpense').textContent = `$${avgMonthlyExpense.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('avgMonthlyIncome').textContent = `$${avgMonthlyIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}