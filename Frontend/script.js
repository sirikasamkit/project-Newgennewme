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

function calculateBMI() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value / 100; // แปลงหน่วยเป็นเมตร

    if (weight > 0 && height > 0) {
        const bmi = (weight / (height * height)).toFixed(2);
        document.getElementById('bmi-value').innerText = bmi;
        
        let status = "";
        if (bmi < 18.5) status = "น้ำหนักน้อย / ผอม";
        else if (bmi < 23) status = "ปกติ (สุขภาพดี)";
        else if (bmi < 25) status = "ท้วม / โรคอ้วนระดับ 1";
        else if (bmi < 30) status = "อ้วน / โรคอ้วนระดับ 2";
        else status = "อ้วนมาก / โรคอ้วนระดับ 3";

        document.getElementById('bmi-status').innerText = status;
        document.getElementById('result-area').style.display = "block";
        
        // เลื่อนหน้าจอลงมาให้เห็นผลลัพธ์อัตโนมัติ
        document.getElementById('result-area').scrollIntoView({ behavior: 'smooth' });
    } else {
        alert("กรุณากรอกน้ำหนักและส่วนสูงให้ถูกต้องครับ");
    }
}