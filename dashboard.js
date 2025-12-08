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

// ---------------------
// Load Dashboard Data
// ---------------------
async function loadDashboardData() {
    try {
        await loadCategories();
        await loadTransactions();
        await calculateStats();
        await loadBalanceChart();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load Categories for dropdown
async function loadCategories() {
    try {
        const categoriesSnapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();

        const categorySelect = document.getElementById('category');
        categorySelect.innerHTML = '<option value="">Select category</option>';

        categoriesSnapshot.forEach(doc => {
            const category = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
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
    } catch (error) {
        console.error('Error loading categories:', error);
    }
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

// Load Transactions
async function loadTransactions() {
    try {
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .limit(5)
            .get();

        const transactionsList = document.getElementById('recentTransactionsList');
        
        if (transactionsSnapshot.empty) {
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

        for (const doc of transactionsSnapshot.docs) {
            const transaction = doc.data();
            const categoryDoc = await db.collection('categories').doc(transaction.categoryId).get();
            const categoryName = categoryDoc.exists ? categoryDoc.data().name : 'Unknown';

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
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Calculate Stats
async function calculateStats() {
    try {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();

        let totalBalance = 0;
        let monthIncome = 0;
        let monthExpense = 0;

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
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
    } catch (error) {
        console.error('Error calculating stats:', error);
    }
}

// Load Balance Chart
async function loadBalanceChart() {
    try {
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'asc')
            .get();

        const dataPoints = [];
        let runningBalance = 0;

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
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
    } catch (error) {
        console.error('Error loading balance chart:', error);
    }
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
