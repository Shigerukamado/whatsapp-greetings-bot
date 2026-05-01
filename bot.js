"use strict";

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const fs = require("fs");
const csv = require("csv-parser");
const cron = require("node-cron");
const holidays = require("./holidays.json");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

let qrImageData = null;
let botStatus = "connecting";

// ----------------- Helper: Get Lagos date -----------------
function getLagosDate() {
  const lagosDate = new Date().toLocaleDateString("en-GB", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "2-digit",
  });
  const [day, month] = lagosDate.split("/");
  return `${month}-${day}`;
}

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

function getFullLagosDate() {
  return new Date().toLocaleDateString("en-GB", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ----------------- Delay Helper -----------------
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ----------------- Anti-Duplicate Log Helpers -----------------
const LOG_FILE = "./sent-log.json";

function getSentLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[ERROR] Could not read sent-log.json:", err.message);
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
  const freshLog = {};
  freshLog[todayKey] = log[todayKey] || [];
  if (!freshLog[todayKey].includes(number)) {
    freshLog[todayKey].push(number);
  }
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(freshLog, null, 2));
  } catch (err) {
    console.error("[ERROR] Could not write sent-log.json:", err.message);
  }
}

function getSentTodayNumbers() {
  const log = getSentLog();
  const todayKey = getTodayKey();
  return log[todayKey] || [];
}

// ----------------- Load Contacts -----------------
function loadContacts() {
  return new Promise((resolve) => {
    const contacts = [];
    if (!fs.existsSync("contacts.csv")) return resolve([]);
    fs.createReadStream("contacts.csv")
      .pipe(csv())
      .on("data", (data) => contacts.push(data))
      .on("end", () => resolve(contacts))
      .on("error", () => resolve([]));
  });
}

// ----------------- Upcoming Events -----------------
async function getUpcomingEvents() {
  const contacts = await loadContacts();
  const events = [];
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  for (let i = 0; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateKey = `${month}-${day}`;
    const fullDate = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });

    contacts.forEach((person) => {
      if ((person.birthday || "").trim() === dateKey) {
        events.push({
          date: fullDate,
          daysAway: i,
          type: "birthday",
          label: `🎂 ${(person.name || "").trim()}'s Birthday`,
          dateKey,
        });
      }
    });

    if (holidays[dateKey]) {
      const msg = holidays[dateKey].message || "";
      const title = msg
        .split("!")[0]
        .replace(/[🎉🌸❤️🌷👨‍💼🎄🎁]/g, "")
        .trim();
      events.push({
        date: fullDate,
        daysAway: i,
        type: "holiday",
        label: `🗓️ ${title}`,
        dateKey,
      });
    }
  }

  return events.sort((a, b) => a.daysAway - b.daysAway);
}

// ----------------- Dashboard Route -----------------
app.get("/", async (req, res) => {
  const contacts = await loadContacts();
  const sentToday = getSentTodayNumbers();
  const upcomingEvents = await getUpcomingEvents();
  const todayDate = getLagosDate();
  const fullDate = getFullLagosDate();

  const sentDetails = sentToday.map((num) => {
    const contact = contacts.find((c) => (c.number || "").trim() === num);
    return contact ? `${(contact.name || "").trim()} (${num})` : num;
  });

  let todayEvent = "No special events today";
  if (holidays[todayDate]) {
    const msg = holidays[todayDate].message || "";
    todayEvent = msg
      .split("!")[0]
      .replace(/[🎉🌸❤️🌷👨‍💼🎄🎁]/g, "")
      .trim();
  }
  const birthdaysToday = contacts.filter(
    (c) => (c.birthday || "").trim() === todayDate
  );
  if (birthdaysToday.length > 0) {
    todayEvent = `🎂 ${birthdaysToday.map((c) => (c.name || "").trim()).join(", ")}'s Birthday`;
  }

  const statusColor =
    botStatus === "connected" ? "#22c55e" : botStatus === "connecting" ? "#f59e0b" : "#ef4444";
  const statusText =
    botStatus === "connected" ? "✅ Connected" : botStatus === "connecting" ? "⏳ Connecting..." : "❌ Disconnected";

  const upcomingHTML = upcomingEvents.slice(0, 10).map((e) => `
        <div class="event-item ${e.type}">
            <div class="event-date">${e.date} ${e.daysAway === 0 ? '<span class="today-badge">TODAY</span>' : e.daysAway === 1 ? '<span class="soon-badge">TOMORROW</span>' : `<span class="days-badge">${e.daysAway}d</span>`}</div>
            <div class="event-label">${e.label}</div>
        </div>
    `).join("");

  const contactsHTML = contacts.map((c) => `
        <div class="contact-item">
            <div class="contact-name">${(c.name || "").trim()}</div>
            <div class="contact-details">
                <span class="tag group">${(c.groups || "No group").trim()}</span>
                <span class="tag gender ${(c.gender || "").trim()}">${(c.gender || "—").trim()}</span>
                <span class="tag number">${(c.number || "").trim()}</span>
                ${(c.birthday || "").trim() ? `<span class="tag birthday">🎂 ${(c.birthday || "").trim()}</span>` : ""}
            </div>
        </div>
    `).join("");

  const sentHTML = sentDetails.length > 0
    ? sentDetails.map((s) => `<div class="sent-item">✅ ${s}</div>`).join("")
    : '<div class="no-sent">No messages sent yet today</div>';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WhatsApp Bot Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<meta http-equiv="refresh" content="30">
<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg: #0a0f1e; --surface: #111827; --surface2: #1a2235; --border: #1e2d45; --accent: #25d366; --accent2: #128c7e; --text: #e8f0fe; --text2: #8899bb; --birthday: #f59e0b; --holiday: #6366f1; --female: #ec4899; --male: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: 'Sora', sans-serif; min-height: 100vh; padding: 24px 16px; }
    .grid-bg { position: fixed; inset: 0; background-image: linear-gradient(rgba(37,211,102,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,211,102,0.03) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
    .container { max-width: 900px; margin: 0 auto; position: relative; }
    header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
    .logo { width: 52px; height: 52px; background: linear-gradient(135deg, var(--accent), var(--accent2)); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; box-shadow: 0 0 24px rgba(37,211,102,0.3); }
    .header-text h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
    .header-text p { font-size: 0.8rem; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
    .status-pill { margin-left: auto; padding: 8px 16px; border-radius: 100px; font-size: 0.8rem; font-weight: 600; background: rgba(37,211,102,0.1); border: 1px solid rgba(37,211,102,0.3); color: ${statusColor}; font-family: 'JetBrains Mono', monospace; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; text-align: center; }
    .stat-number { font-size: 2rem; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: var(--accent); }
    .stat-label { font-size: 0.75rem; color: var(--text2); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .section { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 24px; margin-bottom: 16px; }
    .section-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text2); margin-bottom: 16px; font-family: 'JetBrains Mono', monospace; }
    .today-event { font-size: 1rem; font-weight: 600; color: var(--accent); padding: 12px 16px; background: rgba(37,211,102,0.08); border-radius: 12px; border-left: 3px solid var(--accent); }
    .sent-item { padding: 10px 14px; background: var(--surface2); border-radius: 10px; margin-bottom: 8px; font-size: 0.85rem; font-family: 'JetBrains Mono', monospace; color: var(--accent); }
    .no-sent { color: var(--text2); font-size: 0.85rem; font-style: italic; }
    .event-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 12px; margin-bottom: 8px; background: var(--surface2); border-left: 3px solid var(--border); }
    .event-item.birthday { border-left-color: var(--birthday); }
    .event-item.holiday { border-left-color: var(--holiday); }
    .event-date { font-size: 0.8rem; color: var(--text2); font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 8px; min-width: 140px; }
    .event-label { font-size: 0.9rem; font-weight: 500; }
    .today-badge { background: var(--accent); color: #000; padding: 2px 8px; border-radius: 100px; font-size: 0.65rem; font-weight: 700; }
    .soon-badge { background: var(--birthday); color: #000; padding: 2px 8px; border-radius: 100px; font-size: 0.65rem; font-weight: 700; }
    .days-badge { background: var(--surface); color: var(--text2); padding: 2px 8px; border-radius: 100px; font-size: 0.65rem; border: 1px solid var(--border); }
    .contact-item { padding: 14px; background: var(--surface2); border-radius: 12px; margin-bottom: 8px; }
    .contact-name { font-weight: 600; margin-bottom: 8px; font-size: 0.95rem; }
    .contact-details { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag { padding: 3px 10px; border-radius: 100px; font-size: 0.72rem; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
    .tag.group { background: rgba(99,102,241,0.15); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
    .tag.female { background: rgba(236,72,153,0.15); color: #f472b6; border: 1px solid rgba(236,72,153,0.3); }
    .tag.male { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
    .tag.number { background: rgba(37,211,102,0.1); color: var(--accent); border: 1px solid rgba(37,211,102,0.2); }
    .tag.birthday { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
    .refresh-note { text-align: center; font-size: 0.72rem; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 24px; opacity: 0.6; }
    @media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2, 1fr); } header { flex-wrap: wrap; } .status-pill { margin-left: 0; } }
</style>
</head>
<body>
<div class="grid-bg"></div>
<div class="container">
    <header>
        <div class="logo">📱</div>
        <div class="header-text"><h1>WhatsApp Bot</h1><p>${fullDate}</p></div>
        <div class="status-pill">${statusText}</div>
    </header>
    <div class="stats-row">
        <div class="stat-card"><div class="stat-number">${contacts.length}</div><div class="stat-label">Total Contacts</div></div>
        <div class="stat-card"><div class="stat-number">${sentToday.length}</div><div class="stat-label">Sent Today</div></div>
        <div class="stat-card"><div class="stat-number">${upcomingEvents.length}</div><div class="stat-label">Events (30d)</div></div>
    </div>
    <div class="section"><div class="section-title">Today's Event</div><div class="today-event">${todayEvent}</div></div>
    <div class="section"><div class="section-title">Messages Sent Today</div>${sentHTML}</div>
    <div class="section"><div class="section-title">Upcoming Events (Next 30 Days)</div>${upcomingHTML || '<div class="no-sent">No events in the next 30 days</div>'}</div>
    <div class="section"><div class="section-title">All Contacts (${contacts.length})</div>${contactsHTML}</div>
    <div class="refresh-note">Auto-refreshes every 30 seconds • Built with ❤️</div>
</div>
</body>
</html>`);
});

// ----------------- QR Route -----------------
app.get("/qr", (req, res) => {
  if (qrImageData) {
    res.send(`<html><body style="background:#0a0f1e;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;color:white;">
            <h2 style="margin-bottom:20px">Scan QR Code with WhatsApp</h2>
            <img src="${qrImageData}" style="border-radius:16px;" />
        </body></html>`);
  } else {
    res.send('<html><body style="background:#0a0f1e;color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h2>Bot is already connected! No QR needed.</h2></body></html>');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ----------------- Setup WhatsApp client -----------------
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 120000,
  },
});

// ----------------- QR Code -----------------
client.on("qr", (qr) => {
  QRCode.toDataURL(qr, (err, url) => {
    if (!err) {
      qrImageData = url;
      botStatus = "connecting";
      console.log("QR code ready — visit your Railway URL/qr to scan it");
    }
  });
});

// ----------------- Bot Ready -----------------
client.on("ready", async () => {
  botStatus = "connected";
  qrImageData = null;
  console.log("✅ Bot is up and running!");
  console.log("[INFO] Waiting 10 seconds for Chrome to stabilize...");
  await delay(10000);
  runEventCheck();
});

client.on("disconnected", () => {
  botStatus = "disconnected";
  console.log("[WARN] Bot disconnected");
});

// ----------------- Helper: check if contact qualifies for a holiday -----------------
function contactQualifiesForHoliday(person, holiday) {
  const personGroups = (person.groups || "").split("|").map((g) => g.trim().toLowerCase());
  const personGender = (person.gender || "").trim().toLowerCase();
  if (holiday.gender) {
    if (personGender !== holiday.gender.toLowerCase()) return false;
  }
  if (holiday.groups && holiday.groups.length > 0) {
    const holidayGroups = holiday.groups.map((g) => g.trim().toLowerCase());
    if (holidayGroups.includes("everyone")) return true;
    const hasMatchingGroup = personGroups.some((g) => holidayGroups.includes(g));
    if (!hasMatchingGroup) return false;
  }
  return true;
}

// ----------------- Send Message Helper -----------------
function sendMessage(number, message) {
  const chatId = number.replace(/\D/g, "") + "@c.us";
  return client
    .sendMessage(chatId, message)
    .then(() => console.log(`[INFO] Message delivered to ${chatId}`))
    .catch((err) => console.error(`[ERROR] Failed to send to ${chatId}:`, err.message));
}

// ----------------- Function to check events -----------------
async function runEventCheck() {
  const todayDate = getLagosDate();
  console.log(`[INFO] Running event check for date: ${todayDate}`);
  const contacts = await loadContacts();
  if (contacts.length === 0) {
    console.log("[WARN] No contacts found in contacts.csv");
    return;
  }
  let sentCount = 0;
  for (const person of contacts) {
    const name = (person.name || "").trim();
    const number = (person.number || "").trim();
    const birthday = (person.birthday || "").trim();
    const customMessage = (person.custom_message || "").trim();
    if (!number) {
      console.log(`[WARN] Skipping contact "${name}" — no phone number`);
      continue;
    }
    if (hasBeenSentToday(number)) {
      console.log(`[SKIP] Already messaged ${name} today. Skipping.`);
      continue;
    }
    let message = null;
    if (birthday === todayDate) {
      message = customMessage || `🎂 Happy Birthday ${name}! Wishing you blessings and joy today and always! 🙏`;
    } else if (holidays[todayDate]) {
      const holiday = holidays[todayDate];
      if (contactQualifiesForHoliday(person, holiday)) {
        message = holiday.message;
      } else {
        console.log(`[SKIP] ${name} does not qualify for today's holiday (group/gender filter)`);
      }
    }
    if (message) {
      await delay(3000);
      await sendMessage(number, message);
      markAsSent(number);
      sentCount++;
      console.log(`[✅ SENT] To ${name} (${number})`);
      await delay(8000);
    }
  }
  console.log(`[INFO] Event check complete. Messaged ${sentCount} contact(s).`);
}

// ----------------- Cron Scheduler -----------------
cron.schedule("0 0 * * *", async () => {
    const todayDate = getLagosDate();
    const isHoliday = !!holidays[todayDate];
    const contacts = await loadContacts();
    const isSomeoneBirthday = contacts.some((p) => (p.birthday || "").trim() === todayDate);
    if (isHoliday || isSomeoneBirthday) {
      console.log(`[CRON] Relevant day detected (${todayDate}). Running event check...`);
      runEventCheck();
    } else {
      console.log(`[CRON] No events today (${todayDate}). Skipping.`);
    }
  },
  { timezone: "Africa/Lagos" }
);

// ----------------- Initialize client -----------------
client.initialize();