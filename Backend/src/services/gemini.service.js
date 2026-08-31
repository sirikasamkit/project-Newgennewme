const genAI = require('../config/gemini');

class GeminiService {
    static async generateHealthPlan({ bmi, weight, height, status, activity, mood, sleep }) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let activityContext = "";
        if (activity === 'bodybuilder') {
            activityContext = " ผู้ใช้ต้องการเน้นสร้างกล้ามเนื้อสไตล์นักเพาะกาย (Bodybuilder) อาหารต้องเน้นโปรตีนแบบจัดเต็ม และตารางฝึกต้องเน้น Hypertrophy/Weight Training";
        }

        let behaviorContext = "";
        if (mood === 'tired' || mood === 'stressed') {
            behaviorContext += ` ขณะนี้ผู้ใช้รู้สึก ${mood === 'tired' ? 'เหนื่อย' : 'เครียด'} ควรแนะนำแผนที่ช่วยผ่อนคลายหรือลดความตึงเครียดลงบ้าง`;
        }
        if (sleep && sleep !== 'not-specified' && parseInt(sleep) < 7) {
            behaviorContext += ` ผู้ใช้นอนน้อยเพียง ${sleep} ชม. ควรเน้นการพักผ่อน (Recovery) และเลี่ยงกิจกรรมที่หักโหมเกินไปในวันนี้`;
        }

        const prompt = `ในฐานะผู้เชี่ยวชาญด้านสุขภาพจากโปรเจกต์ NeWGen NewME 
        ผู้ใช้มีค่า BMI: ${bmi} (${status}), น้ำหนัก: ${weight}kg, ส่วนสูง: ${height}cm.${activityContext}${behaviorContext}
        ช่วยแนะนำ:
        1. แผนการกิน (มื้อเช้า, กลางวัน, เย็น)
        2. แผนการออกกำลังกาย 3 ท่า โดยสำหรับแต่ละท่า ให้ระบุ:
           - วิธีสาธิตขั้นตอนการทำ (Step-by-step)
           - คำแนะนำด้านความปลอดภัย
           - และแนบลิงก์สำหรับค้นหาวีดีโอตัวอย่างใน YouTube ในรูปแบบ [🎬 คลิกเพื่อดูคลิปสาธิตท่านี้](https://www.youtube.com/results?search_query=วิธีทำท่า+ชื่อท่าภาษาไทย+และภาษาอังกฤษ)
        ตอบเป็นภาษาไทย โดยมุ่งเน้นความสวยงามของเนื้อหา ใช้ Bullet point และตัวหนา (**ข้อความ**) ให้ดูพรีเมียม`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    }

    static async analyzeFoodImage(buffer, mimeType) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imagePart = {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: mimeType
            }
        };

        const prompt = `ในฐานะนักโภชนาการจาก NeWGen NewME ช่วยวิเคราะห์รูปอาหารนี้:
        1. ชื่ออาหารคืออะไร?
        2. ประมาณการแคลอรี่ (kcal)
        3. สารอาหารหลัก (โปรตีน, คาร์บ, ไขมัน)
        4. คำแนะนำสุขภาพสั้นๆ
        ตอบเป็นภาษาไทยและใช้ Bullet point`;

        const result = await model.generateContent([prompt, imagePart]);
        return result.response.text();
    }

    static async chatWellness(message) {
        const sanitizedMessage = message.trim().substring(0, 500).replace(/[`'"\\]/g, '');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `คุณคือ NeWGen AI ผู้ช่วยอัจฉริยะด้านสุขภาพและความงาม (Wellness Assistant)
        หน้าที่ของคุณคือตอบคำถามเกี่ยวกับสุขภาพ การออกกำลังกาย โภชนาการ และการดูแลตัวเอง 
        คำถามจากผู้ใช้: "${sanitizedMessage}"
        
        คำแนะนำ:
        - ตอบอย่างเป็นกันเองและเป็นบวก
        - ถ้าผู้ใช้ถามเรื่องโภชนาการ ให้เน้นความสมดุล
        - ถ้าเป็นคำถามทางการแพทย์ที่ร้ายแรง ให้แนะนำให้ปรึกษาแพทย์
        - พยายามใช้ Bullet point เพื่อให้อ่านง่าย
        - ใช้ภาษาไทยที่ดูพรีเมียมและสุภาพ`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    }
}

module.exports = GeminiService;
