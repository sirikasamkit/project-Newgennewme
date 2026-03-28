// ===================================
// Auth Logic (Login/Logout/Dashboard)
// ===================================

window.checkLoginStatus = function () {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const is_admin = localStorage.getItem('is_admin');

    const guestView = document.getElementById('guest-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navLoginBtn = document.getElementById('nav-login-btn');
    const navLogoutBtn = document.getElementById('nav-logout-btn');
    const navAdminBtn = document.getElementById('nav-admin-btn');
    const navHistoryBtn = document.getElementById('nav-history-btn');

    if (token && user) {
        if (guestView) guestView.style.display = 'none';
        if (dashboardView) dashboardView.style.display = 'block';
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (navLogoutBtn) navLogoutBtn.style.display = 'inline-block';
        if (navAdminBtn) navAdminBtn.style.display = (is_admin === "1") ? 'inline-block' : 'none';

        const navProfileBtn = document.getElementById('nav-profile-btn');
        if (navProfileBtn) navProfileBtn.style.display = 'inline-block';

        if (navHistoryBtn) navHistoryBtn.style.display = 'inline-block';

        const displayUsername = document.getElementById('display-username');
        if (displayUsername) {
            displayUsername.innerText = user;
        }

        // NEW: Fetch and display profile image globally
        const navProfilePic = document.getElementById('nav-profile-pic');
        const dashboardProfilePic = document.getElementById('dashboard-profile-pic');

        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data.profile_image) {
                    if (navProfilePic) {
                        navProfilePic.src = data.profile_image;
                        navProfilePic.parentElement.style.display = 'inline-flex';
                    }
                    if (dashboardProfilePic) {
                        dashboardProfilePic.src = data.profile_image;
                        dashboardProfilePic.style.display = 'block';
                    }
                } else {
                    // Show placeholders if no image but user is logged in
                    if (navProfilePic) navProfilePic.parentElement.style.display = 'inline-flex';
                    if (dashboardProfilePic) dashboardProfilePic.style.display = 'block';
                }
                if (data.username && displayUsername) {
                    displayUsername.innerText = data.username;
                }
            }).catch(err => console.error("Error syncing profile pic", err));

        if (window.loadProfile) window.loadProfile();

        // Ultimate UX Features Initializations
        if (typeof initDailyQuote === 'function') initDailyQuote();
        if (typeof renderWaterTracker === 'function') renderWaterTracker();
        if (typeof initWellnessSection === 'function') initWellnessSection();
        if (typeof checkAndAssignBadges === 'function') checkAndAssignBadges(token);
        if (typeof updateStreak === 'function') updateStreak();
        if (typeof renderWeeklySnapshots === 'function') renderWeeklySnapshots();
    } else {
        if (guestView) guestView.style.display = 'block';
        if (dashboardView) dashboardView.style.display = 'none';
        if (navLoginBtn) navLoginBtn.style.display = 'inline-block';
        if (navLogoutBtn) navLogoutBtn.style.display = 'none';
        if (navAdminBtn) navAdminBtn.style.display = 'none';

        const navProfileBtn = document.getElementById('nav-profile-btn');
        if (navProfileBtn) navProfileBtn.style.display = 'none';

        if (navHistoryBtn) navHistoryBtn.style.display = 'none';
    }
}

window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_admin');
    window.checkLoginStatus();
}

document.addEventListener('DOMContentLoaded', () => {
    // โหลดธีม
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (window.applyTheme) window.applyTheme(savedTheme);

    // โหลดสถานะล็อคอิน
    window.checkLoginStatus();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker Registered!'))
            .catch(err => console.log('Service Worker registration failed: ', err));
    }

    // Login Form
    const loginForm = document.querySelector('.form-box.login form');
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    if (window.showToast) window.showToast('success', "ยินดีต้อนรับคุณ " + result.user);
                    const wrapper = document.querySelector('.wrapper');
                    wrapper.classList.remove('active-popup');
                    localStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('is_admin', result.is_admin);
                    window.checkLoginStatus();
                } else {
                    if (window.showToast) window.showToast('error', result.message || "Login failed");
                }
            } catch (error) {
                if (window.showToast) window.showToast('error', "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
            }
        };
    }

    // Register Form
    const registerForm = document.querySelector('.form-box.register form');
    if (registerForm) {
        registerForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    if (window.showToast) window.showToast('success', "สมัครสมาชิกสำเร็จ! กรุณา Login");
                    const wrapper = document.querySelector('.wrapper');
                    wrapper.classList.remove('active');
                } else {
                    if (window.showToast) window.showToast('error', result.error || "Registration failed");
                }
            } catch (error) {
                if (window.showToast) window.showToast('error', "เชื่อมต่อ Server ไม่ได้");
            }
        };
    }
});

// ฟังก์ชันลืมรหัสผ่าน
window.forgotPassword = async function (e) {
    if (e) e.preventDefault();
    if (typeof Swal === 'undefined') return alert('Please load SweetAlert2 first');

    const { value: email } = await Swal.fire({
        title: 'ลืมรหัสผ่าน?',
        input: 'email',
        inputLabel: 'กรุณากรอกอีเมลที่ลงทะเบียนไว้',
        inputPlaceholder: 'example@email.com',
        showCancelButton: true,
        confirmButtonText: 'ถัดไป',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'glass-toast' }
    });

    if (email) {
        try {
            const checkRes = await fetch('/api/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const checkData = await checkRes.json();
            if (checkRes.ok) {
                const { value: newPassword } = await Swal.fire({
                    title: 'ตั้งรหัสผ่านใหม่',
                    input: 'password',
                    inputLabel: 'กรุณากรอกรหัสผ่านใหม่ของคุณ',
                    inputPlaceholder: 'รหัสผ่านใหม่',
                    showCancelButton: true,
                    confirmButtonText: 'เปลี่ยนรหัสผ่าน',
                    cancelButtonText: 'ยกเลิก',
                    inputAttributes: { minlength: 6, autocapitalize: 'off', autocorrect: 'off' },
                    customClass: { popup: 'glass-toast' }
                });

                if (newPassword) {
                    const resetRes = await fetch('/api/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, new_password: newPassword })
                    });
                    const resetData = await resetRes.json();
                    if (resetRes.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'เปลี่ยนรหัสผ่านสำเร็จ',
                            text: 'กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ',
                            customClass: { popup: 'glass-toast' }
                        });
                    } else {
                        if (window.showToast) window.showToast('error', resetData.message || "เกิดข้อผิดพลาด");
                    }
                }
            } else {
                if (window.showToast) window.showToast('error', checkData.message || "ไม่พบอีเมลนี้ในระบบ");
            }
        } catch (error) {
            if (window.showToast) window.showToast('error', "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    }
}
