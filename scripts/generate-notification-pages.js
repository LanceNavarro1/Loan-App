const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const notificationRoot = path.join(root, "notifications");

const pages = {
  "notifications.html": {
    title: "Notifications",
    kicker: "Message center",
    description: "Send, schedule, and review borrower notifications for loan updates, payments, and account activity.",
    active: "notifications.html",
    type: "center",
  },
  "announcement.html": {
    title: "Announcement",
    kicker: "Broadcast",
    description: "Create platform-wide announcements for borrowers, staff, and admin users.",
    active: "announcement.html",
    type: "announcement",
  },
  "reminders.html": {
    title: "Reminders",
    kicker: "Scheduled alerts",
    description: "Manage automatic reminders for due dates, document updates, and loan application follow-ups.",
    active: "reminders.html",
    type: "reminders",
  },
  "send-email.html": {
    title: "Send Email",
    kicker: "Email channel",
    description: "Compose email updates for borrower loan status, receipts, reminders, and support messages.",
    active: "send-email.html",
    type: "email",
  },
  "send-sms.html": {
    title: "Send SMS",
    kicker: "SMS channel",
    description: "Send short payment reminders, verification updates, and urgent borrower notices.",
    active: "send-sms.html",
    type: "sms",
  },
  "notification-logs.html": {
    title: "Notification Logs",
    kicker: "Delivery history",
    description: "Review sent messages, delivery status, channels, and failed notification attempts.",
    active: "notification-logs.html",
    type: "logs",
  },
};

const navItems = [
  ["notifications", "Notifications", "notifications.html"],
  ["campaign", "Announcement", "announcement.html"],
  ["event_upcoming", "Reminders", "reminders.html"],
  ["mail", "Send Email", "send-email.html"],
  ["sms", "Send SMS", "send-sms.html"],
  ["history", "Logs", "notification-logs.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Notifications</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../static/styles.css">
</head>`;

const topbar = (active) => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <nav class="desktop-nav" aria-label="Notification navigation">
      <a class="${active === "notifications.html" ? "active" : ""}" href="notifications.html">Center</a>
      <a class="${active === "announcement.html" ? "active" : ""}" href="announcement.html">Announce</a>
      <a class="${active === "reminders.html" ? "active" : ""}" href="reminders.html">Reminders</a>
      <a class="${active === "notification-logs.html" ? "active" : ""}" href="notification-logs.html">Logs</a>
    </nav>
    <div class="user-actions">
      <a class="icon-button has-alert" href="notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../Admin/dashboard.html">Admin</a>
    </div>
  </header>`;

const sideNav = (active) => `<aside class="notification-nav" aria-label="Notification sections">
          ${navItems.map(([icon, label, href]) => `<a class="${href === active ? "active" : ""}" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n          ")}
        </aside>`;

const hero = (page) => `<section class="notification-hero">
          <div class="notification-hero-copy">
            <p class="page-kicker">${page.kicker}</p>
            <h1>${page.title}</h1>
            <p>${page.description}</p>
          </div>
          <section class="panel">
            <h2>Delivery Overview</h2>
            <div class="profile-list">
              <div class="profile-row"><span>Sent today</span><strong>1,248</strong></div>
              <div class="profile-row"><span>Delivery rate</span><strong>96%</strong></div>
              <div class="profile-row"><span>Failed messages</span><strong>17</strong></div>
            </div>
          </section>
        </section>`;

const typeCards = () => `<section class="notification-type-grid">
          <article class="panel notification-type-card"><span class="material-symbols-outlined">mail</span><h2>Email</h2><p class="muted">Loan updates, receipts, and support notices.</p></article>
          <article class="panel notification-type-card"><span class="material-symbols-outlined">sms</span><h2>SMS</h2><p class="muted">Short due date and verification reminders.</p></article>
          <article class="panel notification-type-card"><span class="material-symbols-outlined">campaign</span><h2>Announcements</h2><p class="muted">System-wide updates and service notices.</p></article>
          <article class="panel notification-type-card"><span class="material-symbols-outlined">event_upcoming</span><h2>Reminders</h2><p class="muted">Scheduled payment and document alerts.</p></article>
        </section>`;

const messageForm = (title, channel) => `<section class="panel">
          <h2>${title}</h2>
          <form class="form-grid" data-demo-form>
            <label class="field"><span>Recipient Group</span><select><option>All borrowers</option><option>Pending applicants</option><option>Overdue accounts</option><option>Verified users</option></select></label>
            <label class="field"><span>Subject</span><input type="text" value="${channel} update from Easy Loan"></label>
            <label class="field"><span>Message</span><textarea>Your Easy Loan account has an important update. Please review your dashboard for details.</textarea></label>
            <label class="field"><span>Schedule</span><input type="datetime-local" value="2026-05-24T19:30"></label>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Send</button>
              <button class="btn-secondary" type="button">Save Draft</button>
            </div>
            <p class="muted" data-form-message></p>
          </form>
        </section>`;

const logs = () => `<section class="panel">
          <div class="page-head"><div><p class="page-kicker">History</p><h2>Recent Deliveries</h2><p>Monitor delivery outcomes across email, SMS, announcements, and reminders.</p></div><a class="btn btn-small" href="send-email.html">Compose</a></div>
          <div class="notification-log-list">
            <article class="notification-log-item"><span class="material-symbols-outlined">mail</span><div><strong>Loan approval email</strong><span>Sent to Lance Navarro</span></div><time>May 24, 2026 6:42 PM</time></article>
            <article class="notification-log-item"><span class="material-symbols-outlined">sms</span><div><strong>Payment reminder SMS</strong><span>Queued for overdue borrowers</span></div><time>May 24, 2026 5:15 PM</time></article>
            <article class="notification-log-item"><span class="material-symbols-outlined">campaign</span><div><strong>Maintenance announcement</strong><span>Delivered to all active accounts</span></div><time>May 24, 2026 2:30 PM</time></article>
          </div>
        </section>`;

const reminderTable = () => `<section class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Reminder</th><th>Audience</th><th>Channel</th><th>Next Run</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>Payment due soon</td><td>Active borrowers</td><td>Email + SMS</td><td>Daily 8:00 AM</td><td><span class="status approved">Active</span></td></tr>
              <tr><td>Missing documents</td><td>Pending applicants</td><td>Email</td><td>Every 6 hours</td><td><span class="status pending">Review</span></td></tr>
              <tr><td>Overdue follow-up</td><td>Overdue accounts</td><td>SMS</td><td>Daily 5:00 PM</td><td><span class="status approved">Active</span></td></tr>
            </tbody>
          </table>
        </section>`;

const content = (page) => {
  if (page.type === "email") {
    return `<div class="content-grid two">${messageForm("Compose Email", "Email")}<section class="panel"><h2>Email Templates</h2><div class="quick-actions"><a class="action-tile" href="send-email.html"><span class="material-symbols-outlined">task_alt</span>Loan approved</a><a class="action-tile" href="send-email.html"><span class="material-symbols-outlined">receipt_long</span>Payment receipt</a><a class="action-tile" href="send-email.html"><span class="material-symbols-outlined">upload_file</span>Document request</a></div></section></div>`;
  }

  if (page.type === "sms") {
    return `<div class="content-grid two">${messageForm("Compose SMS", "SMS")}<section class="panel"><h2>SMS Templates</h2><div class="quick-actions"><a class="action-tile" href="send-sms.html"><span class="material-symbols-outlined">payments</span>Payment due</a><a class="action-tile" href="send-sms.html"><span class="material-symbols-outlined">verified</span>KYC approved</a><a class="action-tile" href="send-sms.html"><span class="material-symbols-outlined">warning</span>Overdue notice</a></div></section></div>`;
  }

  if (page.type === "announcement") {
    return `<div class="content-grid two">${messageForm("Create Announcement", "Announcement")}<section class="panel"><h2>Announcement Targets</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">groups</span></div><div><strong>All borrowers</strong><p>General system updates, product changes, and planned maintenance.</p></div></article><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">admin_panel_settings</span></div><div><strong>Admin team</strong><p>Internal workflow updates and support queue reminders.</p></div></article></div></section></div>`;
  }

  if (page.type === "reminders") {
    return `<section class="panel"><div class="page-head"><div><p class="page-kicker">Automation</p><h2>Reminder Rules</h2><p>Keep borrowers updated before payments become late or documents expire.</p></div><a class="btn btn-small" href="send-sms.html">New Reminder</a></div>${reminderTable()}</section>`;
  }

  if (page.type === "logs") {
    return logs();
  }

  return `${typeCards()}${logs()}`;
};

const bottomNav = () => `<nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="notifications.html"><span class="material-symbols-outlined">notifications</span><span>Center</span></a>
    <a href="announcement.html"><span class="material-symbols-outlined">campaign</span><span>Announce</span></a>
    <a href="reminders.html"><span class="material-symbols-outlined">event_upcoming</span><span>Remind</span></a>
    <a href="send-email.html"><span class="material-symbols-outlined">mail</span><span>Email</span></a>
    <a href="notification-logs.html"><span class="material-symbols-outlined">history</span><span>Logs</span></a>
  </nav>`;

const pageHtml = (page) => `${head(page.title)}
<body class="notification-page user-body">
  ${topbar(page.active)}
  <main class="user-shell">
    <div class="user-layout">
      ${sideNav(page.active)}
      <section class="user-content">
        ${hero(page)}
        ${content(page)}
      </section>
    </div>
  </main>
  ${bottomNav()}
  <script src="../static/script.js"></script>
</body>
</html>`;

for (const [file, page] of Object.entries(pages)) {
  fs.writeFileSync(path.join(notificationRoot, file), pageHtml(page), "utf8");
}

console.log("Notification HTML pages generated.");
