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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ---------------------
// Check Authentication
// ---------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ User is signed in:', user.email);
        
        // Update user info in header
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email;
        
        // Update avatar with initials
        if (userAvatar && user.displayName) {
            const initials = user.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            userAvatar.textContent = initials;
        } else if (userAvatar && user.email) {
            userAvatar.textContent = user.email.slice(0, 2).toUpperCase();
        }
    } else {
        console.log('❌ No user signed in, redirecting to login...');
        window.location.href = 'index.html';
    }
});

// ---------------------
// Sign Out Functionality
// ---------------------
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out?')) {
            auth.signOut()
                .then(() => {
                    console.log('✅ User signed out successfully');
                    alert('You have been signed out successfully!');
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error('Sign out error:', error);
                    alert('Error signing out: ' + error.message);
                });
        }
    });
}

// ---------------------
// Navigation Items
// ---------------------
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        const page = this.getAttribute('data-page');
        if (page) {
            window.location.href = page;
        }
    });
});

// ---------------------
// Mobile Menu Toggle
// ---------------------
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

function openMobileMenu() {
    createOverlay();
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.classList.add('menu-open');
}

function closeMobileMenu() {
    sidebar.classList.remove('open');
    if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
    }
    document.body.classList.remove('menu-open');
}

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
}

// Close menu when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && 
            !mobileMenuToggle.contains(e.target) && 
            sidebar.classList.contains('open')) {
            closeMobileMenu();
        }
    }
});

// ---------------------
// Balance Trend Chart
// ---------------------
const ctx = document.getElementById('balanceChart');
if (ctx) {
    const balanceChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Jan 1', 'Jan 5', 'Jan 10', 'Jan 15', 'Jan 20', 'Jan 25', 'Today'],
            datasets: [{
                label: 'Balance',
                data: [2500, 2300, 2250, 3000, 2100, 2200, 2800],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 6,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: window.innerWidth < 768 ? 1.5 : 3,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    cornerRadius: 8,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 0,
                    max: 3000,
                    ticks: {
                        callback: function(value) {
                            return value;
                        },
                        color: '#9ca3af',
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    },
                    grid: {
                        color: '#f3f4f6',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });

    // Update chart on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            balanceChart.options.aspectRatio = window.innerWidth < 768 ? 1.5 : 3;
            balanceChart.options.scales.y.ticks.font.size = window.innerWidth < 768 ? 10 : 12;
            balanceChart.options.scales.x.ticks.font.size = window.innerWidth < 768 ? 10 : 12;
            balanceChart.update();
        }, 250);
    });
}

// ---------------------
// Add Transaction Button
// ---------------------
const addTransactionBtn = document.querySelector('.add-transaction-btn');
if (addTransactionBtn) {
    addTransactionBtn.addEventListener('click', () => {
        window.location.href = 'transactions.html';
    });
}

// ---------------------
// Console Info
// ---------------------
console.log('🎨 Dashboard loaded successfully!');
console.log('📱 Viewport width:', window.innerWidth);
console.log('🔥 Firebase initialized:', firebase.apps.length > 0);