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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

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