'use strict';
 
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const csv = require('csv-parser');
const cron = require('node-cron');
const holidays = require('./holidays.json');
 
// ----------------- Setup WhatsApp client -----------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', // adjust if needed
        headless: false
    }
});
 
// ----------------- QR Code -----------------
client.on('qr', qr => {
    console.log('Scan this QR code:');
    qrcode.generate(qr, { small: true });
});
 
// ----------------- Bot Ready -----------------
client.on('ready', () => {
    console.log('✅ Bot is up and running!');
    runEventCheck(); // Run once at startup
});
 
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
 
            // Keep track of numbers already messaged today (for holidays)
            const messagedNumbers = new Set();
 
            contacts.forEach(person => {
                // Trim whitespace from all fields to avoid subtle bugs
                const name = (person.name || '').trim();
                const number = (person.number || '').trim();
                const birthday = (person.birthday || '').trim();
                const customMessage = (person.custom_message || '').trim();
 
                if (!number) {
                    console.log(`[WARN] Skipping contact "${name}" — no phone number`);
                    return;
                }
 
                let message = null;
 
                // 1️⃣ Birthday takes priority
                if (birthday === todayDate) {
                    message = customMessage ||
                        `🎂 Happy Birthday ${name}! Wishing you blessings and joy today and always! 🙏`;
                }
                // 2️⃣ Holiday / Special Event
                // FIX: Access .message property from holidays.json object
                else if (holidays[todayDate]) {
                    message = customMessage || holidays[todayDate].message;
                }
 
                // Send message if exists and not sent already
                if (message && !messagedNumbers.has(number)) {
                    sendMessage(number, message);
                    messagedNumbers.add(number);
                    console.log(`[✅ SENT] To ${name} (${number})`);
                }
            });
 
            console.log(`[INFO] Event check complete. Messaged ${messagedNumbers.size} contact(s).`);
        })
        .on('error', (err) => {
            console.error('[ERROR] Failed to read contacts.csv:', err.message);
        });
}
 
// ----------------- Send Message Helper -----------------
function sendMessage(number, message) {
    const chatId = number.replace(/\D/g, '') + '@c.us'; // Strip non-digits just in case
    client.sendMessage(chatId, message)
        .then(() => {
            console.log(`[INFO] Message delivered to ${chatId}`);
        })
        .catch(err => {
            console.error(`[ERROR] Failed to send to ${chatId}:`, err.message);
        });
}
 
// ----------------- Cron Scheduler -----------------
// Runs every day at 8:00 AM but only sends messages on relevant days
cron.schedule('0 8 * * *', () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${month}-${day}`;
 
    // Check if today is a holiday
    const isHoliday = !!holidays[todayDate];
 
    // Check if any contact has a birthday today
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
});
 
// ----------------- Initialize client -----------------
client.initialize();