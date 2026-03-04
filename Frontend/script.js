// ===================================
// Theme Options (Light/Dark Mode)
// ===================================
function applyTheme(theme) {
    const btn = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        if (btn) btn.innerHTML = '<ion-icon name="sunny-outline"></ion-icon>';
    } else {
        document.body.classList.remove('dark-mode');
        if (btn) btn.innerHTML = '<ion-icon name="moon-outline"></ion-icon>';
    }
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
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

// ===================================
// Auth Logic (Login/Logout/Dashboard)
// ===================================

function checkLoginStatus() {
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
        if (navHistoryBtn) navHistoryBtn.style.display = 'inline-block';

        const displayUsername = document.getElementById('display-username');
        if (displayUsername) {
            displayUsername.innerText = user;
        }
        loadProfile();

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
        if (navHistoryBtn) navHistoryBtn.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('is_admin');
    checkLoginStatus();
}

// ทำงานเมื่อเว็บเปิดขึ้นมา
window.onload = () => {
    // 1. โหลดธีม
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // 2. โหลดสถานะล็อคอิน
    checkLoginStatus();

    // 3. Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker Registered!', reg))
            .catch(err => console.log('Service Worker registration failed: ', err));
    }
};

async function loadProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (document.getElementById('profile-age')) document.getElementById('profile-age').value = data.age || '';
            if (document.getElementById('profile-gender')) document.getElementById('profile-gender').value = data.gender || '';
            if (document.getElementById('profile-height')) document.getElementById('profile-height').value = data.height || '';
            if (document.getElementById('profile-weight')) document.getElementById('profile-weight').value = data.weight || '';
            if (document.getElementById('profile-goal')) document.getElementById('profile-goal').value = data.goal_weight || '';
            if (document.getElementById('profile-activity')) document.getElementById('profile-activity').value = data.activity || 'general';

            // Update Goal Widget
            if (typeof updateGoalProgress === 'function') {
                updateGoalProgress(data.weight, data.goal_weight);
            }
        }
    } catch (error) {
        console.error("Error loading profile", error);
    }
}

async function saveProfile() {
    const token = localStorage.getItem('token');
    const age = document.getElementById('profile-age').value;
    const gender = document.getElementById('profile-gender').value;
    const height = document.getElementById('profile-height').value;
    const weight = document.getElementById('profile-weight').value;
    const goal_weight = document.getElementById('profile-goal').value;
    const activity = document.getElementById('profile-activity').value;

    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ age, gender, height, weight, goal_weight, activity })
        });
        if (response.ok) {
            showToast('success', 'บันทึกโปรไฟล์เรียบร้อยแล้ว');
            if (typeof updateGoalProgress === 'function') {
                updateGoalProgress(weight, goal_weight);
            }
        } else {
            showToast('error', 'เกิดข้อผิดพลาดในการบันทึกโปรไฟล์');
        }
    } catch (error) {
        showToast('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
}

function updateGoalProgress(current, goal) {
    const container = document.getElementById('goal-progress-container');
    const noGoalText = document.getElementById('no-goal-text');
    if (container && noGoalText) {
        if (current > 0 && goal > 0) {
            container.style.display = 'block';
            noGoalText.style.display = 'none';

            document.getElementById('display-current-weight').innerText = current;
            document.getElementById('display-goal-weight').innerText = goal;

            let diff = (current - goal).toFixed(1);
            let text = "";
            let color = "#0ea5e9";

            if (diff > 0) {
                text = `📉 เหลืออีก ${diff} กก. เพื่อบรรลุเป้าหมาย (ลดน้ำหนัก)`;
                color = "#f59e0b"; // orange
            } else if (diff < 0) {
                text = `📈 เหลืออีก ${Math.abs(diff)} กก. เพื่อบรรลุเป้าหมาย (เพิ่มน้ำหนัก)`;
                color = "#10b981"; // green
            } else {
                text = `🎉 ยินดีด้วย! คุณถึงเป้าหมายแล้ว`;
                color = "#0ea5e9";
            }

            document.getElementById('goal-status-text').innerText = text;
            document.getElementById('goal-status-text').style.color = color;
        } else {
            container.style.display = 'none';
            noGoalText.style.display = 'block';
        }
    }
}

let miniChartInstance = null;

async function fetchAndRenderMiniChart(token) {
    try {
        const response = await fetch('/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.bmi && data.bmi.length > 0) {
                document.getElementById('mini-chart-container').style.display = 'block';

                const ctx = document.getElementById('miniHistoryChart').getContext('2d');

                const labels = data.bmi.slice(-5).map(item => {
                    const date = new Date(item.created_at);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                });
                const bmiValues = data.bmi.slice(-5).map(item => item.bmi);

                if (miniChartInstance) {
                    miniChartInstance.destroy();
                }

                // Check Dark Mode
                const isDarkMode = document.body.classList.contains('dark-mode');
                const textColor = isDarkMode ? '#f8fafc' : '#1e293b';
                const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

                miniChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'BMI Trend',
                            data: bmiValues,
                            borderColor: '#0ea5e9',
                            backgroundColor: 'rgba(14, 165, 233, 0.2)',
                            borderWidth: 2,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#0ea5e9',
                            pointBorderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            x: {
                                ticks: { color: textColor, font: { size: 10 } },
                                grid: { display: false }
                            },
                            y: {
                                ticks: { color: textColor, font: { size: 10 } },
                                grid: { color: gridColor }
                            }
                        }
                    }
                });
            } else {
                document.getElementById('mini-chart-container').style.display = 'none';
            }
        }
    } catch (error) {
        console.error("Mini chart fetch error", error);
    }
}

function getBMIStatus(bmi, activity) {
    if (activity === 'bodybuilder') {
        if (bmi < 18.5) return "น้ำหนักน้อย (นักกล้ามสายลีน)";
        if (bmi < 25) return "หุ่นนายแบบ/นางแบบ (Muscle Focus)";
        if (bmi < 32) return "หุ่นนักกีฬา / กล้ามเนื้อแน่น (Athletic)";
        return "นักกล้ามสายยักษ์ / Bulk Mode";
    } else {
        if (bmi < 18.5) return "น้ำหนักน้อย / ผอม";
        if (bmi < 23) return "ปกติ (สุขภาพดี)";
        if (bmi < 25) return "ท้วม / โรคอ้วนระดับ 1";
        if (bmi < 30) return "อ้วน / โรคอ้วนระดับ 2";
        return "อ้วนมาก / โรคอ้วนระดับ 3";
    }
}

// แก้ไขในไฟล์ script.js ของคุณ
async function calculateBMI() {
    const weight = document.getElementById('weight').value; // ดึงค่าน้ำหนักจากหน้าเว็บ
    const height = document.getElementById('height').value; // ดึงค่าส่วนสูงจากหน้าเว็บ
    const activity = 'general'; // Default for quick calc

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = getBMIStatus(bmi, activity);

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;
        document.getElementById('bmi-label-text').innerText = "ค่า BMI ของคุณคือ:";
        document.getElementById('result-area').style.display = "block";

        const resultArea = document.getElementById('result-area');
        const oldBox = document.getElementById('ai-plan');
        if (oldBox) oldBox.remove();

        generateAiPlan(bmi, weight, height, status, activity, resultArea);
    }
}

async function calculateBMIFromProfile() {
    const weight = document.getElementById('profile-weight').value;
    const height = document.getElementById('profile-height').value;
    const activity = document.getElementById('profile-activity').value || 'general';

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = getBMIStatus(bmi, activity);

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;

        // Update label if bodybuilder
        const label = document.getElementById('bmi-label-text');
        if (label) {
            label.innerText = activity === 'bodybuilder' ? "ค่า BMI (หมวดนักกล้าม) คือ:" : "ค่า BMI ของคุณคือ:";
        }

        document.getElementById('result-area').style.display = "block";

        const resultArea = document.getElementById('result-area');
        const oldBox = document.getElementById('ai-plan');
        if (oldBox) oldBox.remove();

        generateAiPlan(bmi, weight, height, status, activity, resultArea);
    } else {
        showToast('warning', 'กรุณากรอกน้ำหนักและส่วนสูงในโปรไฟล์ และกดบันทึกโปรไฟล์ก่อนครับ');
    }
}

function formatAiText(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold: **text**
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #0ea5e9; text-decoration: underline; font-weight: bold;">$1</a>') // Link: [text](url)
        .replace(/\n/g, '<br>'); // Newlines
}

async function generateAiPlan(bmi, weight, height, status, activity, resultArea) {
    const aiResponseBox = document.createElement('div');
    aiResponseBox.id = "ai-plan";
    resultArea.appendChild(aiResponseBox);

    // Premium Loading UI
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังวิเคราะห์แผน...',
            html: '🤖 AI กำลังสร้างตารางโภชนาการสำหรับคุณ',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        aiResponseBox.innerHTML = `
            <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #0ea5e9;">
                <h3 style="color: #162938; margin-bottom: 10px;">📋 แผนสุขภาพจาก NeWGen NewME AI:</h3>
                <div style="line-height: 1.6; color: #333;">
                    <span class="skeleton-box" style="width: 100%; margin-bottom: 10px;"></span>
                    <span class="skeleton-box" style="width: 90%; margin-bottom: 10px;"></span>
                    <span class="skeleton-box" style="width: 80%; margin-bottom: 10px;"></span>
                    <span class="skeleton-box" style="width: 40%; margin-bottom: 10px;"></span>
                </div>
            </div>`;
    }

    try {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`; // ส่ง token ไปด้วยเผื่อ Backend อยากเก็บประวัติ
        }

        const dateKey = new Date().toISOString().split('T')[0];
        const mood = localStorage.getItem(`mood_${dateKey}`) || 'neutral';
        const sleep = localStorage.getItem(`sleep_${dateKey}`) || 'not-specified';

        const response = await fetch('/api/generate-plan', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ bmi, weight, height, status, activity, mood, sleep })
        });

        const data = await response.json();

        if (typeof Swal !== 'undefined') Swal.close();

        if (!response.ok) throw new Error(data.error || "AI Error");

        const formattedPlan = formatAiText(data.plan);

        aiResponseBox.innerHTML = `
            <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #0ea5e9;">
                <h3 style="color: #162938; margin-bottom: 10px;">📋 แผนสุขภาพจาก NeWGen NewME AI:</h3>
                <div style="line-height: 1.6; color: #333;">${formattedPlan}</div>
            </div>`;

    } catch (error) {
        aiResponseBox.innerHTML = `<p style='color:red;'>เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
}

// 4. ฟังก์ชันสำหรับหน้า Services (แจ้งปัญหา)
function openContactForm() {
    window.location.href = "contact.html";
}

// ===================================
// Camera & Upload Logic
// ===================================

let cameraStream = null;
let capturedImageBlob = null; // Store captured image here

async function startCamera() {
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-stream');
    const btnAnalyze = document.getElementById('btn-analyze-food');
    const previewContainer = document.getElementById('image-preview-container');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = cameraStream;
        cameraContainer.style.display = 'block';
        previewContainer.style.display = 'none'; // Hide old preview
        btnAnalyze.style.display = 'none'; // Hide analyze button till photo is taken
        capturedImageBlob = null; // Reset
    } catch (err) {
        showToast('error', 'ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การอนุญาตครับ');
        console.error(err);
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-container').style.display = 'none';
    cameraStream = null;
}

function captureImage() {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');
    const btnAnalyze = document.getElementById('btn-analyze-food');

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Handle mirrored image by flipping it back (since we mirrored it via CSS for user perspective)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    canvas.toBlob((blob) => {
        capturedImageBlob = blob;
        previewImg.src = URL.createObjectURL(blob);
        previewContainer.style.display = 'block';
        btnAnalyze.style.display = 'inline-block';

        // Stop camera after capture
        stopCamera();
    }, 'image/jpeg', 0.9);
}

async function analyzeFoodImage() {
    const fileInput = document.getElementById('food-image');
    const resultArea = document.getElementById('food-result-area');
    const contentArea = document.getElementById('food-analysis-content');

    if (fileInput.files.length === 0 && !capturedImageBlob) {
        showToast('warning', "กรุณาเลือกรูปภาพหรือถ่ายจากกล้องก่อนครับ");
        return;
    }

    const formData = new FormData();
    if (capturedImageBlob) {
        formData.append('image', capturedImageBlob, 'capture.jpg');
    } else {
        formData.append('image', fileInput.files[0]);
    }

    resultArea.style.display = "block";

    // Premium Loading UI
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังสแกนอาหาร...',
            html: '📸 AI กำลังมองดูว่าเมนูนี้มีกี่แคลอรี่',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    } else {
        contentArea.innerHTML = "<i>AI กำลังมองดูอาหารของคุณ...</i>";
    }

    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/analyze-food', {
            method: 'POST',
            headers: headers,
            body: formData // ส่งเป็น FormData สำหรับไฟล์
        });

        const data = await response.json();
        if (typeof Swal !== 'undefined') Swal.close();
        if (!response.ok) throw new Error(data.error || "AI Error");

        // แสดงผลลัพธ์ที่ได้จาก AI (Gemini)
        const analysisText = data.analysis;
        contentArea.innerHTML = analysisText.replace(/\n/g, '<br>');

        // Extract Macros
        const proteinMatch = analysisText.match(/(?:protein|โปรตีน).*?(\d+)\s*(?:g|กรัม)/i);
        const carbMatch = analysisText.match(/(?:carb|คาร์บ|^คาร์โบไฮเดรต).*?(\d+)\s*(?:g|กรัม)/i);
        const fatMatch = analysisText.match(/(?:fat|ไขมัน).*?(\d+)\s*(?:g|กรัม)/i);

        let p = proteinMatch ? parseInt(proteinMatch[1]) : 0;
        let c = carbMatch ? parseInt(carbMatch[1]) : 0;
        let f = fatMatch ? parseInt(fatMatch[1]) : 0;

        if (p > 0 || c > 0 || f > 0) {
            renderMacroChart(p, c, f);
        } else {
            document.getElementById('macro-chart-container').style.display = 'none';
        }

    } catch (error) {
        contentArea.innerHTML = `<p style='color:red;'>เกิดข้อผิดพลาด: ${error.message}</p>`;
    }
}

function previewImage(event) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');
    const btnAnalyze = document.getElementById('btn-analyze-food');

    // Reset captured blob if user selects a file instead
    capturedImageBlob = null;

    reader.onload = function () {
        if (reader.readyState === 2) {
            previewImg.src = reader.result;
            previewContainer.style.display = "block"; // แสดง Container เมื่อโหลดรูปเสร็จ
            btnAnalyze.style.display = "inline-block"; // Show button
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
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) { // เช็ค response.ok แทน status text
                showToast('success', "ยินดีต้อนรับคุณ " + result.user);
                // ปิดหน้าต่าง Login เมื่อสำเร็จ
                const wrapper = document.querySelector('.wrapper');
                wrapper.classList.remove('active-popup');

                // (Optional) เก็บ token หรือ user data ลง localStorage
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('token', result.token);
                localStorage.setItem('is_admin', result.is_admin);

                checkLoginStatus(); // อัปเดตหน้าจอทันที

            } else {
                showToast('error', result.message || "Login failed");
            }
        } catch (error) {
            console.error("Login Error:", error);
            showToast('error', "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
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
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                showToast('success', "สมัครสมาชิกสำเร็จ! กรุณา Login");
                // สลับไปหน้า Login
                const wrapper = document.querySelector('.wrapper');
                wrapper.classList.remove('active');
            } else {
                showToast('error', result.error || "Registration failed");
            }

        } catch (error) {
            console.error("Register Error:", error);
            showToast('error', "เชื่อมต่อ Server ไม่ได้");
        }
    };
}

// ===================================
// History View Logic
// ===================================
async function loadHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('warning', "กรุณาเข้าสู่ระบบก่อนดึงประวัติครับ");
        return;
    }
    const content = document.getElementById('history-content');
    content.innerHTML = `
        <div style="margin-left: 20px;">
            <span class="skeleton-box" style="width: 30%; margin-bottom: 10px; height: 1.5em;"></span><br>
            <span class="skeleton-box" style="width: 100%; margin-bottom: 5px;"></span>
            <span class="skeleton-box" style="width: 90%; margin-bottom: 5px;"></span>
            <span class="skeleton-box" style="width: 95%; margin-bottom: 5px;"></span>
        </div>`;
    content.style.display = "block";

    try {
        const response = await fetch('/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();

            // Render Chart if on History page
            renderHistoryChart(data.bmi);

            let html = `<h3 style="color: #0ea5e9;">ประวัติ BMI ล่าสุด</h3><ul style="margin-left: 20px;">`;
            if (data.bmi.length === 0) html += `<li>ยังไม่มีประวัติ</li>`;
            data.bmi.forEach(b => {
                html += `<li><strong style="color: #455a64;">${b.created_at}</strong>: BMI = ${b.bmi} (${b.status})</li>`;
            });
            html += `</ul><hr style="margin: 15px 0; border: 1px solid rgba(0,0,0,0.1);">`;

            html += `<h3 style="color: #0ea5e9;">การวิเคราะห์อาหารที่บันทึกไว้</h3><ul style="margin-left: 20px;">`;
            if (data.foods.length === 0) html += `<li>ยังไม่มีประวัติ</li>`;
            data.foods.forEach(f => {
                html += `<li><strong style="color: #455a64;">${f.created_at}</strong>: ${f.food_name} <br> <span style="font-size: 0.9em; display:block; margin-top:5px;">${f.analysis.replace(/\n/g, '<br>')}</span></li>`;
            });
            html += `</ul><hr style="margin: 15px 0; border: 1px solid rgba(0,0,0,0.1);">`;

            html += `<h3 style="color: #0ea5e9;">แผนสุขภาพจาก AI ล่าสุด</h3>`;
            if (data.plans.length === 0) html += `<p style="margin-left: 20px;">ยังไม่มีประวัติ</p>`;
            data.plans.forEach(p => {
                html += `<div style="background: rgba(255,255,255,0.7); padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 5px solid #0ea5e9;">
                          <small style="color: #888;">${p.created_at}</small><br><br>
                          ${p.plan_details.replace(/\n/g, '<br>')}
                         </div>`;
            });

            content.innerHTML = html;
        } else {
            content.innerHTML = "<p style='color:red;'>ดึงข้อมูลประวัติไม่สำเร็จ</p>";
        }
    } catch (error) {
        content.innerHTML = "<p style='color:red;'>ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>";
    }
}

// Chart Instance 
let historyChartInstance = null;

function renderHistoryChart(bmiData) {
    const chartContainer = document.getElementById('chart-container');
    const ctx = document.getElementById('historyChart');
    if (!chartContainer || !ctx || typeof Chart === 'undefined') return;

    if (bmiData.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';

    // Data comes sorted DESC (newest first). Let's reverse it to show oldest to newest left-to-right
    const ascendingData = [...bmiData].reverse();

    const labels = ascendingData.map(b => b.created_at.split(' ')[0]); // Get just dates
    const weights = ascendingData.map(b => b.weight);

    if (historyChartInstance) {
        historyChartInstance.destroy(); // Clear old chart
    }

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'น้ำหนัก (กก.)',
                data: weights,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.2)',
                borderWidth: 2,
                pointBackgroundColor: '#162938',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}


// ===================================
// Ultimate UX Features (Quotes, Water, Badges)
// ===================================

const healthQuotes = [
    "สุขภาพดีเริ่มต้นจากจานอาหารของคุณ 🥗",
    "การออกกำลังกายที่ยากที่สุด คือการเริ่มต้น 💪",
    "ดื่มน้ำให้เพียงพอ ช่วยให้สมองปลอดโปร่ง 💧",
    "อย่ายอมแพ้ ความพยายามในวันนี้คือผลลัพธ์ที่ดีในวันพรุ่งนี้ ✨",
    "นอนหลับให้เพียงพอ คือยาอายุวัฒนะที่ดีที่สุด 🌙",
    "สร้างวินัยทีละนิด ดีกว่าหักโหมแล้วล้มเลิก 🏃‍♂️",
    "สุขภาพดีไม่ใช่จุดหมาย แต่คือวิถีชีวิต 🌱"
];

function initDailyQuote() {
    const quoteContainer = document.getElementById('daily-quote-container');
    const quoteText = document.getElementById('daily-quote-text');
    if (quoteContainer && quoteText) {
        // Use current date as seed
        const todayIndex = Math.floor(Date.now() / 86400000) % healthQuotes.length;
        quoteText.innerText = healthQuotes[todayIndex];
        quoteContainer.style.display = 'block';

        // Dark mode adaptation
        if (document.body.classList.contains('dark-mode')) {
            quoteContainer.style.background = 'rgba(245, 158, 11, 0.2)';
            quoteContainer.style.color = '#f8fafc';
        }
    }
}

// Water Tracker Logic
function getWaterKey() {
    const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' formatting in local timezone
    return `water_intake_${today}`;
}

function getWaterCount() {
    return parseInt(localStorage.getItem(getWaterKey())) || 0;
}

function renderWaterTracker() {
    const count = getWaterCount();
    const container = document.getElementById('water-glasses');
    if (!container) return;

    let html = '';
    for (let i = 0; i < 8; i++) {
        if (i < count) {
            html += '🥛 ';
        } else {
            html += '<span style="opacity: 0.3;">🥛</span> ';
        }
    }
    container.innerHTML = html;
}

window.addWater = function () {
    let count = getWaterCount();
    if (count < 8) {
        localStorage.setItem(getWaterKey(), count + 1);
        renderWaterTracker();
        showToast('success', 'ดื่มน้ำเพิ่ม 1 แก้ว เก่งมาก! 💧');
    } else {
        localStorage.setItem(getWaterKey(), count + 1); // allow more than 8 secretly
        renderWaterTracker();
        showToast('info', 'คุณดื่มน้ำถึงเป้าหมายแล้ววันนี้! 🎉');
    }
}

window.resetWater = function () {
    localStorage.setItem(getWaterKey(), 0);
    renderWaterTracker();
}

window.checkAndAssignBadges = function (token) {
    if (!token) return;
    // Check if history exists to assign logic
    fetch('/api/history', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
            const badgeContainer = document.getElementById('user-badges');
            if (!badgeContainer) return;

            let badgesHtml = '';
            if (data.bmi && data.bmi.length > 0) badgesHtml += `<span title="เริ่มต้นดูแลตัวเอง" style="cursor:help;">🔰</span>`;
            if (data.bmi && data.bmi.length >= 3) badgesHtml += `<span title="นักบันทึกตัวยง (บันทึกเกิน 3 ครั้ง)" style="cursor:help;">🔥</span>`;
            if (data.foods && data.foods.length > 0) badgesHtml += `<span title="นักสแกนอาหาร" style="cursor:help;">📸</span>`;

            if (badgeContainer.innerHTML !== badgesHtml && badgesHtml !== '') {
                playPremiumSound('badge');
            }

            badgeContainer.innerHTML = badgesHtml;
        }).catch(e => console.error("Badge parsing error:", e));
}

// ===================================
// Social Share (html2canvas)
// ===================================
window.shareProgress = async function () {
    const shareCard = document.getElementById('share-card');
    if (!shareCard) {
        console.error("share-card not found");
        return;
    }

    // Show loading
    Swal.fire({
        title: 'กำลังสร้างรูปภาพความสำเร็จ...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        // Temporary styling adjustments for better capture (e.g. handling dark mode)
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            shareCard.style.backgroundColor = '#1e293b';
            shareCard.style.color = '#f8fafc';
        } else {
            shareCard.style.backgroundColor = '#ffffff';
        }

        const canvas = await html2canvas(shareCard, {
            scale: 2, // higher resolution
            useCORS: true,
            backgroundColor: isDark ? '#1e293b' : '#ffffff'
        });

        // Revert temporary styles
        shareCard.style.backgroundColor = '';
        shareCard.style.color = '';

        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        Swal.close();

        // Download image triggering
        const link = document.createElement('a');
        link.download = `NewGenNewMe_Progress_${new Date().toLocaleDateString('en-CA')}.jpg`;
        link.href = imgData;
        link.click();

        showToast('success', 'บันทึกรูปภาพสำเร็จ! เตรียมแชร์อวดเพื่อนได้เลย 🚀');

    } catch (e) {
        Swal.close();
        console.error("Screenshot failed:", e);
        showToast('error', 'เกิดข้อผิดพลาดในการบันทึกภาพ');
    }
}

// ===================================
// Macro Donut Chart
// ===================================
let macroChartInstance = null;

window.renderMacroChart = function (protein, carbs, fat) {
    const container = document.getElementById('macro-chart-container');
    const ctx = document.getElementById('foodMacroChart');
    if (!container || !ctx) return;

    container.style.display = 'block';

    if (macroChartInstance) {
        macroChartInstance.destroy();
    }

    macroChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['โปรตีน (g)', 'คาร์โบไฮเดรต (g)', 'ไขมัน (g)'],
            datasets: [{
                data: [protein, carbs, fat],
                backgroundColor: [
                    '#f43f5e', // Rose for Protein
                    '#38bdf8', // Sky for Carbs
                    '#facc15'  // Yellow for Fat
                ],
                borderWidth: 2,
                borderColor: document.body.classList.contains('dark-mode') ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.body.classList.contains('dark-mode') ? '#f8fafc' : '#1e293b',
                        font: { size: 12 }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// ===================================
// Extreme Premium UX: Mood & Sleep
// ===================================
const getWellnessDateKey = () => new Date().toISOString().split('T')[0];

window.setMood = function (mood) {
    localStorage.setItem(`mood_${getWellnessDateKey()}`, mood);
    updateMoodUI(mood);
    playPremiumSound('pop');
    showToast('success', `บันทึกอารมณ์ของคุณแล้ว ✨`);
}

function updateMoodUI(activeMood) {
    const moods = ['happy', 'energetic', 'tired', 'stressed'];
    const moodLabels = {
        happy: 'วันนี้มีความสุขจัง! 😊',
        energetic: 'พลังงานเต็มร้อย! ⚡',
        tired: 'วันนี้เหนื่อยนิดหน่อย 😴',
        stressed: 'เครียดจังเลย 😟'
    };

    moods.forEach(m => {
        const el = document.getElementById(`mood-${m}`);
        if (el) {
            if (m === activeMood) el.classList.add('mood-emoji-active');
            else el.classList.remove('mood-emoji-active');
        }
    });

    const statusEl = document.getElementById('mood-status');
    if (statusEl && activeMood) {
        statusEl.innerText = moodLabels[activeMood];
        statusEl.style.fontWeight = 'bold';
    }
}

window.saveSleep = function () {
    const hours = document.getElementById('sleep-hours').value;
    localStorage.setItem(`sleep_${getWellnessDateKey()}`, hours);
    playPremiumSound('confirm');
    showToast('success', `บันทึกเวลาการนอน ${hours} ชม. เรียบร้อย 🌙`);
}

window.initWellnessSection = function () {
    const dateKey = getWellnessDateKey();
    const savedMood = localStorage.getItem(`mood_${dateKey}`);
    const savedSleep = localStorage.getItem(`sleep_${dateKey}`);

    if (savedMood) updateMoodUI(savedMood);
    if (savedSleep) document.getElementById('sleep-hours').value = savedSleep;
}

// ===================================
// Premium Features: Streaks, Snapshots, Chat
// ===================================

function updateStreak() {
    const lastLoginDate = localStorage.getItem('last_login_date');
    const today = new Date().toLocaleDateString('en-CA');
    let streak = parseInt(localStorage.getItem('user_streak')) || 0;

    if (lastLoginDate === today) {
        // Already logged in today, do nothing
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        if (lastLoginDate === yesterdayStr) {
            streak++;
        } else {
            streak = 1;
        }
        localStorage.setItem('user_streak', streak);
        localStorage.setItem('last_login_date', today);
    }

    const streakBadge = document.getElementById('streak-badge');
    const streakCount = document.getElementById('streak-count');
    if (streakBadge && streakCount) {
        streakCount.innerText = streak;
        streakBadge.style.display = streak > 0 ? 'inline-block' : 'none';
        if (streak >= 3) streakBadge.style.background = 'rgba(255, 69, 0, 0.2)';
    }
}

let weeklyWaterChartInstance = null;
let weeklySleepChartInstance = null;

function renderWeeklySnapshots() {
    const waterCtx = document.getElementById('weeklyWaterChart');
    const sleepCtx = document.getElementById('weeklySleepChart');
    if (!waterCtx || !sleepCtx) return;

    // Mocking 7 days data for demonstration 
    // In production, this would come from the /api/history or extra local storage keys
    const days = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
    const waterData = [6, 8, 5, 7, 8, 4, 6];
    const sleepData = [7, 6.5, 8, 7, 6, 9, 8.5];

    if (weeklyWaterChartInstance) weeklyWaterChartInstance.destroy();
    if (weeklySleepChartInstance) weeklySleepChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const color = isDark ? '#94a3b8' : '#64748b';

    weeklyWaterChartInstance = new Chart(waterCtx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'แก้ว',
                data: waterData,
                backgroundColor: '#38bdf8',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: color, font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: color, font: { size: 10 } }, beginAtZero: true }
            }
        }
    });

    weeklySleepChartInstance = new Chart(sleepCtx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'ชม.',
                data: sleepData,
                borderColor: '#4f46e5',
                tension: 0.4,
                fill: false,
                borderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: color, font: { size: 10 } }, grid: { display: false } },
                y: { ticks: { color: color, font: { size: 10 } }, beginAtZero: true }
            }
        }
    });
}

// AI Chat Logic
window.toggleChat = function () {
    const win = document.getElementById('chat-window');
    if (win.style.display === 'none' || win.style.display === '') {
        win.style.display = 'flex';
        playPremiumSound('pop');
    } else {
        win.style.display = 'none';
    }
}

window.sendChatMessage = async function () {
    const input = document.getElementById('chat-input');
    const msgContainer = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    msgContainer.innerHTML += `
        <div style="background: #0ea5e9; color: white; padding: 10px; border-radius: 10px 10px 0 10px; margin-bottom: 10px; max-width: 80%; align-self: flex-end; margin-left: auto;">
            ${text}
        </div>
    `;
    input.value = '';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Thinking indicator
    const thinkingId = 'ai-thinking-' + Date.now();
    msgContainer.innerHTML += `
        <div id="${thinkingId}" style="background: #e2e8f0; padding: 10px; border-radius: 10px 10px 10px 0; margin-bottom: 10px; max-width: 80%;">
            AI กำลังพิมพ์...
        </div>
    `;
    msgContainer.scrollTop = msgContainer.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();

        document.getElementById(thinkingId).remove();

        msgContainer.innerHTML += `
            <div style="background: #e2e8f0; padding: 10px; border-radius: 10px 10px 10px 0; margin-bottom: 10px; max-width: 80%;">
                ${formatAiText(data.reply)}
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;
        playPremiumSound('confirm');
    } catch (e) {
        document.getElementById(thinkingId).innerText = "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ";
    }
}

// Listen for Enter key in chat input
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }
});
