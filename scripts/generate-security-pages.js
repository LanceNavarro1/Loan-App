const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const securityRoot = path.join(root, "security page");

const pages = {
  "security-settings.html": {
    title: "Security Settings",
    kicker: "System protection",
    description: "Manage account protection, password rules, login alerts, and admin security controls.",
    active: "security-settings.html",
    type: "settings",
  },
  "two-factor-authentication.html": {
    title: "Two-Factor Authentication",
    kicker: "Identity protection",
    description: "Require additional verification before users and admins can access sensitive loan data.",
    active: "two-factor-authentication.html",
    type: "2fa",
  },
  "login-history.html": {
    title: "Login History",
    kicker: "Access monitoring",
    description: "Review recent sign-ins, devices, locations, and suspicious login attempts.",
    active: "login-history.html",
    type: "login",
  },
  "activity-logs.html": {
    title: "Activity Logs",
    kicker: "Audit trail",
    description: "Track security-sensitive actions across accounts, payments, loan files, and admin access.",
    active: "activity-logs.html",
    type: "activity",
  },
  "backup-restore.html": {
    title: "Backup Restore",
    kicker: "Recovery controls",
    description: "Manage backups, restore points, and recovery readiness for Easy Loan records.",
    active: "backup-restore.html",
    type: "backup",
  },
};

const navItems = [
  ["shield", "Security Settings", "security-settings.html"],
  ["passkey", "Two-Factor Auth", "two-factor-authentication.html"],
  ["login", "Login History", "login-history.html"],
  ["manage_search", "Activity Logs", "activity-logs.html"],
  ["backup", "Backup Restore", "backup-restore.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Security</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../static/styles.css">
</head>`;

const topbar = (active) => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <nav class="desktop-nav" aria-label="Security navigation">
      <a class="${active === "security-settings.html" ? "active" : ""}" href="security-settings.html">Settings</a>
      <a class="${active === "two-factor-authentication.html" ? "active" : ""}" href="two-factor-authentication.html">2FA</a>
      <a class="${active === "login-history.html" ? "active" : ""}" href="login-history.html">History</a>
      <a class="${active === "activity-logs.html" ? "active" : ""}" href="activity-logs.html">Logs</a>
    </nav>
    <div class="user-actions">
      <a class="icon-button" href="../notifications/notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../Admin/dashboard.html">Admin</a>
    </div>
  </header>`;

const sideNav = (active) => `<aside class="security-nav" aria-label="Security sections">
          ${navItems.map(([icon, label, href]) => `<a class="${href === active ? "active" : ""}" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n          ")}
        </aside>`;

const hero = (page) => `<section class="security-hero">
          <div class="security-hero-copy">
            <p class="page-kicker">${page.kicker}</p>
            <h1>${page.title}</h1>
            <p>${page.description}</p>
          </div>
          <section class="panel">
            <h2>Security Score</h2>
            <div class="security-score"><div><strong>91%</strong><span>Protected</span></div></div>
          </section>
        </section>`;

const checkCards = () => `<section class="security-check-grid">
          <article class="panel security-check-card"><span class="material-symbols-outlined">verified_user</span><h2>2FA Coverage</h2><p class="muted">Admins and staff have extra sign-in verification.</p></article>
          <article class="panel security-check-card"><span class="material-symbols-outlined">vpn_key</span><h2>Password Rules</h2><p class="muted">Strong password requirements are enabled.</p></article>
          <article class="panel security-check-card"><span class="material-symbols-outlined">backup</span><h2>Backups</h2><p class="muted">Recovery points are monitored and ready.</p></article>
        </section>`;

const eventList = (title) => `<section class="panel">
          <div class="page-head"><div><p class="page-kicker">Audit</p><h2>${title}</h2><p>Security events recorded by the Easy Loan system.</p></div><a class="btn btn-small" href="activity-logs.html">View All</a></div>
          <div class="security-event-list">
            <article class="security-event"><span class="material-symbols-outlined">login</span><div><strong>Admin sign-in approved</strong><span>admin@easyloan.test from Chrome on Windows</span></div><time>May 24, 2026 6:42 PM</time></article>
            <article class="security-event"><span class="material-symbols-outlined">lock_reset</span><div><strong>Password reset requested</strong><span>Lance Navarro verified by email code</span></div><time>May 24, 2026 5:18 PM</time></article>
            <article class="security-event"><span class="material-symbols-outlined">admin_panel_settings</span><div><strong>Loan role permission updated</strong><span>Support role can view tickets and borrower notes</span></div><time>May 24, 2026 3:04 PM</time></article>
          </div>
        </section>`;

const settingsForm = () => `<section class="panel">
          <h2>Security Controls</h2>
          <div class="toggle-row"><div><strong>Require admin 2FA</strong><p class="muted">Ask admins for a second verification step.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
          <div class="toggle-row"><div><strong>Login alerts</strong><p class="muted">Send alerts when a new device signs in.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
          <div class="toggle-row"><div><strong>Session timeout</strong><p class="muted">Automatically sign out inactive admin sessions.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div>
          <div class="toggle-row"><div><strong>Export approval</strong><p class="muted">Require approval before exporting borrower data.</p></div><label class="toggle"><input type="checkbox"><span></span></label></div>
        </section>`;

const twoFactorForm = () => `<section class="panel">
          <h2>Two-Factor Setup</h2>
          <form class="form-grid" data-demo-form>
            <label class="field"><span>Verification Method</span><select><option>Authenticator app</option><option>Email code</option><option>SMS code</option></select></label>
            <label class="field"><span>Admin Email</span><input type="email" value="admin@easyloan.test"></label>
            <label class="field"><span>Recovery Contact</span><input type="text" value="+63 912 345 6789"></label>
            <div class="form-actions"><button class="btn btn-primary" type="submit">Enable 2FA</button><button class="btn-secondary" type="button">Generate Recovery Codes</button></div>
            <p class="muted" data-form-message></p>
          </form>
        </section>`;

const loginTable = () => `<section class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>User</th><th>Device</th><th>Location</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>admin@easyloan.test</td><td>Chrome / Windows</td><td>Manila, PH</td><td>May 24, 2026 6:42 PM</td><td><span class="status approved">Allowed</span></td></tr>
              <tr><td>support@easyloan.test</td><td>Edge / Windows</td><td>Quezon City, PH</td><td>May 24, 2026 5:51 PM</td><td><span class="status approved">Allowed</span></td></tr>
              <tr><td>unknown@example.com</td><td>Unknown device</td><td>Unknown</td><td>May 24, 2026 4:18 PM</td><td><span class="status rejected">Blocked</span></td></tr>
            </tbody>
          </table>
        </section>`;

const backupContent = () => `<div class="content-grid two">
          <section class="panel"><h2>Backup Status</h2><div class="backup-card"><strong>Daily backup complete</strong><p class="muted">Last recovery point created May 24, 2026 at 2:00 AM.</p><button class="btn btn-primary" type="button">Create Backup</button></div><div class="backup-card"><strong>Restore point ready</strong><p class="muted">Use this only when data recovery is required.</p><button class="btn-secondary" type="button">Review Restore Point</button></div></section>
          <section class="panel"><h2>Recovery Checklist</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">check_circle</span></div><div><strong>Database snapshot</strong><p>Loan, borrower, payment, and support records are included.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">cloud_done</span></div><div><strong>Offsite copy</strong><p>Encrypted copy is ready for disaster recovery review.</p></div></article></div></section>
        </div>`;

const content = (page) => {
  if (page.type === "settings") return `${checkCards()}<div class="content-grid two">${settingsForm()}${eventList("Recent Security Events")}</div>`;
  if (page.type === "2fa") return `<div class="content-grid two">${twoFactorForm()}<section class="panel"><h2>2FA Coverage</h2><div class="profile-list"><div class="profile-row"><span>Admins protected</span><strong>12 of 12</strong></div><div class="profile-row"><span>Staff protected</span><strong>28 of 31</strong></div><div class="profile-row"><span>Recovery codes issued</span><strong>9</strong></div></div></section></div>`;
  if (page.type === "login") return `<section class="panel"><div class="page-head"><div><p class="page-kicker">Access</p><h2>Recent Logins</h2><p>Review successful and blocked sign-in attempts.</p></div><a class="btn btn-small" href="security-settings.html">Settings</a></div>${loginTable()}</section>`;
  if (page.type === "activity") return eventList("Activity Logs");
  return backupContent();
};

const bottomNav = () => `<nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="security-settings.html"><span class="material-symbols-outlined">shield</span><span>Secure</span></a>
    <a href="two-factor-authentication.html"><span class="material-symbols-outlined">passkey</span><span>2FA</span></a>
    <a href="login-history.html"><span class="material-symbols-outlined">login</span><span>Logins</span></a>
    <a href="activity-logs.html"><span class="material-symbols-outlined">history</span><span>Logs</span></a>
    <a href="backup-restore.html"><span class="material-symbols-outlined">backup</span><span>Backup</span></a>
  </nav>`;

const pageHtml = (page) => `${head(page.title)}
<body class="security-page user-body">
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
  fs.writeFileSync(path.join(securityRoot, file), pageHtml(page), "utf8");
}

console.log("Security HTML pages generated.");
