// ---------------------
// Firebase Configuration
// ---------------------
const firebaseConfig = {
    apiKey: "AIzaSyAd_Uwwp2X1mI8Zx5UuFKHy8ksp53wGMt0",
    authDomain: "damour-tracker-app.firebaseapp.com",
    projectId: "damour-tracker-app",
    storageBucket: "damour-tracker-app.firebasestorage.app",
    messagingSenderId: "1026524539942",
    appId: "1:1026524539942:web:7c155b85a34d13fc5e8ae7"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let balanceChart = null;

// ---------------------
// Authentication Check
// ---------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        displayUserInfo(user);
        loadDashboardData();
    } else {
        console.log('No user logged in, redirecting...');
        window.location.href = 'index.html';
    }
});

// ---------------------
// Display User Info
// ---------------------
function displayUserInfo(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');

    userName.textContent = user.displayName || 'User';
    userEmail.textContent = user.email;
    
    const initials = user.displayName 
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : user.email[0].toUpperCase();
    userAvatar.textContent = initials;
}

// ---------------------
// Navigation
// ---------------------
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        if (page) {
            window.location.href = page;
        }
    });
});

// Mobile menu toggle
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
            console.log('User signed out');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
    }
});

// User Avatar Click - Show Logout Modal
const userAvatar = document.getElementById('userAvatar');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogout');
const confirmLogoutBtn = document.getElementById('confirmLogout');

if (userAvatar) {
    userAvatar.addEventListener('click', () => {
        logoutModal.classList.add('active');
    });
}

if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
        logoutModal.classList.remove('active');
    });
}

if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        });
    });
}

// Close logout modal when clicking outside
logoutModal.addEventListener('click', (e) => {
    if (e.target === logoutModal) {
        logoutModal.classList.remove('active');
    }
});

// ---------------------
// Load Dashboard Data
// ---------------------
async function loadDashboardData() {
    try {
        // Load all data - similar to analytics.js approach
        const transactions = await loadTransactions();
        const categories = await loadCategories();
        
        // Now use the loaded data for all operations
        await populateCategoryDropdown(categories);
        displayRecentTransactions(transactions, categories);
        calculateStats(transactions);
        loadBalanceChart(transactions);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load ALL Transactions (not limited)
async function loadTransactions() {
    const snapshot = await db.collection('transactions')
        .where('userId', '==', currentUser.uid)
        .get();
    
    const transactions = [];
    snapshot.forEach(doc => {
        transactions.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by date descending (most recent first)
    transactions.sort((a, b) => b.date.toDate() - a.date.toDate());
    
    return transactions;
}

// Load Categories
async function loadCategories() {
    const snapshot = await db.collection('categories')
        .where('userId', '==', currentUser.uid)
        .get();
    
    const categories = {};
    snapshot.forEach(doc => {
        categories[doc.id] = { id: doc.id, ...doc.data() };
    });
    return categories;
}

// Populate Category Dropdown
async function populateCategoryDropdown(categories) {
    const categorySelect = document.getElementById('category');
    categorySelect.innerHTML = '<option value="">Select category</option>';

    Object.entries(categories).forEach(([id, category]) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = category.name;
        option.setAttribute('data-type', category.type);
        categorySelect.appendChild(option);
    });

    // Filter categories based on transaction type
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', filterCategoriesByType);
    });
    filterCategoriesByType();
}

function filterCategoriesByType() {
    const selectedType = document.querySelector('input[name="type"]:checked').value;
    const categorySelect = document.getElementById('category');
    const options = categorySelect.querySelectorAll('option');

    options.forEach(option => {
        if (option.value === '') {
            option.style.display = 'block';
            return;
        }
        const optionType = option.getAttribute('data-type');
        option.style.display = optionType === selectedType ? 'block' : 'none';
    });

    // Reset selection if current selection doesn't match type
    if (categorySelect.value) {
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        const selectedOptionType = selectedOption.getAttribute('data-type');
        if (selectedOptionType !== selectedType) {
            categorySelect.value = '';
        }
    }
}

// Display Recent Transactions (top 5)
function displayRecentTransactions(transactions, categories) {
    const transactionsList = document.getElementById('recentTransactionsList');
    
    if (transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p>No transactions yet. Add your first transaction!</p>
            </div>
        `;
        return;
    }

    transactionsList.innerHTML = '';

    // Take only the first 5 transactions (already sorted by date desc)
    const recentTransactions = transactions.slice(0, 5);

    recentTransactions.forEach(transaction => {
        const categoryName = categories[transaction.categoryId] 
            ? categories[transaction.categoryId].name 
            : 'Unknown';

        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.innerHTML = `
            <div class="transaction-icon ${transaction.type}">
                ${transaction.type === 'income' ? '📈' : '💰'}
            </div>
            <div class="transaction-details">
                <div class="transaction-name">${transaction.description}</div>
                <div class="transaction-category">${categoryName}</div>
            </div>
            <div class="transaction-right">
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
        `;
        transactionsList.appendChild(item);
    });
}

// Calculate Stats
function calculateStats(transactions) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let totalBalance = 0;
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        const transactionDate = transaction.date.toDate();

        if (transaction.type === 'income') {
            totalBalance += amount;
            if (transactionDate >= firstDay && transactionDate <= lastDay) {
                monthIncome += amount;
            }
        } else {
            totalBalance -= amount;
            if (transactionDate >= firstDay && transactionDate <= lastDay) {
                monthExpense += amount;
            }
        }
    });

    document.getElementById('totalBalance').textContent = `$${totalBalance.toFixed(2)}`;
    document.getElementById('monthIncome').textContent = `$${monthIncome.toFixed(2)}`;
    document.getElementById('monthExpense').textContent = `$${monthExpense.toFixed(2)}`;
}

// Load Balance Chart
function loadBalanceChart(transactions) {
    const dataPoints = [];
    let runningBalance = 0;

    // Sort transactions by date ascending for chart
    const sortedTransactions = [...transactions].sort((a, b) => 
        a.date.toDate() - b.date.toDate()
    );

    sortedTransactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        
        if (transaction.type === 'income') {
            runningBalance += amount;
        } else {
            runningBalance -= amount;
        }

        dataPoints.push({
            date: transaction.date.toDate(),
            balance: runningBalance
        });
    });

    // Group by day and take the last balance of each day
    const dailyBalances = {};
    dataPoints.forEach(point => {
        const dateKey = point.date.toISOString().split('T')[0];
        dailyBalances[dateKey] = point.balance;
    });

    const labels = Object.keys(dailyBalances).slice(-30); // Last 30 days
    const data = labels.map(date => dailyBalances[date]);

    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    if (balanceChart) {
        balanceChart.destroy();
    }

    balanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(date => {
                const d = new Date(date);
                return `${d.getMonth() + 1}/${d.getDate()}`;
            }),
            datasets: [{
                label: 'Balance',
                data: data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// ---------------------
// Transaction Modal
// ---------------------
const transactionModal = document.getElementById('transactionModal');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const closeModal = document.getElementById('closeModal');
const transactionForm = document.getElementById('transactionForm');

addTransactionBtn.addEventListener('click', openAddTransactionModal);
closeModal.addEventListener('click', closeTransactionModal);

transactionModal.addEventListener('click', (e) => {
    if (e.target === transactionModal) {
        closeTransactionModal();
    }
});

function openAddTransactionModal() {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    transactionForm.reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('date').valueAsDate = new Date();
    transactionModal.classList.add('active');
}

function closeTransactionModal() {
    transactionModal.classList.remove('active');
}

// Submit Transaction Form
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = document.querySelector('input[name="type"]:checked').value;
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const categoryId = document.getElementById('category').value;
    const date = new Date(document.getElementById('date').value);
    const transactionId = document.getElementById('transactionId').value;

    if (!categoryId) {
        alert('Please select a category');
        return;
    }

    const transactionData = {
        userId: currentUser.uid,
        type,
        description,
        amount,
        categoryId,
        date: firebase.firestore.Timestamp.fromDate(date),
        updatedAt: firebase.firestore.Timestamp.now()
    };

    try {
        if (transactionId) {
            await db.collection('transactions').doc(transactionId).update(transactionData);
            alert('Transaction updated successfully!');
        } else {
            transactionData.createdAt = firebase.firestore.Timestamp.now();
            await db.collection('transactions').add(transactionData);
            alert('Transaction added successfully!');
        }

        closeTransactionModal();
        await loadDashboardData();
    } catch (error) {
        console.error('Error saving transaction:', error);
        alert('Error saving transaction. Please try again.');
    }
});

// ---------------------
// Utility Functions
// ---------------------
function formatDate(timestamp) {
    const date = timestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}
