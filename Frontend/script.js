// 1. ประกาศตัวแปรทั้งหมดไว้ด้านบนสุดที่เดียว
const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

// 2. ฟังก์ชันสำหรับ Login/Register (เช็คป้องกัน Error)
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

// 3. ฟังก์ชันสำหรับ About Modal (แก้ไขให้กดครั้งเดียวติด)
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