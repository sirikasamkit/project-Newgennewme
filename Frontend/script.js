const wrapper = document.querySelector('.wrapper');
const loginLink= document.querySelector('.login-link');
const registerLink= document.querySelector('.register-link');
const btnPopup= document.querySelector('.btnLogin-popup');
const iconClose= document.querySelector('.icon-close');

if (registerLink) {
    registerLink.addEventListener('click', () => {
        wrapper.classList.add('active');
    });
}

if (loginLink) {
    loginLink.addEventListener('click', () => {
        wrapper.classList.remove('active');
    });
}

if (btnPopup) {
    btnPopup.addEventListener('click', () => {
        wrapper.classList.add('active-popup');
    });
}

if (iconClose) {
    iconClose.addEventListener('click', () => {
        wrapper.classList.remove('active-popup');
    });
}

// ดึง Element ต่างๆ มาใช้งาน
const aboutModal = document.getElementById("aboutModal");
const aboutLink = document.querySelector('a[href="about.html"]'); // เลือกเมนู About
const closeAbout = document.querySelector(".close-about");

// ตรวจสอบก่อนว่าในหน้านี้มี aboutModal หรือไม่ (เพื่อไม่ให้หน้าอื่น Error)
if (aboutModal && aboutLink) {
    
    aboutLink.addEventListener("click", (e) => {
        // เช็คว่าถ้าเป็นหน้า index.html ให้เปิด Modal แทนการไปหน้าใหม่
        // แต่ถ้าคุณต้องการให้กดแล้วไปหน้า about.html จริงๆ ให้ลบส่วนนี้ออก
        e.preventDefault(); 
        aboutModal.style.display = "flex";
    });

    if (closeAbout) {
        closeAbout.onclick = function() {
            aboutModal.style.display = "none";
        }
    }

    // เมื่อกดพื้นที่ว่างข้างนอก Modal ให้ปิดด้วย
    window.addEventListener('click', (event) => {
        if (event.target == aboutModal) {
            aboutModal.style.display = "none";
        }
    });
}