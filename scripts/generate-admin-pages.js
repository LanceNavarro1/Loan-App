const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const adminRoot = path.join(root, "Admin");

const sections = [
  {
    folder: "",
    page: "dashboard",
    files: ["index.html", "dashboard.html", "admin-dashboard.html", "analytics.html", "statistics.html", "activity-logs.html"],
  },
  {
    folder: "user management",
    page: "users",
    files: [
      "users.html",
      "add-user.html",
      "edit-user.html",
      "user-details.html",
      "user-roles.html",
      "verified-users.html",
      "inactive-users.html",
      "blocked-users.html",
    ],
  },
  {
    folder: "loan application page",
    page: "loan applications",
    files: [
      "loan-applications.html",
      "pending-loans.html",
      "approved-loans.html",
      "loan-rejected.html",
      "loan-review.html",
      "loan-details.html",
      "loan-status.html",
    ],
  },
  {
    folder: "loan plans management",
    page: "loan plans",
    files: [
      "loan-plans.html",
      "add-loan-plan.html",
      "edit-loan-plan.html",
      "loan-categories.html",
      "loan-interest-rates.html",
      "loan-terms.html",
    ],
  },
  {
    folder: "Payments Management",
    page: "payments",
    files: [
      "payments.html",
      "confirm-payment.html",
      "payment-details.html",
      "payment-history.html",
      "overdue-payments.html",
      "penalty-management.html",
      "receipts.html",
    ],
  },
  {
    folder: "barrower verification page",
    page: "borrower verification",
    files: [
      "documents.html",
      "document-verification.html",
      "borrower-requirements.html",
      "kyc-verification.html",
      "income-verification.html",
      "valid-id-review.html",
    ],
  },
  {
    folder: "reports and analytics",
    page: "reports",
    files: [
      "reports.html",
      "borrower-reports.html",
      "loan-reports.html",
      "payment-reports.html",
      "revenue-reports.html",
      "monthly-statistics.html",
      "export-reports.html",
    ],
  },
];

const specialTitles = {
  "admin-dashboard": "Admin Dashboard",
  kyc: "KYC",
  id: "ID",
};

const toTitle = (file) => {
  const base = path.basename(file, ".html");
  return base
    .split("-")
    .map((word) => specialTitles[word] || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const pageKey = (file) => path.basename(file, ".html").replaceAll("-", " ");

const cssPath = (depth) => `${"../".repeat(depth + 1)}static/styles.css`;
const scriptPath = (depth) => `${"../".repeat(depth + 1)}static/script.js`;

const head = (title, depth) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssPath(depth)}">
</head>`;

const sidebar = (depth) => `<aside class="sidebar">
      <a class="brand" href="${depth ? "../dashboard.html" : "dashboard.html"}">
        <span class="brand-mark">EL</span>
        <div><h1>Easy Loan Admin</h1><p>Control room</p></div>
      </a>
      <nav class="nav" aria-label="Admin navigation"></nav>
    </aside>`;

const statCards = (cards) => `<section class="grid">
        ${cards.map(([label, value, note]) => `<article class="card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`).join("\n        ")}
      </section>`;

const status = (kind, label) => `<span class="status ${kind}">${label}</span>`;

const table = (id, columns, rows) => `<section class="panel">
          <div class="toolbar">
            <input class="search" type="search" placeholder="Search records" data-search="#${id}" aria-label="Search records">
            <button class="btn secondary" type="button" data-action="Export queued for backend integration.">Export</button>
            <button class="btn" type="button" data-action="New record form ready for backend integration.">New</button>
          </div>
          <table id="${id}">
            <thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("\n              ")}
            </tbody>
          </table>
        </section>`;

const timeline = (items) => `<section class="panel">
          <h3>Priority Queue</h3>
          <div class="admin-filter-tabs" data-filter-tabs>
            <button class="is-active" type="button" data-filter-button="all">All</button>
            <button type="button" data-filter-button="urgent">Urgent</button>
            <button type="button" data-filter-button="review">Review</button>
            <button type="button" data-filter-button="done">Done</button>
          </div>
          <div class="admin-task-list" data-filter-list>
            ${items.map(([code, text, filter]) => `<article data-filter-item="${filter}"><strong>${code}</strong><span>${text}</span><button class="btn secondary" type="button" data-action="${code} opened.">Open</button></article>`).join("\n            ")}
          </div>
        </section>`;

const formPanel = (title, fields) => `<section class="panel">
          <h3>${title}</h3>
          <form class="form-grid" data-demo-form>
            ${fields.map(([label, type, value]) => `<label class="field"><span>${label}</span><input type="${type}" value="${value}"></label>`).join("\n            ")}
            <div class="actions">
              <button class="btn" type="submit">Save</button>
              <button class="btn secondary" type="button" data-action="Draft saved locally for backend integration.">Save Draft</button>
            </div>
          </form>
        </section>`;

const chart = () => `<section class="panel">
          <h3>Monthly Trend</h3>
          <div class="chart" aria-label="Monthly trend chart">
            <span class="bar" style="height:44%"></span>
            <span class="bar" style="height:62%"></span>
            <span class="bar" style="height:51%"></span>
            <span class="bar" style="height:78%"></span>
            <span class="bar" style="height:69%"></span>
            <span class="bar" style="height:88%"></span>
          </div>
        </section>`;

const dashboardContent = (title, isIndex) => {
  const modules = [
    ["group", "User Management", "Create, edit, verify, block, and review borrower accounts.", "user management/users.html"],
    ["request_quote", "Loan Applications", "Review pending, approved, rejected, and in-progress loan files.", "loan application page/loan-applications.html"],
    ["payments", "Payments", "Confirm payments, issue receipts, penalties, and overdue accounts.", "Payments Management/payments.html"],
    ["monitoring", "Reports", "Track revenue, borrower, loan, payment, and monthly statistics.", "reports and analytics/reports.html"],
    ["fact_check", "Borrower Verification", "Check KYC, valid IDs, income documents, and requirements.", "barrower verification page/kyc-verification.html"],
    ["tune", "Loan Plans", "Manage categories, terms, rates, and loan plan setup.", "loan plans management/loan-plans.html"],
  ];

  return `${statCards([
    ["Pending reviews", "42", "Need admin decision"],
    ["Active borrowers", "2,418", "Across all accounts"],
    ["Collected today", "&#8369;128K", "Confirmed payments"],
    ["Overdue accounts", "18", "Requires follow-up"],
  ])}
      <section class="admin-module-grid">
        ${modules.map(([icon, name, desc, href]) => `<a class="admin-module" href="${href}"><span class="material-symbols-outlined">${icon}</span><h3>${name}</h3><p>${desc}</p><div class="chip-row"><span>Open</span><span>Admin</span></div></a>`).join("\n        ")}
      </section>
      ${isIndex ? `<section class="panel" style="margin-top:18px"><h3>Admin Portal Map</h3><p>Every folder in the Admin directory now has matching HTML pages wired to this Easy Loan admin system.</p></section>` : ""}`;
};

const rowsFor = (file, sectionPage) => {
  if (sectionPage === "users") {
    return [
      ["USR-1024", "Lance Navarro", "lance@example.com", status("good", "Verified"), "<button class=\"btn secondary\" type=\"button\" data-action=\"User opened.\">View</button>"],
      ["USR-1031", "Mia Santos", "mia@example.com", status("warn", "Pending"), "<button class=\"btn secondary\" type=\"button\" data-action=\"User opened.\">Review</button>"],
      ["USR-1040", "Ramon Cruz", "ramon@example.com", status("bad", "Blocked"), "<button class=\"btn secondary\" type=\"button\" data-action=\"User opened.\">Edit</button>"],
    ];
  }

  if (sectionPage === "loan applications") {
    return [
      ["EZL-2026-018", "Lance Navarro", "Business", "&#8369;25,000", status("warn", "Pending"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Loan opened.\">Review</button>"],
      ["EZL-2026-014", "Mia Santos", "Personal", "&#8369;13,500", status("good", "Approved"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Loan opened.\">Details</button>"],
      ["EZL-2026-009", "Ramon Cruz", "Emergency", "&#8369;8,000", status("bad", "Rejected"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Loan opened.\">Open</button>"],
    ];
  }

  if (sectionPage === "loan plans") {
    return [
      ["Starter", "Personal", "4.5%", "3-6 months", status("good", "Active"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Plan opened.\">Edit</button>"],
      ["Business Plus", "Business", "6.2%", "6-18 months", status("good", "Active"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Plan opened.\">Edit</button>"],
      ["Emergency Flex", "Emergency", "5.1%", "1-4 months", status("warn", "Draft"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Plan opened.\">Open</button>"],
    ];
  }

  if (sectionPage === "payments") {
    return [
      ["PAY-3001", "EZL-2026-018", "Lance Navarro", "&#8369;4,250", status("good", "Paid"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Receipt opened.\">Receipt</button>"],
      ["PAY-3002", "EZL-2026-014", "Mia Santos", "&#8369;3,100", status("warn", "Due"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Payment opened.\">Confirm</button>"],
      ["PAY-3003", "EZL-2026-011", "Ramon Cruz", "&#8369;2,800", status("bad", "Overdue"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Account opened.\">Follow Up</button>"],
    ];
  }

  if (sectionPage === "borrower verification") {
    return [
      ["DOC-841", "Lance Navarro", "Valid ID", "May 24, 2026", status("warn", "For Review"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Document opened.\">Review</button>"],
      ["DOC-822", "Mia Santos", "Income Proof", "May 23, 2026", status("good", "Approved"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Document opened.\">Open</button>"],
      ["DOC-803", "Ramon Cruz", "KYC Form", "May 22, 2026", status("bad", "Needs Update"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Document opened.\">Request</button>"],
    ];
  }

  return [
    ["RPT-501", "Loan Portfolio", "May 2026", status("good", "Ready"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Report exported.\">Export</button>"],
    ["RPT-502", "Payment Aging", "May 2026", status("warn", "Review"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Report opened.\">Open</button>"],
    ["RPT-503", "Revenue Summary", "May 2026", status("good", "Ready"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Report exported.\">Export</button>"],
  ];
};

const columnsFor = (sectionPage) => {
  if (sectionPage === "users") return ["User ID", "Name", "Email", "Status", "Action"];
  if (sectionPage === "loan applications") return ["Loan ID", "Borrower", "Type", "Amount", "Status", "Action"];
  if (sectionPage === "loan plans") return ["Plan", "Category", "Rate", "Term", "Status", "Action"];
  if (sectionPage === "payments") return ["Payment ID", "Loan ID", "Borrower", "Amount", "Status", "Action"];
  if (sectionPage === "borrower verification") return ["Document ID", "Borrower", "Document", "Submitted", "Status", "Action"];
  return ["Report ID", "Report", "Period", "Status", "Action"];
};

const workspace = (file, sectionPage, title) => {
  const key = path.basename(file, ".html");

  if (["index", "dashboard", "admin-dashboard"].includes(key)) {
    return dashboardContent(title, key === "index");
  }

  if (["analytics", "statistics", "reports", "borrower-reports", "loan-reports", "payment-reports", "revenue-reports", "monthly-statistics"].includes(key)) {
    return `${statCards([
      ["Reviewed files", "1,284", "This month"],
      ["Approval rate", "73%", "Across all loans"],
      ["Revenue", "&#8369;842K", "Monthly gross"],
      ["Exports", "36", "Generated reports"],
    ])}
      <div class="content-grid">${table("admin-records", columnsFor("reports"), rowsFor(file, "reports"))}${chart()}</div>`;
  }

  if (key.includes("add") || key.includes("edit") || key.includes("confirm") || key.includes("review") || key.includes("verification")) {
    return `<div class="content-grid">
        ${formPanel(title, [
          ["Reference ID", "text", "EZL-2026-018"],
          ["Borrower Name", "text", "Lance Navarro"],
          ["Amount", "text", "25000"],
          ["Admin Notes", "text", "Ready for review"],
        ])}
        ${timeline([
          ["Review", `Complete ${title.toLowerCase()} checklist`, "review"],
          ["Compliance", "Validate uploaded documents and profile data", "urgent"],
          ["Decision", "Submit admin action for backend processing", "done"],
        ])}
      </div>`;
  }

  if (key.includes("details") || key.includes("status") || key.includes("requirements") || key.includes("roles")) {
    return `<div class="content-grid">
        <section class="panel">
          <h3>${title} Summary</h3>
          <ul class="list">
            <li><strong>Reference</strong><span>EZL-2026-018</span></li>
            <li><strong>Borrower</strong><span>Lance Navarro</span></li>
            <li><strong>Status</strong><span>${status("warn", "Needs admin action")}</span></li>
            <li><strong>Last Updated</strong><span>May 24, 2026</span></li>
          </ul>
        </section>
        ${timeline([
          ["Profile", "Borrower profile and contact details verified", "done"],
          ["Documents", "Supporting documents need final review", "review"],
          ["Decision", "Admin approval is still pending", "urgent"],
        ])}
      </div>`;
  }

  if (key === "activity-logs") {
    return table("admin-records", ["Time", "Admin", "Activity", "Status", "Action"], [
      ["10:18 AM", "Admin Lance", "Approved borrower document", status("good", "Recorded"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Activity opened.\">Open</button>"],
      ["09:42 AM", "Admin Mia", "Updated loan plan rate", status("warn", "Review"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Activity opened.\">Open</button>"],
      ["08:55 AM", "System", "Daily payment report generated", status("good", "Recorded"), "<button class=\"btn secondary\" type=\"button\" data-action=\"Activity opened.\">Open</button>"],
    ]);
  }

  return `<div class="content-grid">
        ${table("admin-records", columnsFor(sectionPage), rowsFor(file, sectionPage))}
        ${timeline([
          ["Queue", `${title} records ready for review`, "review"],
          ["Urgent", "Accounts requiring same-day admin attention", "urgent"],
          ["Done", "Completed records awaiting backend sync", "done"],
        ])}
      </div>`;
};

const page = (file, section, depth) => {
  const title = toTitle(file);
  const isRoot = section.folder === "";
  const key = pageKey(file);
  const activePage = isRoot && !["index", "admin dashboard"].includes(key) ? key : section.page;

  if (file === "login.html") {
    return `${head("Admin Login", 0)}
<body class="auth-screen admin-page" data-page="login" data-admin-depth="0">
  <section class="auth-card">
    <a class="brand" href="index.html"><span class="brand-mark">EL</span><div><h1>Easy Loan Admin</h1><p>Secure access</p></div></a>
    <h2>Admin Login</h2>
    <p>Enter your admin credentials to continue to the dashboard.</p>
    <form class="form-grid" data-login-form data-redirect="dashboard.html">
      <label class="field"><span>Email</span><input type="email" value="admin@easyloan.test" required></label>
      <label class="field"><span>Password</span><input type="password" value="admin123" required></label>
      <button class="btn" type="submit">Sign In</button>
    </form>
  </section>
  <script src="${scriptPath(0)}"></script>
</body>
</html>`;
  }

  if (file === "logout.html") {
    return `${head("Admin Logout", 0)}
<body class="auth-screen admin-page" data-page="logout" data-admin-depth="0">
  <section class="auth-card">
    <a class="brand" href="index.html"><span class="brand-mark">EL</span><div><h1>Easy Loan Admin</h1><p>Signed out</p></div></a>
    <h2>Session Ended</h2>
    <p>Your admin session has ended safely.</p>
    <div class="actions"><a class="btn" href="login.html">Sign In Again</a><a class="btn secondary" href="../landing.html">Back to Site</a></div>
  </section>
  <script src="${scriptPath(0)}"></script>
</body>
</html>`;
  }

  const sectionLabel = isRoot ? "Admin Portal" : section.folder.replace("barrower", "borrower");

  return `${head(title, depth)}
<body class="admin-page" data-page="${activePage}" data-admin-depth="${depth}">
  <div class="shell">
    ${sidebar(depth)}
    <main class="main">
      <section class="topbar">
        <div>
          <p class="eyebrow">${sectionLabel}</p>
          <h2>${title}</h2>
          <p>Manage ${key} records for the Easy Loan admin system.</p>
        </div>
        <div class="actions">
          <a class="btn secondary" href="${depth ? "../dashboard.html" : "dashboard.html"}">Dashboard</a>
          <button class="btn" type="button" data-action="${title} action ready for backend integration.">Admin Action</button>
        </div>
      </section>
      ${workspace(file, section.page, title)}
    </main>
  </div>
  <script src="${scriptPath(depth)}"></script>
</body>
</html>`;
};

for (const section of sections) {
  const depth = section.folder ? 1 : 0;

  for (const file of section.files) {
    const target = path.join(adminRoot, section.folder, file);
    fs.writeFileSync(target, page(file, section, depth), "utf8");
  }
}

fs.writeFileSync(path.join(adminRoot, "login.html"), page("login.html", sections[0], 0), "utf8");
fs.writeFileSync(path.join(adminRoot, "logout.html"), page("logout.html", sections[0], 0), "utf8");

console.log("Admin HTML pages generated.");
