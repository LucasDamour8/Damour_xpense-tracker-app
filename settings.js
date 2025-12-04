// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAd_Uwwp2X1mI8Zx5UuFKHy8ksp53wGMt0",
    authDomain: "damour-tracker-app.firebaseapp.com",
    projectId: "damour-tracker-app",
    storageBucket: "damour-tracker-app.firebasestorage.app",
    messagingSenderId: "1026524539942",
    appId: "1:1026524539942:web:7c155b85a34d13fc5e8ae7"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Check Authentication and Load User Data
auth.onAuthStateChanged((user) => {
    if (user) {
        // Load user profile data
        document.getElementById('fullName').value = user.displayName || 'Not set';
        document.getElementById('emailAddress').value = user.email;
    } else {
        window.location.href = 'index.html';
    }
});

// Change Password
const changePasswordBtn = document.getElementById('changePasswordBtn');
changePasswordBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user && user.email) {
        auth.sendPasswordResetEmail(user.email)
            .then(() => {
                alert('✅ Password reset email sent! Please check your inbox.');
            })
            .catch((error) => {
                alert('❌ Error: ' + error.message);
            });
    }
});

// Currency Selection
const currencySelect = document.getElementById('currencySelect');
const savedCurrency = localStorage.getItem('currency') || 'USD';
currencySelect.value = savedCurrency;

currencySelect.addEventListener('change', (e) => {
    localStorage.setItem('currency', e.target.value);
    alert('✅ Currency preference saved!');
});

// Email Notifications Toggle
const emailNotifications = document.getElementById('emailNotifications');
const savedNotifications = localStorage.getItem('emailNotifications') !== 'false';
emailNotifications.checked = savedNotifications;

emailNotifications.addEventListener('change', (e) => {
    localStorage.setItem('emailNotifications', e.target.checked);
    if (e.target.checked) {
        alert('✅ Email notifications enabled!');
    } else {
        alert('🔕 Email notifications disabled!');
    }
});

// Export Transactions
const exportBtn = document.getElementById('exportBtn');
exportBtn.addEventListener('click', () => {
    // Sample transaction data
    const transactions = [
        ['Date', 'Name', 'Category', 'Type', 'Amount'],
        ['2024-11-29', 'Monthly Salary', 'Salary', 'Income', '5000.00'],
        ['2024-11-30', 'Coffee Shop', 'Food', 'Expense', '4.50'],
        ['2024-12-01', 'Grocery Store', 'Food', 'Expense', '89.32'],
        ['2024-12-01', 'Netflix Subscription', 'Entertainment', 'Expense', '15.99'],
        ['2024-11-26', 'Freelance Project', 'Freelance', 'Income', '1200.00'],
        ['2024-11-28', 'Gas Station', 'Transportation', 'Expense', '45.00']
    ];

    // Convert to CSV
    const csvContent = transactions.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('✅ Transactions exported successfully!');
});

// Enable 2FA
const enable2FABtn = document.getElementById('enable2FABtn');
enable2FABtn.addEventListener('click', () => {
    alert('🔒 Two-Factor Authentication - Coming Soon!\n\nThis feature will allow you to add an extra layer of security to your account.');
});

// Delete Account
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
deleteAccountBtn.addEventListener('click', () => {
    const confirmation = confirm('⚠️ WARNING: This will permanently delete your account and all data.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?');
    
    if (confirmation) {
        const finalConfirmation = prompt('Type "DELETE" to confirm account deletion:');
        
        if (finalConfirmation === 'DELETE') {
            const user = auth.currentUser;
            
            user.delete()
                .then(() => {
                    alert('✅ Account deleted successfully. You will be redirected to the login page.');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    if (error.code === 'auth/requires-recent-login') {
                        alert('❌ For security reasons, please sign out and sign in again before deleting your account.');
                    } else {
                        alert('❌ Error deleting account: ' + error.message);
                    }
                });
        } else {
            alert('Account deletion cancelled.');
        }
    }
});

// Sign Out
const signOutBtn = document.getElementById('signOutBtn');
signOutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out?')) {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        });
    }
});

// Navigation
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        if (page) {
            window.location.href = page;
        }
    });
});

// Mobile menu
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
let sidebarOverlay = null;

function createOverlay() {
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
        sidebarOverlay.addEventListener('click', closeMobileMenu);
    }
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
}

mobileMenuToggle.addEventListener('click', () => {
    createOverlay();
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
});