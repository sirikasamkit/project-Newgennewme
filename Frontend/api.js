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
    const content = document.getElementById('history-content');
    if (!content) return;

    if (!append) {
        content.innerHTML = `
            <div style="margin-left: 20px;">
                <span class="skeleton-box" style="width: 30%; margin-bottom: 10px; height: 1.5em;"></span><br>
                <span class="skeleton-box" style="width: 100%; margin-bottom: 5px;"></span>
                <span class="skeleton-box" style="width: 90%; margin-bottom: 5px;"></span>
                <span class="skeleton-box" style="width: 95%; margin-bottom: 5px;"></span>
            </div>`;
        content.style.display = "block";
    } else {
        const btn = document.getElementById('load-more-btn');
        if (btn) btn.innerText = "กำลังโหลด...";
    }

    // Helper: Parse basic markdown from AI to HTML
    const parseMarkdown = (text) => {
        if (!text) return "";
        let htmlText = text.replace(/\\n/g, '<br>');
        return htmlText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)<br>/g, '<h4 style="color:#0ea5e9; margin-top:15px; margin-bottom:5px;">$1</h4>')
            .replace(/<br>\* (.*?)/g, '<li style="margin-left: 20px; margin-bottom: 5px;">$1</li>')
            .replace(/<br>- (.*?)/g, '<li style="margin-left: 20px; margin-bottom: 5px;">$1</li>');
    };

    try {
        const response = await fetch(`/api/history?page=${page}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();

            if (!append && window.renderHistoryChart) window.renderHistoryChart(data.bmi);

            let bmiHtml = '';
            data.bmi.forEach(b => {
                bmiHtml += `<div style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 10px; border-left: 4px solid #38bdf8; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; transition: 0.3s; margin-bottom: 10px;" onmouseover="this.style.background='rgba(255,255,255,0.9)'" onmouseout="this.style.background='rgba(255,255,255,0.7)'">
                            <div>
                                <strong style="color: #475569; font-size: 0.9em;">📅 ${b.created_at}</strong>
                                <div style="font-weight: bold; font-size: 1.1em; color: #0f172a; margin-top: 5px;">BMI: ${b.bmi}</div>
                            </div>
                            <div style="background: ${b.status.includes('ปกติ') ? '#dcfce7' : '#fef3c7'}; color: ${b.status.includes('ปกติ') ? '#166534' : '#92400e'}; padding: 5px 10px; border-radius: 20px; font-size: 0.85em; font-weight: 600;">
                                ${b.status}
                            </div>
                        </div>`;
            });

            let foodHtml = '';
            data.foods.forEach(f => {
                foodHtml += `<details style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 10px; border-left: 4px solid #fb7185; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; margin-bottom: 15px;">
                            <summary style="font-weight: bold; font-size: 1.1em; color: #0f172a; outline: none;">
                                🍽️ ${f.food_name} <span style="font-size: 0.8em; color: #64748b; font-weight: normal; margin-left: 10px;">(${f.created_at})</span>
                            </summary>
                            <div style="font-size: 0.95em; color: #334155; margin-top: 15px; line-height: 1.6; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 8px;">
                                ${parseMarkdown(f.analysis)}
                            </div>
                        </details>`;
            });

            let planHtml = '';
            data.plans.forEach(p => {
                planHtml += `<details style="background: rgba(255,255,255,0.7); padding: 15px; border-radius: 12px; border-left: 5px solid #34d399; box-shadow: 0 4px 6px rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s ease; margin-bottom: 15px;">
                          <summary style="font-weight: 600; color: #1e293b; font-size: 1.05em; outline: none;">
                              🤖 แผนสุขภาพประจำวันที่: ${p.created_at}
                          </summary>
                          <div style="line-height: 1.7; color: #475569; margin-top: 15px; padding-top: 15px; border-top: 1px dashed rgba(0,0,0,0.1);">
                              ${parseMarkdown(p.plan_details)}
                          </div>
                         </details>`;
            });

            if (!append) {
                let html = '';
                html += `<h3 style="color: #0ea5e9; margin-bottom: 15px; border-bottom: 2px solid #0ea5e9; padding-bottom: 5px; display: inline-block;">ประวัติ BMI ล่าสุด</h3>`;
                html += `<div id="bmi-list" style="margin-bottom: 25px;">${bmiHtml || '<div style="color: #64748b; font-style: italic;">ยังไม่มีประวัติ</div>'}</div>`;

                html += `<h3 style="color: #f43f5e; margin-bottom: 15px; border-bottom: 2px solid #f43f5e; padding-bottom: 5px; display: inline-block;">การวิเคราะห์อาหารที่บันทึกไว้</h3>`;
                html += `<div id="food-list" style="margin-bottom: 25px;">${foodHtml || '<div style="color: #64748b; font-style: italic;">ยังไม่มีประวัติ</div>'}</div>`;

                html += `<h3 style="color: #10b981; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 5px; display: inline-block;">แผนสุขภาพจาก AI ล่าสุด</h3>`;
                html += `<div id="plan-list">${planHtml || '<div style="color: #64748b; font-style: italic;">ยังไม่มีประวัติ</div>'}</div>`;

                html += `<div id="load-more-container" style="text-align: center; margin-top: 20px;"></div>`;
                content.innerHTML = html;
            } else {
                if (bmiHtml) document.getElementById('bmi-list').innerHTML += bmiHtml;
                if (foodHtml) document.getElementById('food-list').innerHTML += foodHtml;
                if (planHtml) document.getElementById('plan-list').innerHTML += planHtml;
            }

            const loadMoreContainer = document.getElementById('load-more-container');
            if (loadMoreContainer) {
                if (data.hasMore) {
                    loadMoreContainer.innerHTML = `<button id="load-more-btn" onclick="window.loadHistory(${page + 1}, true)" style="background: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s;" onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">โหลดเพิ่มเติม 👇</button>`;
                } else {
                    loadMoreContainer.innerHTML = `<div style="color: #64748b; font-size: 0.9em; font-style: italic;">-- หมดประวัติแล้ว --</div>`;
                }
            }

        } else {
            if (!append) content.innerHTML = "<p style='color:red;'>ดึงข้อมูลประวัติไม่สำเร็จ</p>";
        }
    } catch (error) {
        if (!append) content.innerHTML = "<p style='color:red;'>ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้</p>";
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
