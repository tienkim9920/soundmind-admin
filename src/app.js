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
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

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
                    "data:"
                ],

                fontSrc: [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ],

                connectSrc: [
                    "'self'",
                    "http://localhost:8080",
                    "https://cdn.jsdelivr.net"
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

const webRoute = require('./routes/web.route');

app.use('/', webRoute);

module.exports = app;