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

console.log("Firebase initialized successfully!");

// ---------------------
// Tab Switching
// ---------------------
const signinTab = document.getElementById('signin-tab');
const signupTab = document.getElementById('signup-tab');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');

signinTab.addEventListener('click', () => {
    signinTab.classList.add('active');
    signupTab.classList.remove('active');
    signinForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('active');
    signinTab.classList.remove('active');
    signupForm.classList.remove('hidden');
    signinForm.classList.add('hidden');
});

// ---------------------
// Sign In
// ---------------------
signinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    // Show loading state
    const submitBtn = signinForm.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ User signed in successfully:', userCredential.user.email);
            alert('Welcome back! Redirecting to dashboard...');
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Show user-friendly error messages
            let errorMessage = '';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = '❌ No account found with this email. Please sign up first.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = '❌ Incorrect password. Please try again.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '❌ Invalid email address format.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = '❌ Invalid email or password. Please check your credentials.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = '❌ Too many failed attempts. Please try again later.';
                    break;
                default:
                    errorMessage = '❌ Sign in failed: ' + error.message;
            }
            
            alert(errorMessage);
            console.error('Sign in error:', error.code, error.message);
        });
});

// ---------------------
// Sign Up
// ---------------------
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;

    // Validation
    if (!name) {
        alert('❌ Please enter your full name.');
        return;
    }

    if (password.length < 8) {
        alert("❌ Password must be at least 8 characters long");
        return;
    }

    // Show loading state
    const submitBtn = signupForm.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('✅ Account created successfully:', userCredential.user.email);
            
            // Update the user's display name
            return userCredential.user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            console.log('✅ Profile updated with name:', name);
            alert('🎉 Account created successfully! Redirecting to dashboard...');
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            // Reset button state
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

            // Show user-friendly error messages
            let errorMessage = '';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = '❌ An account with this email already exists. Please sign in instead.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = '❌ Invalid email address format.';
                    break;
                case 'auth/weak-password':
                    errorMessage = '❌ Password is too weak. Please use a stronger password with letters, numbers, and symbols.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = '❌ Email/password accounts are not enabled. Please contact support.';
                    break;
                default:
                    errorMessage = '❌ Sign up failed: ' + error.message;
            }
            
            alert(errorMessage);
            console.error('Sign up error:', error.code, error.message);
        });
});

// ---------------------
// Google Sign-In
// ---------------------
const googleBtn = document.querySelector('.btn-google');
if (googleBtn) {
    googleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        console.log('Attempting Google sign-in...');
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Optional: Force account selection every time
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        auth.signInWithPopup(provider)
            .then((result) => {
                console.log('✅ User signed in with Google:', result.user.email);
                alert('Welcome! Redirecting to dashboard...');
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                let errorMessage = '';
                
                switch(error.code) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = '❌ Sign-in cancelled. Please try again.';
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = '❌ Pop-up blocked by browser. Please allow pop-ups for this site.';
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = '❌ Only one pop-up allowed at a time.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = '❌ Google sign-in is not enabled. Please contact support.';
                        break;
                    default:
                        errorMessage = '❌ Google sign-in failed: ' + error.message;
                }
                
                alert(errorMessage);
                console.error('Google sign in error:', error.code, error.message);
            });
    });
}

// ---------------------
// Check if user is already signed in
// ---------------------
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('✅ User already signed in:', user.email);
        console.log('User ID:', user.uid);
        console.log('Display Name:', user.displayName);
        
        // Uncomment the line below to auto-redirect signed-in users to dashboard
        // window.location.href = "dashboard.html";
    } else {
        console.log('No user signed in');
    }
});

// ---------------------
// Test Firebase Connection
// ---------------------
window.addEventListener('load', () => {
    console.log('Page loaded, Firebase status:', firebase.apps.length > 0 ? '✅ Connected' : '❌ Not connected');
});
