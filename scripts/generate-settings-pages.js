const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const settingsRoot = path.join(root, "settings");

const pages = {
  "settings.html": ["Settings", "Control center", "Manage global Easy Loan configuration from one place.", "overview"],
  "general-settings.html": ["General Settings", "Platform defaults", "Set language, timezone, account defaults, and operating preferences.", "general"],
  "system-settings.html": ["System Settings", "Core controls", "Manage maintenance mode, session behavior, and system-level options.", "system"],
  "company-profile.html": ["Company Profile", "Business identity", "Keep Easy Loan company information, contact details, and branding current.", "company"],
  "loan-settings.html": ["Loan Settings", "Loan rules", "Configure application limits, terms, approval thresholds, and product defaults.", "loan"],
  "payment-settings.html": ["Payment Settings", "Collections", "Manage payment channels, receipt rules, penalties, and posting behavior.", "payment"],
  "email-settings.html": ["Email Settings", "Email delivery", "Configure sender identity, templates, and email notification defaults.", "email"],
  "sms-settings.html": ["SMS Settings", "Mobile alerts", "Set SMS sender rules, reminder templates, and delivery preferences.", "sms"],
  "theme-settings.html": ["Theme Settings", "Interface style", "Choose brand colors, dashboard density, and display preferences.", "theme"],
};

const nav = [
  ["settings", "Settings", "settings.html"],
  ["tune", "General", "general-settings.html"],
  ["dns", "System", "system-settings.html"],
  ["apartment", "Company", "company-profile.html"],
  ["request_quote", "Loans", "loan-settings.html"],
  ["payments", "Payments", "payment-settings.html"],
  ["mail", "Email", "email-settings.html"],
  ["sms", "SMS", "sms-settings.html"],
  ["palette", "Theme", "theme-settings.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Settings</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../static/styles.css">
</head>`;

const topbar = (active) => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <nav class="desktop-nav" aria-label="Settings navigation">
      <a class="${active === "settings.html" ? "active" : ""}" href="settings.html">Settings</a>
      <a class="${active === "loan-settings.html" ? "active" : ""}" href="loan-settings.html">Loans</a>
      <a class="${active === "payment-settings.html" ? "active" : ""}" href="payment-settings.html">Payments</a>
      <a class="${active === "theme-settings.html" ? "active" : ""}" href="theme-settings.html">Theme</a>
    </nav>
    <div class="user-actions">
      <a class="icon-button" href="../notifications/notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../Admin/dashboard.html">Admin</a>
    </div>
  </header>`;

const sideNav = (active) => `<aside class="management-nav" aria-label="Settings sections">
          ${nav.map(([icon, label, href]) => `<a class="${href === active ? "active" : ""}" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n          ")}
        </aside>`;

const hero = (page) => `<section class="management-hero">
          <div class="management-hero-copy"><p class="page-kicker">${page[1]}</p><h1>${page[0]}</h1><p>${page[2]}</p></div>
          <section class="panel"><h2>Configuration Health</h2><div class="profile-list"><div class="profile-row"><span>Active modules</span><strong>9</strong></div><div class="profile-row"><span>Last updated</span><strong>May 24, 2026</strong></div><div class="profile-row"><span>Status</span><strong>Ready</strong></div></div></section>
        </section>`;

const cards = () => `<section class="management-card-grid">
          <article class="panel management-card"><span class="material-symbols-outlined">request_quote</span><h2>Loan Rules</h2><p class="muted">Approval, terms, and application defaults.</p></article>
          <article class="panel management-card"><span class="material-symbols-outlined">payments</span><h2>Payments</h2><p class="muted">Collection channels and receipt behavior.</p></article>
          <article class="panel management-card"><span class="material-symbols-outlined">notifications</span><h2>Messages</h2><p class="muted">Email and SMS communication defaults.</p></article>
        </section>`;

const form = (title, fields) => `<section class="panel"><h2>${title}</h2><form class="form-grid" data-demo-form>
            ${fields.map(([label, type, value]) => `<label class="field"><span>${label}</span><input type="${type}" value="${value}"></label>`).join("\n            ")}
            <div class="form-actions"><button class="btn btn-primary" type="submit">Save Settings</button><button class="btn-secondary" type="button">Reset</button></div><p class="muted" data-form-message></p>
          </form></section>`;

const content = (type) => {
  if (type === "overview") return `${cards()}<section class="panel"><h2>Settings Directory</h2><div class="quick-actions">${nav.slice(1).map(([icon, label, href]) => `<a class="action-tile" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label} settings</a>`).join("")}</div></section>`;
  if (type === "theme") return `<div class="content-grid two"><section class="panel"><h2>Theme Controls</h2><div class="swatch-row"><span class="color-swatch" style="background:#131b2e"></span><span class="color-swatch" style="background:#006c49"></span><span class="color-swatch" style="background:#dcfff0"></span><span class="color-swatch" style="background:#f7f9fb"></span></div><div class="toggle-row"><div><strong>Compact admin tables</strong><p class="muted">Use denser spacing for data-heavy screens.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div></section>${form("Display Defaults", [["Dashboard Title","text","Easy Loan Admin"],["Default Theme","text","Light"],["Accent Color","text","#006c49"]])}</div>`;
  if (type === "loan") return form("Loan Configuration", [["Minimum Amount","number","5000"],["Maximum Amount","number","250000"],["Default Interest Rate","text","4.5%"],["Approval SLA Hours","number","24"]]);
  if (type === "payment") return form("Payment Configuration", [["Grace Period Days","number","3"],["Penalty Rate","text","2%"],["Receipt Prefix","text","PAY"],["Posting Cutoff","time","17:00"]]);
  if (type === "email") return form("Email Configuration", [["Sender Name","text","Easy Loan"],["Sender Email","email","support@easyloan.test"],["SMTP Host","text","smtp.easyloan.test"],["Reply To","email","support@easyloan.test"]]);
  if (type === "sms") return form("SMS Configuration", [["Sender ID","text","EasyLoan"],["Provider","text","Demo SMS Gateway"],["Daily Limit","number","5000"],["Support Number","text","+63 912 345 6789"]]);
  if (type === "company") return form("Company Profile", [["Company Name","text","Easy Loan Financial"],["Support Email","email","support@easyloan.test"],["Phone","text","+63 912 345 6789"],["Address","text","Manila, Philippines"]]);
  if (type === "system") return `<div class="content-grid two">${form("System Controls", [["Session Timeout Minutes","number","30"],["Maintenance Window","text","Sunday 2:00 AM"],["Backup Schedule","text","Daily"],["Admin Contact","email","admin@easyloan.test"]])}<section class="panel"><h2>System Switches</h2><div class="toggle-row"><div><strong>Maintenance mode</strong><p class="muted">Temporarily restrict borrower access.</p></div><label class="toggle"><input type="checkbox"><span></span></label></div><div class="toggle-row"><div><strong>Audit logging</strong><p class="muted">Track sensitive admin actions.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div></section></div>`;
  return `<div class="content-grid two">${form("General Configuration", [["Default Timezone","text","Asia/Manila"],["Default Currency","text","PHP"],["Support Hours","text","8:00 AM - 6:00 PM"],["Language","text","English"]])}<section class="panel"><h2>General Switches</h2><div class="toggle-row"><div><strong>Borrower registration</strong><p class="muted">Allow new borrower accounts.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div><div class="toggle-row"><div><strong>Application intake</strong><p class="muted">Accept new loan applications.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div></section></div>`;
};

const bottomNav = () => `<nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="settings.html"><span class="material-symbols-outlined">settings</span><span>Home</span></a>
    <a href="loan-settings.html"><span class="material-symbols-outlined">request_quote</span><span>Loans</span></a>
    <a href="payment-settings.html"><span class="material-symbols-outlined">payments</span><span>Pay</span></a>
    <a href="email-settings.html"><span class="material-symbols-outlined">mail</span><span>Email</span></a>
    <a href="theme-settings.html"><span class="material-symbols-outlined">palette</span><span>Theme</span></a>
  </nav>`;

for (const [file, page] of Object.entries(pages)) {
  const html = `${head(page[0])}
<body class="settings-page user-body">
  ${topbar(file)}
  <main class="user-shell"><div class="user-layout">${sideNav(file)}<section class="user-content">${hero(page)}${content(page[3])}</section></div></main>
  ${bottomNav()}
  <script src="../static/script.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(settingsRoot, file), html, "utf8");
}

console.log("Settings HTML pages generated.");
