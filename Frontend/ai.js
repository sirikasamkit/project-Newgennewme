// ===================================
// AI, Camera, and BMI Logic
// ===================================

let miniChartInstance = null;

window.fetchAndRenderMiniChart = async function (token) {
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

window.getBMIStatus = function (bmi, activity) {
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

window.calculateBMI = async function () {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const activity = 'general'; // Default for quick calc

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = window.getBMIStatus(bmi, activity);

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;
        document.getElementById('bmi-label-text').innerText = "ค่า BMI ของคุณคือ:";
        document.getElementById('result-area').style.display = "block";

        const resultArea = document.getElementById('result-area');
        const oldBox = document.getElementById('ai-plan');
        if (oldBox) oldBox.remove();

        window.generateAiPlan(bmi, weight, height, status, activity, resultArea);
    }
}

window.calculateBMIFromProfile = async function () {
    const weight = document.getElementById('profile-weight').value;
    const height = document.getElementById('profile-height').value;
    const activity = document.getElementById('profile-activity').value || 'general';

    if (weight > 0 && height > 0) {
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
        const status = window.getBMIStatus(bmi, activity);

        document.getElementById('bmi-value').innerText = bmi;
        document.getElementById('bmi-status').innerText = status;

        const label = document.getElementById('bmi-label-text');
        if (label) {
            label.innerText = activity === 'bodybuilder' ? "ค่า BMI (หมวดนักกล้าม) คือ:" : "ค่า BMI ของคุณคือ:";
        }

        document.getElementById('result-area').style.display = "block";

        const resultArea = document.getElementById('result-area');
        const oldBox = document.getElementById('ai-plan');
        if (oldBox) oldBox.remove();

        window.generateAiPlan(bmi, weight, height, status, activity, resultArea);
    } else {
        if (window.showToast) window.showToast('warning', 'กรุณากรอกน้ำหนักและส่วนสูงในโปรไฟล์ และกดบันทึกโปรไฟล์ก่อนครับ');
    }
}

window.formatAiText = function (text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color: #0ea5e9; text-decoration: underline; font-weight: bold;">$1</a>')
        .replace(/\n/g, '<br>');
}

window.generateAiPlan = async function (bmi, weight, height, status, activity, resultArea) {
    const aiResponseBox = document.createElement('div');
    aiResponseBox.id = "ai-plan";
    resultArea.appendChild(aiResponseBox);

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
            headers['Authorization'] = `Bearer ${token}`;
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

        const formattedPlan = window.formatAiText(data.plan);

        aiResponseBox.innerHTML = `
            <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #0ea5e9;">
                <h3 style="color: #162938; margin-bottom: 10px;">📋 แผนสุขภาพจาก NeWGen NewME AI:</h3>
                <div style="line-height: 1.6; color: #333;">${formattedPlan}</div>
            </div>`;

    } catch (error) {
        aiResponseBox.innerHTML = `
            <div style="background: rgba(255,255,255,0.6); padding: 15px; border-radius: 10px; margin-top: 10px; text-align: left; border-left: 5px solid #ef4444;">
                <p style='color:#ef4444; margin-bottom: 15px;'>❌ เกิดข้อผิดพลาด: ${error.message}</p>
                <button onclick="window.generateAiPlan('${bmi}', '${weight}', '${height}', '${status}', '${activity}', document.getElementById('result-area'))" style="background: #0ea5e9; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.3s;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">ลองอีกครั้ง 🔄</button>
            </div>`;
    }
}

// ===================================
// Camera & Upload Logic
// ===================================

let cameraStream = null;
let capturedImageBlob = null;

window.startCamera = async function () {
    const cameraContainer = document.getElementById('camera-container');
    const video = document.getElementById('camera-stream');
    const btnAnalyze = document.getElementById('btn-analyze-food');
    const previewContainer = document.getElementById('image-preview-container');

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = cameraStream;
        cameraContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        btnAnalyze.style.display = 'none';
        capturedImageBlob = null;
    } catch (err) {
        if (window.showToast) window.showToast('error', 'ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การอนุญาตครับ');
        console.error(err);
    }
}

window.stopCamera = function () {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }
    document.getElementById('camera-container').style.display = 'none';
    cameraStream = null;
}

window.captureImage = function () {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('camera-canvas');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');
    const btnAnalyze = document.getElementById('btn-analyze-food');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
        capturedImageBlob = blob;
        previewImg.src = URL.createObjectURL(blob);
        previewContainer.style.display = 'block';
        btnAnalyze.style.display = 'inline-block';

        window.stopCamera();
    }, 'image/jpeg', 0.9);
}

window.analyzeFoodImage = async function () {
    const fileInput = document.getElementById('food-image');
    const resultArea = document.getElementById('food-result-area');
    const contentArea = document.getElementById('food-analysis-content');

    if (fileInput.files.length === 0 && !capturedImageBlob) {
        if (window.showToast) window.showToast('warning', "กรุณาเลือกรูปภาพหรือถ่ายจากกล้องก่อนครับ");
        return;
    }

    const formData = new FormData();
    if (capturedImageBlob) {
        formData.append('image', capturedImageBlob, 'capture.jpg');
    } else {
        formData.append('image', fileInput.files[0]);
    }

    resultArea.style.display = "block";

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
            body: formData
        });

        const data = await response.json();
        if (typeof Swal !== 'undefined') Swal.close();
        if (!response.ok) throw new Error(data.error || "AI Error");

        const analysisText = data.analysis;
        contentArea.innerHTML = analysisText.replace(/\n/g, '<br>');

        const proteinMatch = analysisText.match(/(?:protein|โปรตีน).*?(\d+)\s*(?:g|กรัม)/i);
        const carbMatch = analysisText.match(/(?:carb|คาร์บ|^คาร์โบไฮเดรต).*?(\d+)\s*(?:g|กรัม)/i);
        const fatMatch = analysisText.match(/(?:fat|ไขมัน).*?(\d+)\s*(?:g|กรัม)/i);

        let p = proteinMatch ? parseInt(proteinMatch[1]) : 0;
        let c = carbMatch ? parseInt(carbMatch[1]) : 0;
        let f = fatMatch ? parseInt(fatMatch[1]) : 0;

        if (p > 0 || c > 0 || f > 0) {
            if (window.renderMacroChart) window.renderMacroChart(p, c, f);
        } else {
            document.getElementById('macro-chart-container').style.display = 'none';
        }

    } catch (error) {
        contentArea.innerHTML = `
            <div style="padding: 10px; background: rgba(255,0,0,0.05); border-radius: 8px;">
                <p style='color:#ef4444; margin-bottom: 15px;'>❌ เกิดข้อผิดพลาด: ${error.message}</p>
                <button onclick="window.analyzeFoodImage()" style="background: #0ea5e9; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; transition: 0.3s;" onmouseover="this.style.background='#0284c7'" onmouseout="this.style.background='#0ea5e9'">ลองสแกนอีกครั้ง 🔄</button>
            </div>
        `;
    }
}

window.previewImage = function (event) {
    const reader = new FileReader();
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('preview-img');
    const btnAnalyze = document.getElementById('btn-analyze-food');

    capturedImageBlob = null;

    reader.onload = function () {
        if (reader.readyState === 2) {
            previewImg.src = reader.result;
            previewContainer.style.display = "block";
            btnAnalyze.style.display = "inline-block";
        }
    }

    if (event.target.files[0]) {
        reader.readAsDataURL(event.target.files[0]);
    }
}

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
                backgroundColor: ['#f43f5e', '#38bdf8', '#facc15'],
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

// AI Chat Logic
window.toggleChat = function () {
    const win = document.getElementById('chat-window');
    if (win.style.display === 'none' || win.style.display === '') {
        win.style.display = 'flex';
        if (window.playPremiumSound) window.playPremiumSound('pop');
    } else {
        win.style.display = 'none';
    }
}

window.sendChatMessage = async function () {
    const input = document.getElementById('chat-input');
    const msgContainer = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    msgContainer.innerHTML += `
        <div class="chat-msg user-msg">
            ${text}
        </div>
    `;
    input.value = '';
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const thinkingId = 'ai-thinking-' + Date.now();
    msgContainer.innerHTML += `
        <div id="${thinkingId}" class="chat-msg ai-msg">
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
            <div class="chat-msg ai-msg">
                ${window.formatAiText(data.reply)}
            </div>
        `;
        msgContainer.scrollTop = msgContainer.scrollHeight;
        if (window.playPremiumSound) window.playPremiumSound('confirm');
    } catch (e) {
        document.getElementById(thinkingId).innerText = "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อ";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.sendChatMessage();
        });
    }
});

window.shareProgress = async function () {
    const shareCard = document.getElementById('share-card');
    if (!shareCard) {
        console.error("share-card not found");
        return;
    }

    Swal.fire({
        title: 'กำลังสร้างรูปภาพความสำเร็จ...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            shareCard.style.backgroundColor = '#1e293b';
            shareCard.style.color = '#f8fafc';
        } else {
            shareCard.style.backgroundColor = '#ffffff';
        }

        const canvas = await html2canvas(shareCard, {
            scale: 2,
            useCORS: true,
            backgroundColor: isDark ? '#1e293b' : '#ffffff'
        });

        shareCard.style.backgroundColor = '';
        shareCard.style.color = '';

        const imgData = canvas.toDataURL("image/jpeg", 0.9);

        Swal.close();

        const link = document.createElement('a');
        link.download = `NewGenNewMe_Progress_${new Date().toLocaleDateString('en-CA')}.jpg`;
        link.href = imgData;
        link.click();

        if (window.showToast) window.showToast('success', 'บันทึกรูปภาพสำเร็จ! เตรียมแชร์อวดเพื่อนได้เลย 🚀');

    } catch (e) {
        Swal.close();
        console.error("Screenshot failed:", e);
        if (window.showToast) window.showToast('error', 'เกิดข้อผิดพลาดในการบันทึกภาพ');
    }
}

window.checkAndAssignBadges = function (token) {
    if (!token) return;
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
                if (window.playPremiumSound) window.playPremiumSound('badge');
            }

            badgeContainer.innerHTML = badgesHtml;
        }).catch(e => console.error("Badge parsing error:", e));
}

// ฟังก์ชันสำหรับหน้า Services (แจ้งปัญหา)
window.openContactForm = function () {
    window.location.href = "contact.html";
}
