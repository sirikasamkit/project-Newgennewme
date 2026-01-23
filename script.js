const wrapper = document.querySelector('.wrapper');
const loginLink= document.querySelector('.login-link');
const registerLink= document.querySelector('.register-link');
const btnPopup= document.querySelector('.btnLogin-popup');
const iconClose= document.querySelector('.icon-close');

registerLink.addEventListener('click', ()=> {
    wrapper.classList.add('active');
});

loginLink.addEventListener('click', ()=> {
    wrapper.classList.remove('active');
});

btnPopup.addEventListener('click', ()=> {
    wrapper.classList.add('active-popup');
});

iconClose.addEventListener('click', ()=> {
    wrapper.classList.remove('active-popup');
});

// ดึง Element ต่างๆ มาใช้งาน
const aboutModal = document.getElementById("aboutModal");
const aboutLink = document.querySelector('a[href="about.html"]'); // เลือกเมนู About
const closeAbout = document.querySelector(".close-about");

// เมื่อกด About ให้แสดง Modal (แทนการเปลี่ยนหน้า)
aboutLink.addEventListener("click", (e) => {
    e.preventDefault(); // ป้องกันไม่ให้เปลี่ยนหน้าไป about.html
    aboutModal.style.display = "block";
});

// เมื่อกดปุ่มกากบาท ให้ปิด Modal
closeAbout.onclick = function() {
    aboutModal.style.display = "none";
}

// เมื่อกดพื้นที่ว่างข้างนอก Modal ให้ปิดด้วย
window.onclick = function(event) {
    if (event.target == aboutModal) {
        aboutModal.style.display = "none";
    }
}