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

// แก้ไขในไฟล์ script.js ของคุณ
async function calculateBMI() {
    const weight = document.getElementById('weight').value; // ดึงค่าน้ำหนักจากหน้าเว็บ
    const height = document.getElementById('height').value; // ดึงค่าส่วนสูงจากหน้าเว็บ

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        
        let status = "";
        if (bmi < 18.5) status = "น้ำหนักน้อย / ผอม";
        else if (bmi < 23) status = "ปกติ (สุขภาพดี)";
        else if (bmi < 25) status = "ท้วม / โรคอ้วนระดับ 1";
        else if (bmi < 30) status = "อ้วน / โรคอ้วนระดับ 2";
        else status = "อ้วนมาก / โรคอ้วนระดับ 3";

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;
        document.getElementById('result-area').style.display = "block";

        const resultArea = document.getElementById('result-area');
        const oldBox = document.getElementById('ai-plan');
        if(oldBox) oldBox.remove();

        const aiResponseBox = document.createElement('div');
        aiResponseBox.id = "ai-plan";
        aiResponseBox.innerHTML = "<p><i>กำลังวิเคราะห์แผนโดย AI...</i></p>";
        resultArea.appendChild(aiResponseBox);

        // ... โค้ดส่วนบนของคุณ ...
        try {
            const response = await fetch('http://localhost:5000/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    bmi: bmi, 
                    status: status,
                    weight: weight,
                    height: height
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "AI Error");

            // --- ส่วนที่แก้ไขเริ่มตรงนี้ ---
            // ใช้ .replace(/\n/g, '<br>') เพื่อเปลี่ยนการขึ้นบรรทัดใหม่จาก AI ให้เป็นแท็ก <br> ของ HTML
            const formattedPlan = data.plan.replace(/\n/g, '<br>'); 
            
            aiResponseBox.innerHTML = `
                <div style="background: #f0f4f8; padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #162938;">
                    <h3 style="color: #162938; margin-bottom: 10px;">📋 แผนสุขภาพจาก NeWGen NewME AI:</h3>
                    <div style="line-height: 1.6; color: #333;">${formattedPlan}</div>
                </div>`;
            // --- ส่วนที่แก้ไขสิ้นสุดตรงนี้ ---

        } catch (error) {
            aiResponseBox.innerHTML = `<p style='color:red;'>เกิดข้อผิดพลาด: ${error.message}</p>`;
        }

// ... โค้ดส่วนล่างของคุณ ...
    }
}

// 4. ฟังก์ชันสำหรับหน้า Services (แจ้งปัญหา)
function openContactForm() {
    // วิธีที่ 1: ส่งไปที่หน้า Contact โดยตรง
    window.location.href = "contact.html";
    
    // วิธีที่ 2: หรือถ้าอยากให้ส่งอีเมลทันทีเมื่อกดปุ่ม
    // window.location.href = "mailto:support@newgen.com?subject=Report an Issue";
}