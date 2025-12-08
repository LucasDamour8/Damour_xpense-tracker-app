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

// ---------------------
// Authentication Check
// ---------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log('User logged in:', user.email);
        displayUserInfo(user);
        loadCategories();
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

    if (userName) userName.textContent = user.displayName || 'User';
    if (userEmail) userEmail.textContent = user.email;
    
    if (userAvatar) {
        const initials = user.displayName 
            ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : user.email[0].toUpperCase();
        userAvatar.textContent = initials;
    }
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
                console.log('User signed out');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
            });
        }
    });
}

// ---------------------
// Load Categories
// ---------------------
async function loadCategories() {
    try {
       // In categories.js, temporarily change this line:
const categoriesSnapshot = await db.collection('categories')
    .where('userId', '==', currentUser.uid)
    // .orderBy('name', 'asc')  // Comment out temporarily
    .get();

        const incomeCategories = [];
        const expenseCategories = [];

        categoriesSnapshot.forEach(doc => {
            const category = { id: doc.id, ...doc.data() };
            if (category.type === 'income') {
                incomeCategories.push(category);
            } else {
                expenseCategories.push(category);
            }
        });

        displayCategories(incomeCategories, 'income');
        displayCategories(expenseCategories, 'expense');

        // Update counts
        const incomeCount = document.getElementById('incomeCount');
        const expenseCount = document.getElementById('expenseCount');
        if (incomeCount) incomeCount.textContent = `(${incomeCategories.length})`;
        if (expenseCount) expenseCount.textContent = `(${expenseCategories.length})`;
    } catch (error) {
        console.error('Error loading categories:', error);
        alert('Error loading categories: ' + error.message);
    }
}

function displayCategories(categories, type) {
    const listId = type === 'income' ? 'incomeCategoriesList' : 'expenseCategoriesList';
    const list = document.getElementById(listId);

    if (!list) return;

    if (categories.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 14px;">No ${type} categories yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = categories.map(category => `
        <div class="transaction-item" style="border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px;">
            <div class="transaction-icon ${type}" style="background-color: ${category.color}20; border: 2px solid ${category.color};">
                <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${category.color};"></div>
            </div>
            <div class="transaction-details">
                <div class="transaction-name">${category.name}</div>
                <div class="transaction-category" style="text-transform: capitalize;">
                    <span style="display: inline-block; padding: 2px 8px; background-color: ${type === 'income' ? '#d1fae5' : '#fee2e2'}; color: ${type === 'income' ? '#10b981' : '#ef4444'}; border-radius: 4px; font-size: 12px;">
                        ${type}
                    </span>
                </div>
            </div>
            <div class="transaction-right" style="display: flex; gap: 8px;">
                <button onclick="editCategory('${category.id}')" style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Edit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="deleteCategory('${category.id}', '${category.name}')" style="padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #ef4444;" title="Delete">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// ---------------------
// Category Modal
// ---------------------
const categoryModal = document.getElementById('categoryModal');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeModal = document.getElementById('closeModal');
const categoryForm = document.getElementById('categoryForm');
const categoryColor = document.getElementById('categoryColor');
const colorValue = document.getElementById('colorValue');

// Update color value display
if (categoryColor && colorValue) {
    categoryColor.addEventListener('input', (e) => {
        colorValue.textContent = e.target.value;
    });
}

if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', openAddCategoryModal);
}

if (closeModal) {
    closeModal.addEventListener('click', closeCategoryModal);
}

if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) {
            closeCategoryModal();
        }
    });
}

function openAddCategoryModal() {
    const modalTitle = document.getElementById('modalTitle');
    const categoryId = document.getElementById('categoryId');
    
    if (modalTitle) modalTitle.textContent = 'Add Category';
    if (categoryForm) categoryForm.reset();
    if (categoryId) categoryId.value = '';
    if (categoryColor) categoryColor.value = '#10b981';
    if (colorValue) colorValue.textContent = '#10b981';
    if (categoryModal) categoryModal.classList.add('active');
}

function closeCategoryModal() {
    if (categoryModal) categoryModal.classList.remove('active');
}

// Edit Category
window.editCategory = async function(categoryId) {
    try {
        const doc = await db.collection('categories').doc(categoryId).get();
        if (!doc.exists) {
            alert('Category not found');
            return;
        }

        const category = doc.data();
        const modalTitle = document.getElementById('modalTitle');
        const categoryIdInput = document.getElementById('categoryId');
        const categoryNameInput = document.getElementById('categoryName');
        const typeRadio = document.querySelector(`input[name="type"][value="${category.type}"]`);
        
        if (modalTitle) modalTitle.textContent = 'Edit Category';
        if (categoryIdInput) categoryIdInput.value = categoryId;
        if (categoryNameInput) categoryNameInput.value = category.name;
        if (typeRadio) typeRadio.checked = true;
        if (categoryColor) categoryColor.value = category.color || '#10b981';
        if (colorValue) colorValue.textContent = category.color || '#10b981';
        
        if (categoryModal) categoryModal.classList.add('active');
    } catch (error) {
        console.error('Error loading category:', error);
        alert('Error loading category. Please try again.');
    }
};

// Delete Category
window.deleteCategory = async function(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?\n\nThis will NOT delete transactions using this category.`)) {
        return;
    }

    try {
        await db.collection('categories').doc(categoryId).delete();
        alert('Category deleted successfully!');
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
    }
};

// Submit Category Form
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryId = document.getElementById('categoryId').value;
        const name = document.getElementById('categoryName').value.trim();
        const typeInput = document.querySelector('input[name="type"]:checked');
        const type = typeInput ? typeInput.value : 'income';
        const color = categoryColor ? categoryColor.value : '#10b981';

        if (!name) {
            alert('Please enter a category name');
            return;
        }

        const categoryData = {
            userId: currentUser.uid,
            name,
            type,
            color,
            updatedAt: firebase.firestore.Timestamp.now()
        };

        try {
            if (categoryId) {
                // Update existing category
                await db.collection('categories').doc(categoryId).update(categoryData);
                alert('Category updated successfully!');
            } else {
                // Check if category already exists
                const existingCategory = await db.collection('categories')
                    .where('userId', '==', currentUser.uid)
                    .where('name', '==', name)
                    .where('type', '==', type)
                    .get();

                if (!existingCategory.empty) {
                    alert('A category with this name and type already exists!');
                    return;
                }

                // Add new category
                categoryData.createdAt = firebase.firestore.Timestamp.now();
                await db.collection('categories').add(categoryData);
                alert('Category added successfully!');
            }

            closeCategoryModal();
            await loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category: ' + error.message);
        }
    });
}