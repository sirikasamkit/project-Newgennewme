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

async function calculateBMI() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        
        // กำหนดสถานะตามเกณฑ์ของระบบ NeWGen NewME
        let status = "";
        if (bmi < 18.5) status = "น้ำหนักน้อย / ผอม";
        else if (bmi < 23) status = "ปกติ (สุขภาพดี)";
        else if (bmi < 25) status = "ท้วม / โรคอ้วนระดับ 1";
        else if (bmi < 30) status = "อ้วน / โรคอ้วนระดับ 2";
        else status = "อ้วนมาก / โรคอ้วนระดับ 3";

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;
        document.getElementById('result-area').style.display = "block";

        // --- ส่วนการดึงข้อมูลจาก AI ---
        const resultArea = document.getElementById('result-area');
        const aiResponseBox = document.createElement('div');
        aiResponseBox.id = "ai-plan";
        aiResponseBox.innerHTML = "<p><i>กำลังวิเคราะห์แผนโดย AI...</i></p>";
        
        // ลบอันเก่าออกถ้ามีการกดคำนวณซ้ำ
        const oldBox = document.getElementById('ai-plan');
        if(oldBox) oldBox.remove();
        resultArea.appendChild(aiResponseBox);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bmi: bmi, 
                    status: status, 
                    weight: weight, // เพิ่มการส่งน้ำหนัก
                    height: height  // เพิ่มการส่งส่วนสูง
    })
});


        const data = await response.json();
        if (data.error) throw new Error(data.error); // เช็ค Error จากฝั่ง Server
        aiResponseBox.innerHTML = `<h3>คำแนะนำจาก AI:</h3><div>${data.plan}</div>`;
        } catch (error) {
            aiResponseBox.innerHTML = "<p style='color:red;'>เชื่อมต่อ Server ไม่ได้ (ลืมเปิด Node.js หรือติด CORS)</p>";
        }
    }
}