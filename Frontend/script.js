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
        if (oldBox) oldBox.remove();

        const aiResponseBox = document.createElement('div');
        aiResponseBox.id = "ai-plan";
        aiResponseBox.innerHTML = "<p><i>กำลังวิเคราะห์แผนโดย AI...</i></p>";
        resultArea.appendChild(aiResponseBox);

        try {
            // เรียกใช้ API ของ Node.js (ไม่ใช่ PHP)
            const response = await fetch('http://localhost:5000/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bmi, weight, height, status })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "AI Error");

            // ใช้ .replace(/\n/g, '<br>') เพื่อเปลี่ยนการขึ้นบรรทัดใหม่จาก AI ให้เป็นแท็ก <br> ของ HTML
            const formattedPlan = data.plan.replace(/\n/g, '<br>');

            aiResponseBox.innerHTML = `
                <div style="background: #f0f4f8; padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #162938;">
                    <h3 style="color: #162938; margin-bottom: 10px;">📋 แผนสุขภาพจาก NeWGen NewME AI:</h3>
                    <div style="line-height: 1.6; color: #333;">${formattedPlan}</div>
                </div>`;

        } catch (error) {
            aiResponseBox.innerHTML = `<p style='color:red;'>เกิดข้อผิดพลาด: ${error.message}</p>`;
        }

    }
}

// 4. ฟังก์ชันสำหรับหน้า Services (แจ้งปัญหา)
function openContactForm() {
    // วิธีที่ 1: ส่งไปที่หน้า Contact โดยตรง
    window.location.href = "contact.html";

    // วิธีที่ 2: หรือถ้าอยากให้ส่งอีเมลทันทีเมื่อกดปุ่ม
    // window.location.href = "mailto:support@newgen.com?subject=Report an Issue";
}

async function analyzeFoodImage() {
    const fileInput = document.getElementById('food-image');
    const resultArea = document.getElementById('food-result-area');
    const contentArea = document.getElementById('food-analysis-content');

    if (fileInput.files.length === 0) {
        alert("กรุณาเลือกรูปภาพก่อนครับ");
        return;
    }

    const formData = new FormData();
    formData.append('image', fileInput.files[0]);

    resultArea.style.display = "block";
    contentArea.innerHTML = "<i>AI กำลังมองดูอาหารของคุณ...</i>";

    try {
        const response = await fetch('http://localhost:5000/api/analyze-food', {
            method: 'POST',
            body: formData // ส่งเป็น FormData สำหรับไฟล์
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI Error");

        // แสดงผลลัพธ์ที่ได้จาก AI (Gemini)
        contentArea.innerHTML = data.analysis.replace(/\n/g, '<br>');

    } catch (error) {
        contentArea.innerHTML = `<p style='color:red;'>เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
}

function previewImage(event) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');

    reader.onload = function () {
        if (reader.readyState === 2) {
            previewImg.src = reader.result;
            previewContainer.style.display = "block"; // แสดง Container เมื่อโหลดรูปเสร็จ
        }
    }

    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

// ค้นหา Form Login จาก HTML
const loginForm = document.querySelector('.form-box.login form');

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault(); // ป้องกันหน้าเว็บรีโหลด

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // ส่งข้อมูลไปยัง Node.js Backend Port 5000
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) { // เช็ค response.ok แทน status text
                alert("ยินดีต้อนรับคุณ " + result.user);
                // ปิดหน้าต่าง Login เมื่อสำเร็จ
                const wrapper = document.querySelector('.wrapper');
                wrapper.classList.remove('active-popup');

                // (Optional) เก็บ token หรือ user data ลง localStorage
                localStorage.setItem('user', JSON.stringify(result.user));

            } else {
                alert(result.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    };
}

// เพิ่ม Logic สำหรับ Register
const registerForm = document.querySelector('.form-box.register form');
if (registerForm) {
    registerForm.onsubmit = async (e) => {
        e.preventDefault();

        // ดึงค่าจาก input ที่มี id ระบุไว้ชัดเจน
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("สมัครสมาชิกสำเร็จ! กรุณา Login");
                // สลับไปหน้า Login
                const wrapper = document.querySelector('.wrapper');
                wrapper.classList.remove('active');
            } else {
                alert(result.error || "Registration failed");
            }

        } catch (error) {
            console.error("Register Error:", error);
            alert("เชื่อมต่อ Server ไม่ได้");
        }
    };
}