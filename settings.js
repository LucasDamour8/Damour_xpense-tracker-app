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
let userPreferences = null;

// Authentication Check
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        displayUserInfo(user);
        loadUserData();
        loadStats();
    } else {
        window.location.href = 'index.html';
    }
});

// Display User Info
function displayUserInfo(user) {
    document.getElementById('userName').textContent = user.displayName || 'User';
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('fullName').value = user.displayName || '';
    document.getElementById('emailAddress').value = user.email;
    
    const initials = user.displayName 
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : user.email[0].toUpperCase();
    document.getElementById('userAvatar').textContent = initials;

    // Member since
    if (user.metadata.creationTime) {
        const creationDate = new Date(user.metadata.creationTime);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        document.getElementById('memberSince').textContent = `${monthNames[creationDate.getMonth()]} ${creationDate.getFullYear()}`;
    }
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

// ===================================
// LOAD USER DATA & PREFERENCES
// ===================================
async function loadUserData() {
    try {
        const userDoc = await db.collection('userPreferences').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userPreferences = userDoc.data();
            document.getElementById('currencySelect').value = userPreferences.currency || 'USD';
            document.getElementById('emailNotifications').checked = userPreferences.emailNotifications !== false;
        } else {
            // Create default preferences
            userPreferences = {
                currency: 'USD',
                emailNotifications: true
            };
            await db.collection('userPreferences').doc(currentUser.uid).set(userPreferences);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// ===================================
// LOAD STATISTICS
// ===================================
async function loadStats() {
    try {
        // Count transactions
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();
        document.getElementById('totalTransactions').textContent = transactionsSnapshot.size;

        // Count categories
        const categoriesSnapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();
        document.getElementById('totalCategories').textContent = categoriesSnapshot.size;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ===================================
// UPDATE PROFILE
// ===================================
document.getElementById('updateProfileBtn').addEventListener('click', async () => {
    const newName = document.getElementById('fullName').value.trim();
    
    if (!newName) {
        alert('❌ Please enter your full name');
        return;
    }

    try {
        await currentUser.updateProfile({
            displayName: newName
        });

        document.getElementById('userName').textContent = newName;
        const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        document.getElementById('userAvatar').textContent = initials;

        alert('✅ Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('❌ Error updating profile: ' + error.message);
    }
});

// ===================================
// CHANGE PASSWORD
// ===================================
const passwordModal = document.getElementById('passwordModal');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const closePasswordModal = document.getElementById('closePasswordModal');
const passwordForm = document.getElementById('passwordForm');

changePasswordBtn.addEventListener('click', () => {
    passwordModal.classList.add('active');
});

closePasswordModal.addEventListener('click', () => {
    passwordModal.classList.remove('active');
    passwordForm.reset();
});

passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
        passwordModal.classList.remove('active');
        passwordForm.reset();
    }
});

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('❌ New passwords do not match!');
        return;
    }

    if (newPassword.length < 8) {
        alert('❌ Password must be at least 8 characters long');
        return;
    }

    try {
        // Re-authenticate user
        const credential = firebase.auth.EmailAuthProvider.credential(
            currentUser.email,
            currentPassword
        );
        await currentUser.reauthenticateWithCredential(credential);

        // Update password
        await currentUser.updatePassword(newPassword);

        alert('✅ Password changed successfully!');
        passwordModal.classList.remove('active');
        passwordForm.reset();
    } catch (error) {
        console.error('Error changing password:', error);
        
        if (error.code === 'auth/wrong-password') {
            alert('❌ Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
            alert('❌ New password is too weak. Use a stronger password.');
        } else {
            alert('❌ Error changing password: ' + error.message);
        }
    }
});

// ===================================
// SAVE PREFERENCES
// ===================================
document.getElementById('savePreferencesBtn').addEventListener('click', async () => {
    const currency = document.getElementById('currencySelect').value;
    const emailNotifications = document.getElementById('emailNotifications').checked;

    try {
        await db.collection('userPreferences').doc(currentUser.uid).set({
            currency: currency,
            emailNotifications: emailNotifications,
            updatedAt: firebase.firestore.Timestamp.now()
        }, { merge: true });

        alert('✅ Preferences saved successfully!');
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('❌ Error saving preferences: ' + error.message);
    }
});

// ===================================
// EXPORT DATA
// ===================================
document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
        const transactions = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .orderBy('date', 'desc')
            .get();

        const categories = {};
        const categoriesSnapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();
        
        categoriesSnapshot.forEach(doc => {
            categories[doc.id] = doc.data().name;
        });

        // Create CSV content
        let csv = 'Date,Type,Description,Category,Amount\n';
        
        transactions.forEach(doc => {
            const t = doc.data();
            const date = t.date.toDate().toLocaleDateString();
            const categoryName = categories[t.categoryId] || 'Unknown';
            csv += `"${date}","${t.type}","${t.description}","${categoryName}","${t.amount}"\n`;
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        alert('✅ Data exported successfully!');
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('❌ Error exporting data: ' + error.message);
    }
});

// ===================================
// CLEAR ALL DATA
// ===================================
document.getElementById('clearAllDataBtn').addEventListener('click', async () => {
    const confirmation = prompt('⚠️ This will delete ALL your transactions and categories!\n\nYour account will remain active, but all financial data will be lost.\n\nType "CLEAR" to confirm:');
    
    if (confirmation !== 'CLEAR') {
        alert('Data clearing cancelled.');
        return;
    }

    const finalConfirm = confirm('Are you absolutely sure? This cannot be undone!');
    
    if (!finalConfirm) {
        alert('Data clearing cancelled.');
        return;
    }

    try {
        // Delete all transactions
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const transactionDeletes = [];
        transactionsSnapshot.forEach(doc => {
            transactionDeletes.push(doc.ref.delete());
        });
        await Promise.all(transactionDeletes);

        // Delete all categories
        const categoriesSnapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const categoryDeletes = [];
        categoriesSnapshot.forEach(doc => {
            categoryDeletes.push(doc.ref.delete());
        });
        await Promise.all(categoryDeletes);

        alert('✅ All data has been cleared successfully!');
        loadStats();
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('❌ Error clearing data: ' + error.message);
    }
});

// ===================================
// DELETE ACCOUNT
// ===================================
document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const confirmation = prompt('⚠️ FINAL WARNING: This will permanently delete your account and ALL data!\n\nType "DELETE" to confirm:');
    
    if (confirmation !== 'DELETE') {
        alert('Account deletion cancelled.');
        return;
    }

    const finalConfirm = confirm('This is your last chance! Delete account permanently?');
    
    if (!finalConfirm) {
        alert('Account deletion cancelled.');
        return;
    }

    try {
        // Delete all transactions
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const transactionDeletes = [];
        transactionsSnapshot.forEach(doc => {
            transactionDeletes.push(doc.ref.delete());
        });
        await Promise.all(transactionDeletes);

        // Delete all categories
        const categoriesSnapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();
        
        const categoryDeletes = [];
        categoriesSnapshot.forEach(doc => {
            categoryDeletes.push(doc.ref.delete());
        });
        await Promise.all(categoryDeletes);

        // Delete user preferences
        await db.collection('userPreferences').doc(currentUser.uid).delete();

        // Delete user account
        await currentUser.delete();

        alert('✅ Your account has been deleted successfully.');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        
        if (error.code === 'auth/requires-recent-login') {
            alert('❌ For security reasons, you need to sign in again before deleting your account.\n\nPlease sign out, sign back in, and try again.');
        } else {
            alert('❌ Error deleting account: ' + error.message);
        }
    }
});