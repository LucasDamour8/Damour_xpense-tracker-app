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
let allTransactions = [];
let categories = {};

// Authentication Check
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        displayUserInfo(user);
        init();
    } else {
        window.location.href = 'index.html';
    }
});

function displayUserInfo(user) {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email;
    
    if (userAvatar) {
        const initials = user.displayName 
            ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : user.email[0].toUpperCase();
        userAvatar.textContent = initials;
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

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('menu-open');
    });
}

// Sign Out
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

// Initialize
async function init() {
    await loadCategories();
    await loadTransactions();
    setupFilters();
}

// Load Categories
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories')
            .where('userId', '==', currentUser.uid)
            .get();

        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select category</option>';

            snapshot.forEach(doc => {
                const category = doc.data();
                categories[doc.id] = category;
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = category.name;
                option.setAttribute('data-type', category.type);
                categorySelect.appendChild(option);
            });
        }

        document.querySelectorAll('input[name="type"]').forEach(radio => {
            radio.addEventListener('change', filterCategoriesByType);
        });
        filterCategoriesByType();
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Error loading categories: ' + error.message);
    }
}

function filterCategoriesByType() {
    const selectedTypeInput = document.querySelector('input[name="type"]:checked');
    if (!selectedTypeInput) return;
    
    const selectedType = selectedTypeInput.value;
    const categorySelect = document.getElementById('category');
    
    if (!categorySelect) return;
    
    const options = categorySelect.querySelectorAll('option');

    options.forEach(option => {
        if (option.value === '') {
            option.style.display = 'block';
            return;
        }
        const optionType = option.getAttribute('data-type');
        option.style.display = optionType === selectedType ? 'block' : 'none';
    });

    if (categorySelect.value) {
        const selectedOption = categorySelect.options[categorySelect.selectedIndex];
        const selectedOptionType = selectedOption.getAttribute('data-type');
        if (selectedOptionType !== selectedType) {
            categorySelect.value = '';
        }
    }
}

async function loadTransactions() {
    try {
        // Fetch without orderBy to avoid index requirement
        const snapshot = await db.collection('transactions')
            .where('userId', '==', currentUser.uid)
            .get();

        allTransactions = [];
        snapshot.forEach(doc => {
            allTransactions.push({ id: doc.id, ...doc.data() });
        });

        // Sort in JavaScript instead
        allTransactions.sort((a, b) => {
            const dateA = a.date.toDate();
            const dateB = b.date.toDate();
            return dateB - dateA; // Descending order (newest first)
        });

        displayTransactions(allTransactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        alert('Error loading transactions: ' + error.message);
    }
}
function displayTransactions(transactions) {
    const list = document.getElementById('transactionsList');
    
    if (!list) return;

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }

    list.innerHTML = transactions.map(transaction => {
        const category = categories[transaction.categoryId] || { name: 'Unknown', color: '#6b7280' };
        const date = transaction.date.toDate();
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

        return `
            <div class="transaction-row">
                <div class="transaction-icon-wrapper ${transaction.type}" style="background-color: ${category.color}20; border: 2px solid ${category.color};">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${category.color};"></div>
                </div>
                <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <p>${category.name} • ${dateStr}</p>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}$${parseFloat(transaction.amount).toFixed(2)}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editTransaction('${transaction.id}')" style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer;">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button onclick="deleteTransaction('${transaction.id}', '${transaction.description.replace(/'/g, "\\'")}')  " style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; color: #ef4444;">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Setup Filters
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (filterType) filterType.addEventListener('change', applyFilters);
}

function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const typeFilter = filterType ? filterType.value : 'all';

    let filtered = allTransactions;

    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.description.toLowerCase().includes(searchTerm) ||
            (categories[t.categoryId] && categories[t.categoryId].name.toLowerCase().includes(searchTerm))
        );
    }

    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }

    displayTransactions(filtered);
}

// Modal Functions
const modal = document.getElementById('transactionModal');
const addBtn = document.getElementById('addTransactionBtn');
const closeBtn = document.getElementById('closeModal');
const form = document.getElementById('transactionForm');

if (addBtn) addBtn.addEventListener('click', openAddModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function openAddModal() {
    const modalTitle = document.getElementById('modalTitle');
    const transactionId = document.getElementById('transactionId');
    const dateInput = document.getElementById('date');
    
    if (modalTitle) modalTitle.textContent = 'Add Transaction';
    if (form) form.reset();
    if (transactionId) transactionId.value = '';
    if (dateInput) dateInput.valueAsDate = new Date();
    if (modal) modal.classList.add('active');
}

function closeModal() {
    if (modal) modal.classList.remove('active');
}

window.editTransaction = async function(id) {
    const transaction = allTransactions.find(t => t.id === id);
    if (!transaction) return;

    const modalTitle = document.getElementById('modalTitle');
    const transactionId = document.getElementById('transactionId');
    const description = document.getElementById('description');
    const amount = document.getElementById('amount');
    const category = document.getElementById('category');
    const typeRadio = document.querySelector(`input[name="type"][value="${transaction.type}"]`);
    const dateInput = document.getElementById('date');
    
    if (modalTitle) modalTitle.textContent = 'Edit Transaction';
    if (transactionId) transactionId.value = id;
    if (description) description.value = transaction.description;
    if (amount) amount.value = transaction.amount;
    if (category) category.value = transaction.categoryId;
    if (typeRadio) typeRadio.checked = true;
    
    if (dateInput) {
        const date = transaction.date.toDate();
        dateInput.valueAsDate = date;
    }
    
    filterCategoriesByType();
    if (modal) modal.classList.add('active');
};

window.deleteTransaction = async function(id, description) {
    if (!confirm(`Delete "${description}"?`)) return;

    try {
        await db.collection('transactions').doc(id).delete();
        alert('Transaction deleted!');
        await loadTransactions();
        applyFilters();
    } catch (error) {
        console.error('Error deleting:', error);
        alert('Error deleting transaction: ' + error.message);
    }
};

// Submit Form
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const transactionId = document.getElementById('transactionId');
        const typeInput = document.querySelector('input[name="type"]:checked');
        const description = document.getElementById('description');
        const amount = document.getElementById('amount');
        const category = document.getElementById('category');
        const dateInput = document.getElementById('date');

        const id = transactionId ? transactionId.value : '';
        const type = typeInput ? typeInput.value : 'income';
        const descriptionValue = description ? description.value.trim() : '';
        const amountValue = amount ? parseFloat(amount.value) : 0;
        const categoryId = category ? category.value : '';
        const dateValue = dateInput ? dateInput.value : '';
        const date = new Date(dateValue);

        if (!categoryId) {
            alert('Please select a category');
            return;
        }

        const data = {
            userId: currentUser.uid,
            type,
            description: descriptionValue,
            amount: amountValue,
            categoryId,
            date: firebase.firestore.Timestamp.fromDate(date),
            updatedAt: firebase.firestore.Timestamp.now()
        };

        try {
            if (id) {
                await db.collection('transactions').doc(id).update(data);
                alert('Transaction updated!');
            } else {
                data.createdAt = firebase.firestore.Timestamp.now();
                await db.collection('transactions').add(data);
                alert('Transaction added!');
            }

            closeModal();
            await loadTransactions();
            applyFilters();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error saving transaction: ' + error.message);
        }
    });
}