'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const csv = require('csv-parser');
const cron = require('node-cron');
const holidays = require('./holidays.json');

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let qrImageData = null;

app.get('/', (req, res) => {
    if (qrImageData) {
        res.send(`<html><body><h2>Scan this QR code with WhatsApp</h2><img src="${qrImageData}" /></body></html>`);
    } else {
        res.send('<html><body><h2>Bot is already connected or QR not ready yet. Refresh in a few seconds.</h2></body></html>');
    }
});

app.listen(PORT, () => console.log(`QR server running on port ${PORT}`));

// ----------------- Setup WhatsApp client -----------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        protocolTimeout: 60000
    }
});

// ----------------- QR Code -----------------
client.on('qr', qr => {
    QRCode.toDataURL(qr, (err, url) => {
        if (!err) {
            qrImageData = url;
            console.log('QR code ready — visit your Railway URL to scan it');
        }
    });
});

// ----------------- Bot Ready -----------------
client.on('ready', () => {
    console.log('✅ Bot is up and running!');
    runEventCheck();
});

// ----------------- Anti-Duplicate Log Helpers -----------------
const LOG_FILE = './sent-log.json';

function getTodayKey() {
    const today = new Date();
    return today.toISOString().split('T')[0]; // e.g. "2026-04-10"
}

function getSentLog() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const raw = fs.readFileSync(LOG_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('[ERROR] Could not read sent-log.json:', err.message);
    }
    return {};
}

function hasBeenSentToday(number) {
    const log = getSentLog();
    const todayKey = getTodayKey();
    return log[todayKey] && log[todayKey].includes(number);
}

function markAsSent(number) {
    const log = getSentLog();
    const todayKey = getTodayKey();

    // Only keep today's records — clear old dates
    const freshLog = {};
    freshLog[todayKey] = log[todayKey] || [];

    if (!freshLog[todayKey].includes(number)) {
        freshLog[todayKey].push(number);
    }

    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(freshLog, null, 2));
    } catch (err) {
        console.error('[ERROR] Could not write sent-log.json:', err.message);
    }
}

// ----------------- Helper: check if contact qualifies for a holiday -----------------
function contactQualifiesForHoliday(person, holiday) {
    const personGroups = (person.groups || '').split('|').map(g => g.trim().toLowerCase());
    const personGender = (person.gender || '').trim().toLowerCase();

    // Check gender filter
    if (holiday.gender) {
        if (personGender !== holiday.gender.toLowerCase()) return false;
    }

    // Check group filter
    if (holiday.groups && holiday.groups.length > 0) {
        const holidayGroups = holiday.groups.map(g => g.trim().toLowerCase());
        if (holidayGroups.includes('everyone')) return true;
        const hasMatchingGroup = personGroups.some(g => holidayGroups.includes(g));
        if (!hasMatchingGroup) return false;
    }

    return true;
}

// ----------------- Function to check events -----------------
function runEventCheck() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${month}-${day}`;

    console.log(`[INFO] Running event check for date: ${todayDate}`);

    const contacts = [];
    fs.createReadStream('contacts.csv')
        .pipe(csv())
        .on('data', (data) => contacts.push(data))
        .on('end', () => {
            if (contacts.length === 0) {
                console.log('[WARN] No contacts found in contacts.csv');
                return;
            }

            let sentCount = 0;

            contacts.forEach(person => {
                const name = (person.name || '').trim();
                const number = (person.number || '').trim();
                const birthday = (person.birthday || '').trim();
                const customMessage = (person.custom_message || '').trim();

                if (!number) {
                    console.log(`[WARN] Skipping contact "${name}" — no phone number`);
                    return;
                }

                // Anti-duplicate check
                if (hasBeenSentToday(number)) {
                    console.log(`[SKIP] Already messaged ${name} today. Skipping.`);
                    return;
                }

                let message = null;

                // 1️⃣ Birthday takes priority
                if (birthday === todayDate) {
                    message = customMessage ||
                        `🎂 Happy Birthday ${name}! Wishing you blessings and joy today and always! 🙏`;
                }
                // 2️⃣ Holiday / Special Event — check group and gender
                else if (holidays[todayDate]) {
                    const holiday = holidays[todayDate];
                    if (contactQualifiesForHoliday(person, holiday)) {
                        message = holiday.message;
                    } else {
                        console.log(`[SKIP] ${name} does not qualify for today's holiday (group/gender filter)`);
                    }
                }

                // Send message and log it
                if (message) {
                    sendMessage(number, message);
                    markAsSent(number);
                    sentCount++;
                    console.log(`[✅ SENT] To ${name} (${number})`);
                }
            });

            console.log(`[INFO] Event check complete. Messaged ${sentCount} contact(s).`);
        })
        .on('error', (err) => {
            console.error('[ERROR] Failed to read contacts.csv:', err.message);
        });
}

// ----------------- Send Message Helper -----------------
function sendMessage(number, message) {
    const chatId = number.replace(/\D/g, '') + '@c.us';
    client.sendMessage(chatId, message)
        .then(() => {
            console.log(`[INFO] Message delivered to ${chatId}`);
        })
        .catch(err => {
            console.error(`[ERROR] Failed to send to ${chatId}:`, err.message);
        });
}

// ----------------- Cron Scheduler -----------------
// Runs every day at 12:00 AM Lagos time
cron.schedule('0 0 * * *', () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${month}-${day}`;

    const isHoliday = !!holidays[todayDate];

    const contacts = [];
    fs.createReadStream('contacts.csv')
        .pipe(csv())
        .on('data', (data) => contacts.push(data))
        .on('end', () => {
            const isSomeoneBirthday = contacts.some(p => (p.birthday || '').trim() === todayDate);

            if (isHoliday || isSomeoneBirthday) {
                console.log(`[CRON] Relevant day detected (${todayDate}). Running event check...`);
                runEventCheck();
            } else {
                console.log(`[CRON] No events today (${todayDate}). Skipping.`);
            }
        })
        .on('error', (err) => {
            console.error('[ERROR] Could not read contacts.csv in scheduler:', err.message);
        });
}, { timezone: 'Africa/Lagos' });

// ----------------- Initialize client -----------------
client.initialize();