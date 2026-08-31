const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const routes = require('./routes');
const { networkInterfaces } = require('os');

const app = express();

// Enable trusting proxy for rate limiting behind proxies/tunnels (like Ngrok / Nginx)
app.set('trust proxy', 1);

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Crash Recovery & Logging
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: "online",
        message: "NeWGen NewME API is running smoothly!",
        timestamp: new Date().toISOString()
    });
});

// Mount all modular routes under /api
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ NeWGen NewME Backend running on http://localhost:${PORT}`);

    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`📲 Remote Device access: http://${net.address}:${PORT}`);
            }
        }
    }
});

module.exports = { app, server };
