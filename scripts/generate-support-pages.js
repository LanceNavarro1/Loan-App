const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const supportRoot = path.join(root, "customer support page");

const pages = {
  "support-tickets.html": {
    title: "Support Tickets",
    kicker: "Ticket queue",
    description: "Track borrower questions, repayment concerns, document issues, and loan application requests.",
    active: "support-tickets.html",
    type: "tickets",
  },
  "ticket-details.html": {
    title: "Ticket Details",
    kicker: "Case review",
    description: "Review a full support case, borrower context, status, and the next response needed.",
    active: "ticket-details.html",
    type: "details",
  },
  "live-chat.html": {
    title: "Live Chat",
    kicker: "Real-time help",
    description: "Continue conversations with borrowers who need help with loans, payments, and account access.",
    active: "live-chat.html",
    type: "chat",
  },
  "feedback.html": {
    title: "Feedback",
    kicker: "Customer voice",
    description: "Collect feedback about the Easy Loan process and route improvements to the admin team.",
    active: "feedback.html",
    type: "feedback",
  },
  "customer-concerns.html": {
    title: "Customer Concerns",
    kicker: "Concern intake",
    description: "Document borrower concerns and assign them to the right support or admin workflow.",
    active: "customer-concerns.html",
    type: "concerns",
  },
};

const navItems = [
  ["support_agent", "Support Tickets", "support-tickets.html"],
  ["quickreply", "Live Chat", "live-chat.html"],
  ["report", "Customer Concerns", "customer-concerns.html"],
  ["rate_review", "Feedback", "feedback.html"],
  ["assignment", "Ticket Details", "ticket-details.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Support</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../static/styles.css">
</head>`;

const topbar = () => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <nav class="desktop-nav" aria-label="Support navigation">
      <a href="support-tickets.html">Tickets</a>
      <a href="live-chat.html">Chat</a>
      <a href="customer-concerns.html">Concerns</a>
      <a href="feedback.html">Feedback</a>
    </nav>
    <div class="user-actions">
      <a class="icon-button" href="../user/notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../user/dashboard.html">Account</a>
    </div>
  </header>`;

const sidebar = (active) => `<aside class="support-sidebar" aria-label="Support sections">
          ${navItems.map(([icon, label, href]) => `<a class="${href === active ? "active" : ""}" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n          ")}
        </aside>`;

const hero = (page) => `<section class="support-hero">
          <div class="support-hero-panel">
            <p class="page-kicker">${page.kicker}</p>
            <h1>${page.title}</h1>
            <p>${page.description}</p>
          </div>
          <section class="panel support-status-panel">
            <h2>Support Summary</h2>
            <div class="profile-list">
              <div class="profile-row"><span>Open tickets</span><strong>24</strong></div>
              <div class="profile-row"><span>Average first response</span><strong>8 minutes</strong></div>
              <div class="profile-row"><span>Escalations today</span><strong>3</strong></div>
            </div>
          </section>
        </section>`;

const channels = () => `<section class="support-channel-grid">
          <article class="panel support-channel"><span class="material-symbols-outlined">confirmation_number</span><h2>Tickets</h2><p class="muted">Organize payment, loan, document, and account issues.</p></article>
          <article class="panel support-channel"><span class="material-symbols-outlined">forum</span><h2>Chat</h2><p class="muted">Help borrowers quickly before issues become escalations.</p></article>
          <article class="panel support-channel"><span class="material-symbols-outlined">thumb_up</span><h2>Feedback</h2><p class="muted">Capture what borrowers say about the process.</p></article>
        </section>`;

const ticketTable = () => `<section class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Ticket ID</th><th>Customer</th><th>Topic</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td>SUP-2026-104</td><td>Lance Navarro</td><td>Payment confirmation</td><td>High</td><td><span class="status pending">Open</span></td><td><a class="btn-secondary" href="ticket-details.html">View</a></td></tr>
              <tr><td>SUP-2026-098</td><td>Mia Santos</td><td>Document upload</td><td>Normal</td><td><span class="status approved">Resolved</span></td><td><a class="btn-secondary" href="ticket-details.html">View</a></td></tr>
              <tr><td>SUP-2026-092</td><td>Ramon Cruz</td><td>Loan status</td><td>Urgent</td><td><span class="status rejected">Escalated</span></td><td><a class="btn-secondary" href="ticket-details.html">Review</a></td></tr>
            </tbody>
          </table>
        </section>`;

const ticketForm = (title) => `<section class="panel">
          <h2>${title}</h2>
          <form class="form-grid" data-demo-form>
            <label class="field"><span>Customer Name</span><input type="text" value="Lance Navarro"></label>
            <label class="field"><span>Concern Type</span><select><option>Payment issue</option><option>Loan application</option><option>Document verification</option><option>Account access</option></select></label>
            <label class="field"><span>Priority</span><select><option>Normal</option><option>High</option><option>Urgent</option></select></label>
            <label class="field"><span>Message</span><textarea>Customer needs help confirming the latest loan payment.</textarea></label>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Submit</button>
              <a class="btn-secondary" href="support-tickets.html">View Tickets</a>
            </div>
            <p class="muted" data-form-message></p>
          </form>
        </section>`;

const content = (page) => {
  if (page.type === "chat") {
    return `${channels()}
        <div class="content-grid two">
          <section class="panel">
            <h2>Active Conversation</h2>
            <div class="support-chat-window">
              <div class="support-message agent"><strong>Support Agent</strong><br>Hi Lance, I can help check your payment confirmation.</div>
              <div class="support-message customer"><strong>Customer</strong><br>I paid this morning but my dashboard still shows unpaid.</div>
              <div class="support-message agent"><strong>Support Agent</strong><br>Please send the reference number so we can match it with the payment record.</div>
            </div>
            <form class="support-compose" data-demo-form>
              <input type="text" placeholder="Type a support reply" aria-label="Type a support reply">
              <button class="btn btn-primary" type="submit">Send</button>
              <p class="muted" data-form-message></p>
            </form>
          </section>
          <section class="panel"><h2>Customer Context</h2><ul class="support-detail-list"><li><span>Loan ID</span><strong>EZL-2026-018</strong></li><li><span>Next payment</span><strong>&#8369;4,250 due Jun 15, 2026</strong></li><li><span>Account status</span><strong>Verified borrower</strong></li></ul></section>
        </div>`;
  }

  if (page.type === "details") {
    return `<div class="content-grid two">
          <section class="panel"><h2>Ticket SUP-2026-104</h2><ul class="support-detail-list"><li><span>Customer</span><strong>Lance Navarro</strong></li><li><span>Topic</span><strong>Payment confirmation</strong></li><li><span>Status</span><strong><span class="status pending">Open</span></strong></li><li><span>Assigned to</span><strong>Support Team A</strong></li></ul></section>
          <section class="panel"><h2>Response Notes</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">receipt_long</span></div><div><strong>Payment reference requested</strong><p>Customer was asked to provide the transaction reference for manual matching.</p></div></article><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">verified</span></div><div><strong>Borrower profile verified</strong><p>Contact number and email match the loan account record.</p></div></article></div></section>
        </div>
        ${ticketForm("Add Ticket Reply")}`;
  }

  if (page.type === "feedback") {
    return `<div class="content-grid two">
          ${ticketForm("Record Feedback")}
          <section class="panel"><h2>Recent Feedback</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">sentiment_satisfied</span></div><div><strong>Fast approval</strong><p>Customer liked the clear application status and quick review.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">tips_and_updates</span></div><div><strong>Improve uploads</strong><p>Customer requested clearer document upload instructions.</p></div></article></div></section>
        </div>`;
  }

  if (page.type === "concerns") {
    return `<div class="content-grid two">
          ${ticketForm("Log Customer Concern")}
          <section class="panel"><h2>Concern Categories</h2><div class="quick-actions"><a class="action-tile" href="support-tickets.html"><span class="material-symbols-outlined">payments</span>Payment follow-up</a><a class="action-tile" href="support-tickets.html"><span class="material-symbols-outlined">description</span>Document review</a><a class="action-tile" href="support-tickets.html"><span class="material-symbols-outlined">lock_reset</span>Account access</a></div></section>
        </div>`;
  }

  return `${channels()}
        <section class="panel">
          <div class="page-head"><div><p class="page-kicker">Open cases</p><h2>Ticket Queue</h2><p>Search, review, and route customer support issues.</p></div><a class="btn btn-small" href="customer-concerns.html">New Concern</a></div>
          ${ticketTable()}
        </section>`;
};

const pageHtml = (page) => `${head(page.title)}
<body class="support-page user-body">
  ${topbar()}
  <main class="user-shell">
    <div class="user-layout">
      ${sidebar(page.active)}
      <section class="user-content">
        ${hero(page)}
        ${content(page)}
      </section>
    </div>
  </main>
  <nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="support-tickets.html"><span class="material-symbols-outlined">confirmation_number</span><span>Tickets</span></a>
    <a href="live-chat.html"><span class="material-symbols-outlined">forum</span><span>Chat</span></a>
    <a href="customer-concerns.html"><span class="material-symbols-outlined">report</span><span>Concerns</span></a>
    <a href="feedback.html"><span class="material-symbols-outlined">rate_review</span><span>Feedback</span></a>
    <a href="../user/dashboard.html"><span class="material-symbols-outlined">person</span><span>Account</span></a>
  </nav>
  <script src="../static/script.js"></script>
</body>
</html>`;

for (const [file, page] of Object.entries(pages)) {
  fs.writeFileSync(path.join(supportRoot, file), pageHtml(page), "utf8");
}

console.log("Customer support HTML pages generated.");
