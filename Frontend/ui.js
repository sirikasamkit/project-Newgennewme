// ===================================
// Theme Options (Light/Dark Mode)
// ===================================
window.applyTheme = function (theme) {
    const btn = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (btn) btn.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
    } else {
        document.body.classList.remove('dark-mode');
        if (btn) btn.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
    }
}

window.toggleTheme = function () {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    window.applyTheme(newTheme);
}

window.showToast = function (icon, title) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            icon: icon,
            title: title,
            customClass: {
                popup: 'glass-toast'
            }
        });
    } else {
        alert(title); // Fallback
    }
};

// UI Element Interactions
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.wrapper');
    const loginLink = document.querySelector('.login-link');
    const registerLink = document.querySelector('.register-link');
    const btnPopup = document.querySelector('.btnLogin-popup');
    const iconClose = document.querySelector('.icon-close');

    if (registerLink && wrapper) {
        registerLink.onclick = () => wrapper.classList.add('active');
    }
    if (loginLink && wrapper) {
        loginLink.onclick = () => wrapper.classList.remove('active');
    }
    if (btnPopup && wrapper) {
        btnPopup.onclick = () => wrapper.classList.add('active-popup');
    }
    if (iconClose && wrapper) {
        iconClose.onclick = () => wrapper.classList.remove('active-popup');
    }

    const aboutModal = document.getElementById("aboutModal");
    const closeAbout = document.querySelector(".close-about");

    if (closeAbout && aboutModal) {
        closeAbout.onclick = () => {
            aboutModal.style.display = "none";
        };
    }

    if (window.location.pathname.includes("about.html")) {
        if (aboutModal) {
            aboutModal.style.display = "flex";
        }
    }
});

window.switchTab = function (tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Deactivate all tab buttons
    document.querySelectorAll('.history-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) selectedTab.classList.add('active');

    // Activate selected tab button
    const selectedBtn = document.getElementById(`tab-btn-${tabName}`);
    if (selectedBtn) selectedBtn.classList.add('active');

    // Play a subtle sound if available
    if (window.playPremiumSound) window.playPremiumSound('pop');
};

