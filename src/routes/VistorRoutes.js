const express = require('express');
const VistorNumber = require('../controllers/VistorController');

const router = express.Router();

const allowedOrigins = [
    'https://trinadhportfolio.netlify.app',
    'https://trinadh.dev'
];

const checkOrigin = (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin || !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            error: 'Forbidden'
        });
    }

    next();
};

router.get('/visitor', checkOrigin, VistorNumber);

module.exports = router;
