/**
 * Arcania Authentication Manager (Full-Stack Version)
 * Handles user sign-up and login by communicating with the Python backend API.
 * All crypto operations remain client-side to maintain zero-knowledge.
 */

// API Base URL (assuming server runs on port 5000)
const API_URL = 'http://127.0.0.1:5000';

/**
 * Global notification system (DUPLICATED per user request)
 */
function showNotification(message, type = 'info', duration = 4000) {
    let container = document.querySelector('.notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
             if (notification) notification.remove();
        }, 300);
    }, duration);
}


document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

/**
 * Handles the user signup process.
 * Derives all keys client-side, then sends them to the server for storage.
 * @param {Event} e The form submission event.
 */
async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const accountPassword = document.getElementById('signup-password').value;
    const masterPassword = document.getElementById('master-password').value;

    try {
        // 1. Generate two SEPARATE salts.
        const authSalt = encryptionService.generateSalt();
        const encryptionSalt = encryptionService.generateSalt();

        // 2. Hash the account password with the AUTH salt for login verification.
        const authHash = await encryptionService.deriveAuthHash(accountPassword, authSalt);
        
        // 3. Hash the master password with the AUTH salt to create a "check hash".
        // Note: Using the *authSalt* for this check hash is fine, it just needs to be consistent.
        const masterPasswordCheckHash = await encryptionService.deriveAuthHash(masterPassword, authSalt);

        // 4. Prepare data payload for the server.
        const signupData = {
            email,
            authSalt: encryptionService.arrayBufferToBase64(authSalt),
            encryptionSalt: encryptionService.arrayBufferToBase64(encryptionSalt),
            authHash: encryptionService.arrayBufferToBase64(authHash),
            masterPasswordCheckHash: encryptionService.arrayBufferToBase64(masterPasswordCheckHash)
        };
        
        // 5. Send data to the backend API instead of localStorage.
        const response = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData),
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Signup successful! Please log in.', 'success');
            window.location.href = 'login.html';
        } else {
            // Show server-side error (e.g., "Email already exists")
            showNotification(result.error || 'Signup failed.', 'error');
        }

    } catch (error) {
        console.error('Signup error:', error);
        showNotification('An error occurred during signup. Please try again.', 'error');
    }
}

/**
 * Handles the user login process using the backend API.
 * @param {Event} e The form submission event.
 */
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const accountPassword = document.getElementById('login-password').value;

    try {
        // 1. Fetch the user's auth salt from the server.
        const saltResponse = await fetch(`${API_URL}/api/get-salts/${email}`);
        
        if (!saltResponse.ok) {
            showNotification('Invalid email or password.', 'error'); // Generic error
            return;
        }

        const saltData = await saltResponse.json();
        const authSalt = encryptionService.base64ToArrayBuffer(saltData.authSalt);

        // 2. Derive the hash of the entered password using the fetched salt (CLIENT-SIDE).
        const providedAuthHashBuffer = await encryptionService.deriveAuthHash(accountPassword, authSalt);
        const providedAuthHash = encryptionService.arrayBufferToBase64(providedAuthHashBuffer);

        // 3. Send the derived hash (NEVER the password) to the server for verification.
        const loginResponse = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, providedAuthHash }),
        });

        if (!loginResponse.ok) {
            showNotification('Invalid email or password.', 'error'); // Generic error from server
            return;
        }

        // 4. Set persistent session (just the non-sensitive email)
        localStorage.setItem('loggedInUser', email);

        showNotification('Login successful! Welcome back.', 'success');
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login. Please try again.', 'error');
    }
}