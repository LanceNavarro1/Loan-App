const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const staffRoot = path.join(root, "staff and admin management");

const pages = {
  "staff.html": ["Staff", "Team directory", "Manage support staff, loan reviewers, collectors, and operational users.", "staff"],
  "admin-list.html": ["Admin List", "Admin access", "Review administrators with privileged Easy Loan system access.", "admins"],
  "add-staff.html": ["Add Staff", "New teammate", "Create a staff profile and assign system access.", "add"],
  "edit-staff.html": ["Edit Staff", "Profile update", "Update staff information, assignment, and access level.", "edit"],
  "roles-permissions.html": ["Roles Permissions", "Access control", "Define permissions for admins, reviewers, support, and payment teams.", "roles"],
  "staff-activity.html": ["Staff Activity", "Work audit", "Monitor staff actions across support, loan, payment, and admin workflows.", "activity"],
};

const nav = [
  ["groups", "Staff", "staff.html"],
  ["admin_panel_settings", "Admins", "admin-list.html"],
  ["person_add", "Add Staff", "add-staff.html"],
  ["manage_accounts", "Edit Staff", "edit-staff.html"],
  ["rule", "Roles", "roles-permissions.html"],
  ["history", "Activity", "staff-activity.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan Staff</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../static/styles.css">
</head>`;

const topbar = (active) => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <nav class="desktop-nav" aria-label="Staff navigation">
      <a class="${active === "staff.html" ? "active" : ""}" href="staff.html">Staff</a>
      <a class="${active === "admin-list.html" ? "active" : ""}" href="admin-list.html">Admins</a>
      <a class="${active === "roles-permissions.html" ? "active" : ""}" href="roles-permissions.html">Roles</a>
      <a class="${active === "staff-activity.html" ? "active" : ""}" href="staff-activity.html">Activity</a>
    </nav>
    <div class="user-actions">
      <a class="icon-button" href="../notifications/notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../Admin/dashboard.html">Admin</a>
    </div>
  </header>`;

const sideNav = (active) => `<aside class="management-nav" aria-label="Staff sections">
          ${nav.map(([icon, label, href]) => `<a class="${href === active ? "active" : ""}" href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n          ")}
        </aside>`;

const hero = (page) => `<section class="management-hero">
          <div class="management-hero-copy"><p class="page-kicker">${page[1]}</p><h1>${page[0]}</h1><p>${page[2]}</p></div>
          <section class="panel"><h2>Team Overview</h2><div class="profile-list"><div class="profile-row"><span>Active staff</span><strong>42</strong></div><div class="profile-row"><span>Admins</span><strong>12</strong></div><div class="profile-row"><span>Open assignments</span><strong>18</strong></div></div></section>
        </section>`;

const cards = () => `<section class="management-card-grid">
          <article class="panel management-card"><span class="material-symbols-outlined">support_agent</span><h2>Support</h2><p class="muted">Handles tickets, chat, and borrower concerns.</p></article>
          <article class="panel management-card"><span class="material-symbols-outlined">fact_check</span><h2>Reviewers</h2><p class="muted">Reviews applications, documents, and KYC records.</p></article>
          <article class="panel management-card"><span class="material-symbols-outlined">payments</span><h2>Collections</h2><p class="muted">Manages payments, receipts, and overdue accounts.</p></article>
        </section>`;

const staffTable = (adminOnly = false) => `<section class="data-table-wrap"><table class="data-table">
            <thead><tr><th>Staff</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              <tr><td><span class="staff-avatar">LN</span> Lance Navarro</td><td>lance@easyloan.test</td><td>${adminOnly ? "Super Admin" : "Loan Reviewer"}</td><td><span class="status approved">Active</span></td><td><a class="btn-secondary" href="edit-staff.html">Edit</a></td></tr>
              <tr><td><span class="staff-avatar">MS</span> Mia Santos</td><td>mia@easyloan.test</td><td>${adminOnly ? "Admin" : "Support Agent"}</td><td><span class="status approved">Active</span></td><td><a class="btn-secondary" href="edit-staff.html">Edit</a></td></tr>
              <tr><td><span class="staff-avatar">RC</span> Ramon Cruz</td><td>ramon@easyloan.test</td><td>${adminOnly ? "Audit Admin" : "Collections"}</td><td><span class="status pending">Pending</span></td><td><a class="btn-secondary" href="edit-staff.html">Review</a></td></tr>
            </tbody>
          </table></section>`;

const staffForm = (title) => `<section class="panel"><h2>${title}</h2><form class="form-grid" data-demo-form>
            <label class="field"><span>Full Name</span><input type="text" value="Lance Navarro"></label>
            <label class="field"><span>Email</span><input type="email" value="lance@easyloan.test"></label>
            <label class="field"><span>Role</span><select><option>Loan Reviewer</option><option>Support Agent</option><option>Collections</option><option>Admin</option></select></label>
            <label class="field"><span>Department</span><input type="text" value="Loan Operations"></label>
            <div class="form-actions"><button class="btn btn-primary" type="submit">Save Staff</button><a class="btn-secondary" href="staff.html">Back to Staff</a></div><p class="muted" data-form-message></p>
          </form></section>`;

const activity = () => `<section class="panel"><div class="page-head"><div><p class="page-kicker">Audit</p><h2>Recent Staff Activity</h2><p>Operational actions recorded across the Easy Loan system.</p></div><a class="btn btn-small" href="staff.html">Staff List</a></div><div class="notification-log-list">
            <article class="notification-log-item"><span class="material-symbols-outlined">fact_check</span><div><strong>Loan application reviewed</strong><span>Lance approved EZL-2026-018 after document check.</span></div><time>May 24, 2026 6:20 PM</time></article>
            <article class="notification-log-item"><span class="material-symbols-outlined">support_agent</span><div><strong>Support ticket resolved</strong><span>Mia closed SUP-2026-098.</span></div><time>May 24, 2026 5:48 PM</time></article>
            <article class="notification-log-item"><span class="material-symbols-outlined">payments</span><div><strong>Payment confirmed</strong><span>Ramon matched PAY-3001 to borrower account.</span></div><time>May 24, 2026 4:05 PM</time></article>
          </div></section>`;

const roles = () => `<section class="panel"><h2>Role Permissions</h2><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Role</th><th>Users</th><th>Loans</th><th>Payments</th><th>Settings</th></tr></thead><tbody>
            <tr><td>Super Admin</td><td>Full</td><td>Full</td><td>Full</td><td>Full</td></tr>
            <tr><td>Loan Reviewer</td><td>View</td><td>Approve</td><td>View</td><td>No access</td></tr>
            <tr><td>Support Agent</td><td>View</td><td>View</td><td>View</td><td>No access</td></tr>
            <tr><td>Collections</td><td>View</td><td>View</td><td>Confirm</td><td>No access</td></tr>
          </tbody></table></div></section>`;

const content = (type) => {
  if (type === "staff") return `${cards()}<section class="panel"><div class="page-head"><div><p class="page-kicker">Directory</p><h2>Staff Members</h2><p>Search and manage operational staff accounts.</p></div><a class="btn btn-small" href="add-staff.html">Add Staff</a></div>${staffTable(false)}</section>`;
  if (type === "admins") return `<section class="panel"><div class="page-head"><div><p class="page-kicker">Privileged access</p><h2>Admin Users</h2><p>Review users with administrator permissions.</p></div><a class="btn btn-small" href="roles-permissions.html">Roles</a></div>${staffTable(true)}</section>`;
  if (type === "add") return `<div class="content-grid two">${staffForm("Create Staff Account")}<section class="panel"><h2>Access Checklist</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">badge</span></div><div><strong>Assign role</strong><p>Choose the smallest access level needed for the job.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">passkey</span></div><div><strong>Enable 2FA</strong><p>Require verification before staff can access borrower records.</p></div></article></div></section></div>`;
  if (type === "edit") return `<div class="content-grid two">${staffForm("Edit Staff Account")}${activity()}</div>`;
  if (type === "roles") return roles();
  return activity();
};

const bottomNav = () => `<nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="staff.html"><span class="material-symbols-outlined">groups</span><span>Staff</span></a>
    <a href="admin-list.html"><span class="material-symbols-outlined">admin_panel_settings</span><span>Admins</span></a>
    <a href="add-staff.html"><span class="material-symbols-outlined">person_add</span><span>Add</span></a>
    <a href="roles-permissions.html"><span class="material-symbols-outlined">rule</span><span>Roles</span></a>
    <a href="staff-activity.html"><span class="material-symbols-outlined">history</span><span>Activity</span></a>
  </nav>`;

for (const [file, page] of Object.entries(pages)) {
  const html = `${head(page[0])}
<body class="staff-page user-body">
  ${topbar(file)}
  <main class="user-shell"><div class="user-layout">${sideNav(file)}<section class="user-content">${hero(page)}${content(page[3])}</section></div></main>
  ${bottomNav()}
  <script src="../static/script.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(staffRoot, file), html, "utf8");
}

console.log("Staff and admin management HTML pages generated.");
