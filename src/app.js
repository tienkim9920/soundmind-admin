const dotenv = require('dotenv');

dotenv.config({
    path: `.env.${process.env.NODE_ENV || 'development'}`
});

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const axios = require('axios');
const client = require('prom-client');

// Ghi nhận và trace logs toàn bộ request Axios gửi ra Backend API
axios.interceptors.request.use(config => {
    console.log(`  --> [Axios Outgoing Request] ${config.method.toUpperCase()} ${config.url}`);
    if (config.params) console.log(`      Params:`, JSON.stringify(config.params));
    if (config.data) console.log(`      Data:`, JSON.stringify(config.data));
    return config;
}, error => {
    console.error(`  --> [Axios Request Error]`, error);
    return Promise.reject(error);
});

axios.interceptors.response.use(response => {
    console.log(`  <-- [Axios Incoming Response] ${response.config.method.toUpperCase()} ${response.config.url} | Status: ${response.status}`);
    return response;
}, error => {
    console.error(`  <-- [Axios Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} | Status: ${error.response?.status || 'No Status'} | Message: ${error.message}`);
    if (error.response?.data) {
        console.error(`      Details:`, JSON.stringify(error.response.data));
    }
    return Promise.reject(error);
});

app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'", "http://14.225.204.109:4000", "http://localhost:4000", "http://localhost:3000", "https://soundmind.vn", "https://api-soundmind.vn"],
                formAction: ["'self'", "http://14.225.204.109:4000", "http://localhost:4000", "http://localhost:3000", "https://soundmind.vn", "https://api-soundmind.vn"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdn.jsdelivr.net"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://s3.vn-hcm-1.vietnix.cloud",
                ],
                fontSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ],
                connectSrc: [
                    "'self'",
                    "http://localhost:8080",
                    "https://cdn.jsdelivr.net",
                    "https://s3.vn-hcm-1.vietnix.cloud"
                ]
            }
        }
    })
);
app.use(cors());
app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ghi nhận và trace logs toàn bộ request đi vào Admin Panel (sau khi parse body)
app.use((req, res, next) => {
    console.log(`\n[Admin Panel Request] ${req.method} ${req.originalUrl}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`  Body:`, JSON.stringify(req.body, null, 2));
    }
    next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo thu thập các metrics mặc định của Node.js runtime
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Tạo endpoint /metrics cho Prometheus gọi tới
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

// Tạo biến adminRoute global cho 2 môi trường (dev, prod)
app.use((req, res, next) => {
    let adminRoute = process.env.ADMIN_ROUTE || '/admin';
    adminRoute = adminRoute === '/' ? '' : adminRoute.replace(/\/$/, '');
    res.locals.adminPrefix = adminRoute;
    res.locals.adminRoute = adminRoute;
    next();
});

const webRoute = require('./routes/web.route');

app.use('', webRoute);

module.exports = app;
