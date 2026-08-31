const rateLimit = require('express-rate-limit');

// Rate Limiter for Login (Max 10 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: "เข้าสู่ระบบผิดพลาดบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for Register (Max 5 requests per hour)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "สมัครสมาชิกบ่อยเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for Forgot Password (Max 5 requests per 15 minutes)
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "คำขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate Limiter for Bug Report (Max 5 requests per hour)
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: "ส่งรายงานบ่อยเกินไป กรุณารอ 1 ชั่วโมง" },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    registerLimiter,
    forgotPasswordLimiter,
    reportLimiter
};
