// ===================================
// API & Data Handling Logic
// ===================================

window.loadProfile = async function () {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (document.getElementById('profile-username')) document.getElementById('profile-username').value = data.username || '';
            if (document.getElementById('profile-preview') && data.profile_image) {
                document.getElementById('profile-preview').src = data.profile_image;
            }
            if (document.getElementById('profile-age')) document.getElementById('profile-age').value = data.age || '';
            if (document.getElementById('profile-gender')) document.getElementById('profile-gender').value = data.gender || '';
            if (document.getElementById('profile-height')) document.getElementById('profile-height').value = data.height || '';
            if (document.getElementById('profile-weight')) document.getElementById('profile-weight').value = data.weight || '';
            if (document.getElementById('profile-goal')) document.getElementById('profile-goal').value = data.goal_weight || '';
            if (document.getElementById('profile-activity')) document.getElementById('profile-activity').value = data.activity || 'general';

            if (typeof updateGoalProgress === 'function') {
                updateGoalProgress(data.weight, data.goal_weight);
            }
        }
    } catch (error) {
        console.error("Error loading profile", error);
    }
}

window.saveProfile = async function () {
    const token = localStorage.getItem('token');
    const username = document.getElementById('profile-username').value;
    let profile_image = document.getElementById('profile-preview').src;

    // Don't save if it's just the placeholder URL
    if (profile_image.includes('placeholder.com')) {
        profile_image = null;
    }
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
            body: JSON.stringify({ username, age, gender, height, weight, goal_weight, activity, profile_image })
        });
        if (response.ok) {
            // Update local storage user name if changed
            localStorage.setItem('user', JSON.stringify(username));
            // Update UI globally
            if (window.checkLoginStatus) window.checkLoginStatus();

            if (window.showToast) window.showToast('success', 'บันทึกโปรไฟล์เรียบร้อยแล้ว');
            if (typeof updateGoalProgress === 'function') {
                updateGoalProgress(weight, goal_weight);
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            console.error('Server error saving profile:', response.status, errData);
            if (window.showToast) window.showToast('error', `เกิดข้อผิดพลาด: ${errData.error || 'เซิร์ฟเวอร์ปฏิเสธการบันทึก'}`);
        }
    } catch (error) {
        console.error('Fetch error saving profile:', error);
        if (window.showToast) window.showToast('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ (อาจเป็นเพราะไฟล์ใหญ่เกินไป หรือเซิร์ฟเวอร์ค้าง)');
    }
}

window.updateGoalProgress = function (current, goal) {
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

// Chart Instance 
window.historyChartInstance = null;

window.renderHistoryChart = function (bmiData) {
    const chartContainer = document.getElementById('chart-container');
    const ctx = document.getElementById('historyChart');
    if (!chartContainer || !ctx || typeof Chart === 'undefined') return;

    if (bmiData.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }

    chartContainer.style.display = 'block';

    const ascendingData = [...bmiData].reverse();
    const labels = ascendingData.map(b => b.created_at.split(' ')[0]);
    const weights = ascendingData.map(b => b.weight);

    if (window.historyChartInstance) {
        window.historyChartInstance.destroy();
    }

    window.historyChartInstance = new Chart(ctx, {
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

let currentHistoryPage = 1;

window.loadHistory = async function (page = 1, append = false) {

    const token = localStorage.getItem('token');
    if (!token) {
        if (window.showToast) window.showToast('warning', "กรุณาเข้าสู่ระบบก่อนดึงประวัติครับ");
        return;
    }

    currentHistoryPage = page;
    const bmiList = document.getElementById('bmi-list');
    const foodList = document.getElementById('food-list');
    const planList = document.getElementById('plan-list');
    const skeleton = document.getElementById('history-skeleton');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (!bmiList || !foodList || !planList) return;

    if (!append) {
        // Clear previous content and show skeleton
        bmiList.innerHTML = '';
        foodList.innerHTML = '';
        planList.innerHTML = '';
        if (skeleton) skeleton.style.display = 'block';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
    } else {
        const btn = document.getElementById('load-more-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<ion-icon name="refresh-outline" class="spin"></ion-icon> กำลังโหลด...';
        }
    }

    // Helper: Parse basic markdown from AI to HTML - High-Readability Point-by-Point version
    const parseMarkdown = (text) => {
        if (!text) return "";
        
        // 1. Clean up \n to actual newlines
        let cleanText = text.replace(/\\n/g, '\n');
        
        // 2. Identify and handle Important Notices (ข้อสำคัญ)
        cleanText = cleanText.replace(/(ข้อสำคัญ:.*?)(?=\n|$)/g, '<div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px; color: #92400e;"><strong>⚠️ $1</strong></div>');

        // 3. Detect and handle Headers (### Header)
        cleanText = cleanText.replace(/### (.*?)(?:\n|$)/g, '<h4 style="color:var(--text-accent); margin-top:30px; margin-bottom:15px; font-size:1.3em; border-left:5px solid #10b981; padding-left:15px; font-weight:700;">$1</h4>');

        // 4. Detect and handle Divide/Rule (---)
        cleanText = cleanText.replace(/---/g, '<hr style="border:0; border-top:2px solid var(--divider); margin:25px 0; opacity:0.3;">');

        // 5. Handle Bold/Italic
        cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-accent); font-weight:700;">$1</strong>');
        cleanText = cleanText.replace(/\*(.*?)\*/g, '<em style="color:#0ea5e9;">$1</em>');

        // 6. AGGRESSIVE POINT SPLITTING: Split by numbered lines (1. , 2. ) or bullet lines (* , - )
        const lines = cleanText.split('\n');
        let html = '';
        let currentGroup = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Handle Numbered List Points
            const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
            if (numMatch) {
                const num = numMatch[1];
                const content = numMatch[2];
                html += `<div class="hc-point">
                            <div class="hc-point-icon">${num}</div>
                            <div class="hc-point-content">${content}</div>
                         </div>`;
                return;
            }

            // Handle Bullet List Points
            const bulletMatch = trimmed.match(/^[\*\-]\s*(.*)/);
            if (bulletMatch) {
                const content = bulletMatch[1];
                html += `<div class="hc-point">
                            <div class="hc-point-icon" style="background: #38bdf8;"><ion-icon name="checkmark-outline"></ion-icon></div>
                            <div class="hc-point-content">${content}</div>
                         </div>`;
                return;
            }

            // If it's a "header" or "notice" already processed, just add it.
            if (trimmed.startsWith('<h4') || trimmed.startsWith('<div style="background:') || trimmed.startsWith('<hr')) {
                html += line;
                return;
            }

            // Generic Paragraph
            html += `<p style="margin-bottom: 12px; color: var(--text-main); font-size: 1.05em; line-height: 1.8;">${trimmed}</p>`;
        });

        return html;
    };



    try {
        const response = await fetch(`/api/history?page=${page}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (skeleton) skeleton.style.display = 'none';

        if (response.ok) {
            const data = await response.json();

            // Render Chart only on first load
            if (!append && window.renderHistoryChart) window.renderHistoryChart(data.bmi);

            // 1. BMI History
            let bmiHtml = '';
            if (data.bmi && data.bmi.length > 0) {
                data.bmi.forEach(b => {
                    const statusClass = b.status.includes('ปกติ') ? 'sp-normal' : (b.status.includes('อ้วน') ? 'sp-danger' : 'sp-warning');
                    bmiHtml += `
                        <div class="history-item-card">
                            <div class="hc-header">
                                <span class="hc-title">BMI Record</span>
                                <span class="hc-date"><ion-icon name="calendar-outline"></ion-icon> ${b.created_at}</span>
                            </div>
                            <div class="hc-stats">
                                <div class="hc-stat-box"><strong>น้ำหนัก:</strong> ${b.weight} กก.</div>
                                <div class="hc-stat-box"><strong>ส่วนสูง:</strong> ${b.height} ซม.</div>
                                <div class="hc-stat-box" style="background: var(--text-accent); color: white;"><strong>BMI:</strong> ${b.bmi}</div>
                            </div>
                            <div style="margin-top: 15px;">
                                <span class="status-pill ${statusClass}">${b.status}</span>
                            </div>
                        </div>`;
                });
            } else if (!append) {
                bmiHtml = `<div class="empty-state"><ion-icon name="fitness-outline"></ion-icon><p>ยังไม่มีประวัติการคำนวณ BMI</p></div>`;
            }

            // 2. Food Analysis
            let foodHtml = '';
            if (data.foods && data.foods.length > 0) {
                data.foods.forEach(f => {
                    foodHtml += `
                        <div class="history-item-card">
                            <div class="hc-header">
                                <span class="hc-title">🍽️ ${f.food_name}</span>
                                <span class="hc-date"><ion-icon name="time-outline"></ion-icon> ${f.created_at}</span>
                            </div>
                            <div class="history-card-body" style="margin-top: 10px; padding: 15px; background: rgba(0,0,0,0.03); border-radius: 12px; font-size: 0.95em;">
                                ${parseMarkdown(f.analysis)}
                            </div>
                        </div>`;
                });
            } else if (!append) {
                foodHtml = `<div class="empty-state"><ion-icon name="restaurant-outline"></ion-icon><p>ยังไม่มีประวัติการวิเคราะห์อาหาร</p></div>`;
            }

            // 3. AI Plans
            let planHtml = '';
            if (data.plans && data.plans.length > 0) {
                data.plans.forEach(p => {
                    // Pre-process for important notices
                    let planContent = parseMarkdown(p.plan_details);
                    planContent = planContent.replace(/(ข้อสำคัญ:.*?)(?=<br>|<\/p>|$)/g, '<div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; color: #92400e;"><strong>⚠️ $1</strong></div>');

                    planHtml += `
                        <div class="history-item-card" style="border-left: 6px solid #10b981; padding: 30px;">
                            <div class="hc-header" style="margin-bottom: 20px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="background: #10b981; color: white; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5em;">
                                        <ion-icon name="sparkles"></ion-icon>
                                    </div>
                                    <div>
                                        <span class="hc-title" style="color: #10b981; font-size: 1.3em;">AI Health Plan Report</span>
                                        <div class="hc-date" style="margin-top: 2px;">วิเคราะห์เมื่อ: ${p.created_at}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="history-card-body" style="font-size: 1.05em; line-height: 1.9; color: var(--text-main);">
                                ${planContent}
                            </div>
                        </div>`;
                });
            } else if (!append) {

                planHtml = `<div class="empty-state"><ion-icon name="sparkles-outline"></ion-icon><p>ยังไม่มีแผนสุขภาพจาก AI</p></div>`;
            }

            // Append or Replace
            if (append) {
                bmiList.innerHTML += bmiHtml;
                foodList.innerHTML += foodHtml;
                planList.innerHTML += planHtml;
            } else {
                bmiList.innerHTML = bmiHtml;
                foodList.innerHTML = foodHtml;
                planList.innerHTML = planHtml;
            }

            // Handle Load More button
            if (loadMoreContainer) {
                if (data.hasMore) {
                    loadMoreContainer.style.display = 'block';
                    const btn = document.getElementById('load-more-btn');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = 'โหลดข้อมูลเพิ่มเติม <ion-icon name="chevron-down-outline" style="margin-left: 5px;"></ion-icon>';
                    }
                } else {
                    loadMoreContainer.style.display = 'block';
                    loadMoreContainer.innerHTML = `<div style="color: #64748b; font-size: 0.9em; font-style: italic; margin-top: 20px;">-- สิ้นสุดรายการประวัติ --</div>`;
                }
            }

        } else {
            if (!append) bmiList.innerHTML = "<p style='color:red; text-align:center;'>ดึงข้อมูลประวัติไม่สำเร็จ</p>";
        }
    } catch (error) {
        console.error("Error loading history:", error);
        if (!append) bmiList.innerHTML = "<p style='color:red; text-align:center;'>ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>";
    }
}


// ===================================
// Ultimate UX Features (Quotes, Water, Streaks)
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

window.initDailyQuote = function () {
    const quoteContainer = document.getElementById('daily-quote-container');
    const quoteText = document.getElementById('daily-quote-text');
    if (quoteContainer && quoteText) {
        const todayIndex = Math.floor(Date.now() / 86400000) % healthQuotes.length;
        quoteText.innerText = healthQuotes[todayIndex];
        quoteContainer.style.display = 'block';

        if (document.body.classList.contains('dark-mode')) {
            quoteContainer.style.background = 'rgba(245, 158, 11, 0.2)';
            quoteContainer.style.color = '#f8fafc';
        }
    }
}

window.getWaterKey = function () {
    const today = new Date().toLocaleDateString('en-CA');
    return `water_intake_${today}`;
}

window.getWaterCount = function () {
    return parseInt(localStorage.getItem(window.getWaterKey())) || 0;
}

window.renderWaterTracker = function () {
    const count = window.getWaterCount();
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
    let count = window.getWaterCount();
    if (count < 8) {
        localStorage.setItem(window.getWaterKey(), count + 1);
        window.renderWaterTracker();
        if (window.showToast) window.showToast('success', 'ดื่มน้ำเพิ่ม 1 แก้ว เก่งมาก! 💧');
    } else {
        localStorage.setItem(window.getWaterKey(), count + 1);
        window.renderWaterTracker();
        if (window.showToast) window.showToast('info', 'คุณดื่มน้ำถึงเป้าหมายแล้ววันนี้! 🎉');
    }
}

window.resetWater = function () {
    localStorage.setItem(window.getWaterKey(), 0);
    window.renderWaterTracker();
}

const getWellnessDateKey = () => new Date().toISOString().split('T')[0];

window.setMood = function (mood) {
    localStorage.setItem(`mood_${getWellnessDateKey()}`, mood);
    updateMoodUI(mood);
    if (window.playPremiumSound) window.playPremiumSound('pop');
    if (window.showToast) window.showToast('success', `บันทึกอารมณ์ของคุณแล้ว ✨`);
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
    if (window.playPremiumSound) window.playPremiumSound('confirm');
    if (window.showToast) window.showToast('success', `บันทึกเวลาการนอน ${hours} ชม. เรียบร้อย 🌙`);
}

window.initWellnessSection = function () {
    const dateKey = getWellnessDateKey();
    const savedMood = localStorage.getItem(`mood_${dateKey}`);
    const savedSleep = localStorage.getItem(`sleep_${dateKey}`);

    if (savedMood) updateMoodUI(savedMood);
    if (savedSleep) document.getElementById('sleep-hours').value = savedSleep;
}

window.updateStreak = function () {
    const lastLoginDate = localStorage.getItem('last_login_date');
    const today = new Date().toLocaleDateString('en-CA');
    let streak = parseInt(localStorage.getItem('user_streak')) || 0;

    if (lastLoginDate !== today) {
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

window.renderWeeklySnapshots = function () {
    const waterCtx = document.getElementById('weeklyWaterChart');
    const sleepCtx = document.getElementById('weeklySleepChart');
    if (!waterCtx || !sleepCtx) return;

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
            datasets: [{ label: 'แก้ว', data: waterData, backgroundColor: '#38bdf8', borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: color, font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: color, font: { size: 10 } }, beginAtZero: true } }
        }
    });

    weeklySleepChartInstance = new Chart(sleepCtx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{ label: 'ชม.', data: sleepData, borderColor: '#4f46e5', tension: 0.4, fill: false, borderWidth: 2, pointRadius: 3 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: color, font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: color, font: { size: 10 } }, beginAtZero: true } }
        }
    });
}
