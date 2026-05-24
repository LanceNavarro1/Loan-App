const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const userRoot = path.join(root, "user");

const pages = {
  auth: {
    "login.html": ["Login", "User access", "Enter your account details to continue to your dashboard.", "login"],
    "register.html": ["Create Account", "New borrower", "Set up your borrower profile so you can apply for loans and track payments.", "register"],
    "logout.html": ["Logged Out", "Session ended", "Your Easy Loan session has ended safely.", "logout"],
    "forgot-password.html": ["Forgot Password", "Account recovery", "Request a secure reset code for your Easy Loan account.", "forgot"],
    "reset-password.html": ["Reset Password", "New password", "Create a new password after verifying your account.", "reset"],
    "verify-otp.html": ["Verify OTP", "Verification code", "Enter the one-time passcode sent to your email or phone.", "otp"],
  },
  docs: {
    "documents.html": ["Documents", "Verification files", "Manage the files used for identity checks, loan approval, and account review.", "documents"],
    "erification-status.html": ["Verification Status", "Document review", "Track identity, income, and uploaded document verification progress.", "verification"],
  },
  loans: {
    "apply-loan.html": ["Apply Loan", "New application", "Submit a loan request with amount, purpose, terms, and supporting details.", "loan-form"],
    "loan-form.html": ["Loan Form", "Application details", "Complete the borrower information needed for loan review.", "loan-form"],
    "loan-history.html": ["Loan History", "Past applications", "Review previous applications, approvals, rejections, and active loans.", "loan-history"],
    "loans.html": ["My Loans", "Loan dashboard", "Review every submitted loan and open full details.", "loans"],
    "loan-details.html": ["Loan Details", "Loan record", "View loan amount, schedule, status, and repayment summary.", "loan-details"],
    "loan-status.html": ["Loan Status", "Application timeline", "Track each stage of your loan review and approval process.", "loan-status"],
  },
  payments: {
    "payments.html": ["Payments", "Payment tracking", "Monitor paid and unpaid loan payments with due dates.", "payments"],
    "payment-history.html": ["Payment History", "Completed payments", "Review posted payments, dates, references, and status.", "payment-history"],
    "receipts.html": ["Receipts", "Proof of payment", "Open receipts for confirmed Easy Loan payments.", "receipts"],
    "upload-payment.html": ["Upload Payment", "Payment proof", "Submit transfer details and proof of payment for confirmation.", "upload-payment"],
  },
  profile: {
    "profile.html": ["Profile", "Account details", "Review personal information used for loan applications and verification.", "profile"],
    "edit-profile.html": ["Edit Profile", "Update account", "Keep your contact, address, and employment details current.", "edit-profile"],
    "change-password.html": ["Change Password", "Security update", "Update your password to keep your Easy Loan account secure.", "change-password"],
    "security-settings.html": ["Security Settings", "Account security", "Manage login alerts, password protection, and account safeguards.", "security"],
  },
  support: {
    "support.html": ["Support", "Help center", "Get help with loans, payments, documents, and account access.", "support"],
    "faq.html": ["FAQ", "Common questions", "Find answers about applications, repayments, verification, and account support.", "faq"],
    "live-chat.html": ["Live Chat", "Real-time support", "Continue a conversation with an Easy Loan support agent.", "chat"],
    "ticket.html": ["Ticket", "Support request", "Create or review a support ticket for borrower concerns.", "ticket"],
  },
};

const navItems = [
  ["Dashboard", "dashboard", "../dashboard.html"],
  ["Apply Loan", "edit_document", "../loans/apply-loan.html"],
  ["My Loans", "account_balance_wallet", "../loans/loans.html"],
  ["Loan Status", "monitoring", "../loans/loan-status.html"],
  ["Payments", "payments", "../payments/payments.html"],
  ["Documents", "description", "../docs/documents.html"],
  ["Schedule", "calendar_month", "../schedule.html"],
  ["Notifications", "notifications", "../notifications.html"],
  ["Profile", "person", "../profile/profile.html"],
  ["Support", "support_agent", "../support/support.html"],
  ["Settings", "settings", "../settings.html"],
];

const head = (title) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Easy Loan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../static/styles.css">
</head>`;

const topbar = () => `<header class="top-app-bar user-topbar">
    <a class="brand" href="../dashboard.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a>
    <div class="user-actions">
      <a class="icon-button" href="../notifications.html" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></a>
      <a class="btn btn-small" href="../loans/apply-loan.html">Apply</a>
    </div>
  </header>`;

const sidebar = () => `<aside class="user-sidebar" data-user-nav>
        ${navItems.map(([label, icon, href]) => `<a href="${href}"><span class="material-symbols-outlined">${icon}</span>${label}</a>`).join("\n        ")}
      </aside>`;

const bottomNav = () => `<nav class="bottom-nav user-bottom-nav" data-user-nav>
    <a href="../dashboard.html"><span class="material-symbols-outlined">dashboard</span><span>Home</span></a>
    <a href="../loans/loans.html"><span class="material-symbols-outlined">account_balance_wallet</span><span>Loans</span></a>
    <a href="../loans/apply-loan.html"><span class="material-symbols-outlined">add_card</span><span>Apply</span></a>
    <a href="../payments/payments.html"><span class="material-symbols-outlined">payments</span><span>Pay</span></a>
    <a href="../profile/profile.html"><span class="material-symbols-outlined">person</span><span>Profile</span></a>
  </nav>`;

const shell = (page, body) => `${head(page[0])}
<body class="user-body">
  ${topbar()}
  <main class="user-shell">
    <div class="user-layout">
      ${sidebar()}
      <section class="user-content">
        <div class="page-head">
          <div><p class="page-kicker">${page[1]}</p><h1>${page[0]}</h1><p>${page[2]}</p></div>
          <a class="btn btn-small" href="../support/support.html">Need Help?</a>
        </div>
        ${body}
      </section>
    </div>
  </main>
  ${bottomNav()}
  <script src="../../static/script.js"></script>
</body>
</html>`;

const status = (kind, label) => `<span class="status ${kind}">${label}</span>`;

const loansTable = () => `<section class="data-table-wrap"><table class="data-table"><thead><tr><th>Loan ID</th><th>Amount</th><th>Status</th><th>Date Applied</th><th>Action</th></tr></thead><tbody>
        <tr><td>EZL-2026-018</td><td>&#8369;25,000</td><td>${status("approved", "Approved")}</td><td>May 18, 2026</td><td><a class="btn-secondary" href="loan-details.html">View</a></td></tr>
        <tr><td>EZL-2026-014</td><td>&#8369;13,500</td><td>${status("pending", "Pending")}</td><td>May 20, 2026</td><td><a class="btn-secondary" href="loan-status.html">Track</a></td></tr>
        <tr><td>EZL-2026-009</td><td>&#8369;8,000</td><td>${status("rejected", "Rejected")}</td><td>Apr 28, 2026</td><td><a class="btn-secondary" href="loan-details.html">Open</a></td></tr>
      </tbody></table></section>`;

const paymentTable = () => `<section class="data-table-wrap"><table class="data-table"><thead><tr><th>Loan ID</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
        <tr><td>EZL-2026-018</td><td>Jun 15, 2026</td><td>&#8369;4,250</td><td>${status("unpaid", "Unpaid")}</td><td><a class="btn-secondary" href="upload-payment.html">Upload</a></td></tr>
        <tr><td>EZL-2026-018</td><td>May 15, 2026</td><td>&#8369;4,250</td><td>${status("paid", "Paid")}</td><td><a class="btn-secondary" href="receipts.html">Receipt</a></td></tr>
        <tr><td>EZL-2026-011</td><td>Apr 15, 2026</td><td>&#8369;3,100</td><td>${status("paid", "Paid")}</td><td><a class="btn-secondary" href="receipts.html">Receipt</a></td></tr>
      </tbody></table></section>`;

const paymentsDashboard = () => `<section class="loan-status-hero panel">
        <div class="loan-status-hero-copy">
          <div class="loan-status-chip"><span class="material-symbols-outlined">payments</span><span>Active Loan</span></div>
          <h2>Loan ID: #LN-2026-00123</h2>
          <p>View your payment history and pay your loan balance. Keep your account current by confirming payments before the due date.</p>
          <div class="loan-status-meta">
            <div><span>Total Loan Amount</span><strong>&#8369;10,000</strong></div>
            <div><span>Interest Rate</span><strong>5% / month</strong></div>
            <div><span>Term</span><strong>6 months</strong></div>
            <div><span>Status</span><strong>Active</strong></div>
          </div>
        </div>
        <div class="loan-status-scorecard">
          <div class="profile-list"><div class="profile-row"><span>Monthly Due</span><strong>&#8369;1,800</strong></div><div class="profile-row"><span>Remaining Balance</span><strong>&#8369;7,200</strong></div><div class="profile-row"><span>Next Due</span><strong>July 1, 2026</strong></div></div>
        </div>
      </section>

      <div class="content-grid two">
        <section class="panel">
          <h2>Make a Payment</h2>
          <form class="form-grid" data-demo-form>
            <label class="field"><span>Select Loan</span><select required><option>#LN-2026-00123 - Personal Loan</option><option>#LN-2026-00111 - Emergency Loan</option></select></label>
            <label class="field"><span>Payment Amount</span><input type="number" value="1800" required></label>
            <label class="field"><span>Payment Method</span><select required><option>GCash</option><option>Bank Transfer</option><option>Cash (Admin Confirm)</option></select></label>
            <label class="field"><span>Reference Number</span><input type="text" value="REF12345" required></label>
            <label class="field"><span>Upload Receipt</span><input type="file" accept=".pdf,.jpg,.jpeg,.png"></label>
            <div class="form-actions"><button class="btn btn-primary" type="submit">Pay Now</button><p class="muted" data-form-message></p></div>
          </form>
        </section>
        <section class="panel">
          <h2>Balance Overview</h2>
          <div class="profile-list"><div class="profile-row"><span>Total Paid</span><strong>&#8369;2,400</strong></div><div class="profile-row"><span>Remaining Balance</span><strong>&#8369;7,200</strong></div><div class="profile-row"><span>Next Due Date</span><strong>July 1, 2026</strong></div><div class="profile-row"><span>Overdue Fees</span><strong>&#8369;0</strong></div></div>
        </section>
      </div>

      <section class="panel">
        <div class="page-head"><div><p class="page-kicker">Installment plan</p><h2>Payment Schedule</h2><p>Track upcoming installments and payment status.</p></div><a class="btn btn-small" href="upload-payment.html">Upload Payment</a></div>
        <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
          <tr><td>June 1, 2026</td><td>&#8369;1,800</td><td>${status("paid", "Paid")}</td><td><a class="btn-secondary" href="receipts.html">View</a></td></tr>
          <tr><td>July 1, 2026</td><td>&#8369;1,800</td><td>${status("pending", "Pending")}</td><td><a class="btn-secondary" href="upload-payment.html">Pay</a></td></tr>
          <tr><td>Aug 1, 2026</td><td>&#8369;1,800</td><td>${status("pending", "Pending")}</td><td><a class="btn-secondary" href="upload-payment.html">Pay</a></td></tr>
        </tbody></table></div>
      </section>

      <section class="panel">
        <div class="page-head"><div><p class="page-kicker">Transactions</p><h2>Payment History</h2><p>Full history of submitted and verified payments.</p></div><a class="btn btn-small" href="payment-history.html">View All</a></div>
        <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Date Paid</th><th>Amount Paid</th><th>Method Used</th><th>Reference Number</th><th>Status</th></tr></thead><tbody>
          <tr><td>May 1, 2026</td><td>&#8369;1,800</td><td>GCash</td><td>REF12345</td><td>${status("paid", "Verified")}</td></tr>
          <tr><td>Apr 1, 2026</td><td>&#8369;600</td><td>Bank Transfer</td><td>BNK44291</td><td>${status("paid", "Verified")}</td></tr>
          <tr><td>Mar 28, 2026</td><td>&#8369;1,800</td><td>GCash</td><td>REF11120</td><td>${status("pending", "Pending Confirmation")}</td></tr>
        </tbody></table></div>
      </section>

      <div class="content-grid two">
        <section class="panel"><h2>Payment Status Indicators</h2><div class="profile-list"><div class="profile-row"><span>Paid</span><strong>${status("paid", "Paid")}</strong></div><div class="profile-row"><span>Pending Confirmation</span><strong>${status("pending", "Pending")}</strong></div><div class="profile-row"><span>Overdue</span><strong>${status("rejected", "Overdue")}</strong></div><div class="profile-row"><span>Failed Transaction</span><strong><span class="status rejected">Failed</span></strong></div></div></section>
        <section class="panel"><h2>Notifications</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">paid</span></div><div><strong>Your payment of &#8369;1,800 was received</strong><p>GCash reference REF12345 has been verified.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">event_upcoming</span></div><div><strong>Upcoming due date in 3 days</strong><p>Your next payment is due on July 1, 2026.</p></div></article></div></section>
      </div>

      <section class="panel"><h2>Actions</h2><div class="quick-actions"><a class="action-tile" href="upload-payment.html"><span class="material-symbols-outlined">payments</span>Pay Now</a><a class="action-tile" href="receipts.html"><span class="material-symbols-outlined">download</span>Download Receipt</a><a class="action-tile" href="payment-history.html"><span class="material-symbols-outlined">article</span>View Statement</a><a class="action-tile" href="../support/ticket.html"><span class="material-symbols-outlined">support_agent</span>Contact Support</a></div></section>`;

const form = (title, fields, button = "Submit") => `<section class="panel"><h2>${title}</h2><form class="form-grid" data-demo-form>
        ${fields.map(([label, type, value]) => `<label class="field"><span>${label}</span><input type="${type}" value="${value}"></label>`).join("\n        ")}
        <div class="form-actions"><button class="btn btn-primary" type="submit">${button}</button><a class="btn-secondary" href="../dashboard.html">Cancel</a></div><p class="muted" data-form-message></p>
      </form></section>`;

const loanApplicationForm = () => `<section class="panel">
          <div class="application-progress" aria-label="Application progress">
            <span>Step 1 - Borrower Details</span>
            <span>Step 2 - Loan Review</span>
            <span>Step 3 - Submit</span>
          </div>
          <form class="loan-application-form" data-demo-form>
            <section class="form-section">
              <h2>Personal Information</h2>
              <div class="form-grid two">
                <label class="field"><span>Full Name</span><input type="text" value="Lance Navarro" required></label>
                <label class="field"><span>Email Address</span><input type="email" value="lance@example.com" required></label>
                <label class="field"><span>Phone Number</span><input type="tel" value="+63 912 345 6789" required></label>
                <label class="field"><span>Date of Birth</span><input type="date" value="1998-04-12" required></label>
                <label class="field"><span>Gender</span><select required><option>Male</option><option>Female</option><option>Prefer not to say</option></select></label>
                <label class="field"><span>Civil Status</span><select required><option>Single</option><option>Married</option><option>Separated</option><option>Widowed</option></select></label>
                <label class="field"><span>Street</span><input type="text" value="123 Mabini Street" required></label>
                <label class="field"><span>Barangay</span><input type="text" value="Barangay 48" required></label>
                <label class="field"><span>City</span><input type="text" value="Manila" required></label>
                <label class="field"><span>Province</span><input type="text" value="Metro Manila" required></label>
                <label class="field full-span"><span>Valid ID Upload</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" required></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Employment / Income Details</h2>
              <div class="form-grid two">
                <label class="field"><span>Employment Status</span><select required><option>Employed</option><option>Self-employed</option><option>Unemployed</option></select></label>
                <label class="field"><span>Employer Name / Business Name</span><input type="text" value="Navarro Trading" required></label>
                <label class="field"><span>Job Position</span><input type="text" value="Operations Manager" required></label>
                <label class="field"><span>Monthly Income</span><input type="number" value="45000" required></label>
                <label class="field"><span>Work Address</span><input type="text" value="Makati City" required></label>
                <label class="field"><span>Years of Employment</span><input type="number" value="4" min="0" required></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Loan Details</h2>
              <div class="form-grid two">
                <label class="field"><span>Loan Amount Requested</span><input type="number" value="25000" required></label>
                <label class="field"><span>Loan Purpose</span><select required><option>Business</option><option>Education</option><option>Personal</option><option>Emergency</option><option>Housing</option></select></label>
                <label class="field"><span>Loan Term</span><select required><option>3 months</option><option selected>6 months</option><option>12 months</option></select></label>
                <label class="field"><span>Preferred Payment Schedule</span><select required><option>Weekly</option><option>Bi-weekly</option><option selected>Monthly</option></select></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Financial Information</h2>
              <div class="form-grid two">
                <label class="field"><span>Existing Loans?</span><select required><option>No</option><option>Yes</option></select></label>
                <label class="field"><span>Monthly Expenses</span><input type="number" value="18000" required></label>
                <label class="field"><span>Bank Account Number</span><input type="text" value="1234-5678-9012" required></label>
                <label class="field"><span>Bank Name</span><input type="text" value="BDO" required></label>
                <label class="field full-span"><span>Credit Score</span><input type="number" placeholder="Optional / admin review"></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Emergency Contact</h2>
              <div class="form-grid two">
                <label class="field"><span>Full Name</span><input type="text" value="Maria Navarro" required></label>
                <label class="field"><span>Relationship</span><input type="text" value="Mother" required></label>
                <label class="field"><span>Phone Number</span><input type="tel" value="+63 917 222 3344" required></label>
                <label class="field"><span>Address</span><input type="text" value="Manila, Philippines" required></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Required Documents</h2>
              <div class="form-grid two">
                <label class="field"><span>Government ID</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" required></label>
                <label class="field"><span>Proof of Income</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" required></label>
                <label class="field full-span"><span>Selfie with ID</span><input type="file" accept=".jpg,.jpeg,.png"></label>
              </div>
            </section>

            <section class="form-section">
              <h2>Monthly Payment Preview</h2>
              <div class="payment-preview">
                <article><span>Requested</span><strong>&#8369;25,000</strong></article>
                <article><span>Estimated Term</span><strong>6 months</strong></article>
                <article><span>Estimated Monthly</span><strong>&#8369;4,250</strong></article>
              </div>
            </section>

            <section class="form-section">
              <h2>Agreement</h2>
              <div class="agreement-list">
                <label><input type="checkbox" required><span>I certify that all information is true.</span></label>
                <label><input type="checkbox" required><span>I agree to the terms and conditions.</span></label>
                <label><input type="checkbox" required><span>I authorize credit checking.</span></label>
              </div>
              <div class="submit-section">
                <button class="btn btn-primary" type="submit">Submit Application</button>
                <button class="btn-secondary" type="button">Save as Draft</button>
                <button class="btn-secondary" type="reset">Reset Form</button>
                <p class="muted" data-form-message></p>
              </div>
            </section>
          </form>
        </section>`;

const noticeList = () => `<div class="notice-list">
        <article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">verified</span></div><div><strong>Profile verified</strong><p>Your identity details match the latest application record.</p></div></article>
        <article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">event_upcoming</span></div><div><strong>Payment due soon</strong><p>Your next payment of &#8369;4,250 is due on Jun 15, 2026.</p></div></article>
      </div>`;

const content = (type) => {
  if (type === "documents") return `<section class="loan-status-hero panel">
        <div class="loan-status-hero-copy">
          <div class="loan-status-chip"><span class="material-symbols-outlined">description</span><span>Under Review</span></div>
          <h2>My Documents</h2>
          <p>Upload and manage your loan verification requirements. Keep every file clear, readable, and updated to avoid approval delays.</p>
          <div class="loan-status-meta">
            <div><span>Valid ID</span><strong>Approved</strong></div>
            <div><span>Proof of Income</span><strong>Pending</strong></div>
            <div><span>Selfie with ID</span><strong>Rejected</strong></div>
            <div><span>Completion</span><strong>2 / 3</strong></div>
          </div>
        </div>
        <div class="loan-status-scorecard">
          <div class="loan-status-ring" aria-hidden="true"><div class="loan-status-ring-center"><strong>67%</strong><span>Verified</span></div></div>
          <div class="loan-status-score-copy"><strong>Incomplete Documents</strong><p>One rejected document needs to be reuploaded before final verification.</p></div>
        </div>
      </section>

      <div class="content-grid two">
        <section class="panel"><h2>Required Documents Overview</h2><div class="profile-list"><div class="profile-row"><span>Valid ID (Government Issued)</span><strong>${status("approved", "Approved")}</strong></div><div class="profile-row"><span>Proof of Income</span><strong>${status("pending", "Pending")}</strong></div><div class="profile-row"><span>Selfie with ID</span><strong><span class="status rejected">Rejected</span></strong></div><div class="profile-row"><span>Address Proof</span><strong>${status("approved", "Approved")}</strong></div><div class="profile-row"><span>Missing / Rejected</span><strong><span class="status rejected">1 file</span></strong></div></div></section>
        <section class="panel"><h2>Upload Document</h2><form class="form-grid" data-demo-form><label class="field"><span>Select Document Type</span><select required><option>Valid ID</option><option>Proof of Income</option><option>Selfie with ID</option><option>Utility Bill</option></select></label><label class="field"><span>Upload File</span><input type="file" accept=".jpg,.jpeg,.png,.pdf" required></label><label class="field"><span>Description</span><textarea placeholder="Optional notes for the verifier."></textarea></label><div class="form-actions"><button class="btn btn-primary" type="submit">Upload Document</button><p class="muted" data-form-message></p></div></form></section>
      </div>

      <section class="panel">
        <div class="page-head"><div><p class="page-kicker">Uploaded files</p><h2>Document Status List</h2><p>Review every file uploaded for your loan verification.</p></div><a class="btn btn-small" href="erification-status.html">Verification Status</a></div>
        <div class="data-table-wrap"><table class="data-table"><thead><tr><th>Document Type</th><th>File Name</th><th>Status</th><th>Date Uploaded</th><th>Action</th></tr></thead><tbody>
          <tr><td>Valid ID</td><td>id.jpg</td><td>${status("approved", "Approved")}</td><td>May 20, 2026</td><td><button class="btn-secondary" type="button">View</button></td></tr>
          <tr><td>Income Proof</td><td>payslip.pdf</td><td>${status("pending", "Pending")}</td><td>May 22, 2026</td><td><button class="btn-secondary" type="button">Edit</button></td></tr>
          <tr><td>Selfie ID</td><td>selfie.png</td><td><span class="status rejected">Rejected</span></td><td>May 22, 2026</td><td><button class="btn-secondary" type="button">Reupload</button></td></tr>
        </tbody></table></div>
      </section>

      <div class="content-grid two">
        <section class="panel"><h2>Verification Status</h2><div class="profile-list"><div class="profile-row"><span>Status</span><strong>${status("pending", "Under Review")}</strong></div><div class="profile-row"><span>Completion</span><strong>2/3 Documents Verified</strong></div><div class="profile-row"><span>Overall Result</span><strong>Waiting for selfie verification</strong></div></div></section>
        <section class="panel"><h2>Admin Feedback</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">info</span></div><div><strong>Please upload clearer image of your ID</strong><p>The file is readable, but the selfie verification image is blurry.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">schedule</span></div><div><strong>Waiting for selfie verification</strong><p>Upload a clearer selfie with your valid ID to continue.</p></div></article></div></section>
      </div>

      <div class="content-grid two">
        <section class="panel"><h2>File Preview</h2><div class="documents-file-note">Preview selected document</div><div class="payment-preview"><article><span>File</span><strong>id.jpg</strong></article><article><span>Type</span><strong>Valid ID</strong></article><article><span>Status</span><strong>Approved</strong></article></div><div class="form-actions"><button class="btn-secondary" type="button">Download</button><button class="btn-secondary" type="button">Replace File</button><button class="btn-secondary" type="button">Delete File</button></div></section>
        <section class="panel"><h2>Upload Guidelines</h2><div class="profile-list"><div class="profile-row"><span>Clarity</span><strong>File must be clear and readable</strong></div><div class="profile-row"><span>Max Size</span><strong>5MB</strong></div><div class="profile-row"><span>Allowed Formats</span><strong>JPG, PNG, PDF</strong></div><div class="profile-row"><span>Restriction</span><strong>No edited or blurred IDs</strong></div></div></section>
      </div>

      <section class="panel"><h2>Actions</h2><div class="quick-actions"><a class="action-tile" href="#upload"><span class="material-symbols-outlined">upload_file</span>Upload New Document</a><a class="action-tile" href="#replace"><span class="material-symbols-outlined">change_circle</span>Replace Document</a><a class="action-tile" href="#delete"><span class="material-symbols-outlined">delete</span>Delete Document</a><a class="action-tile" href="erification-status.html"><span class="material-symbols-outlined">verified</span>Submit for Verification</a></div></section>`;
  if (type === "verification") return `<div class="content-grid two"><section class="panel"><h2>Verification Progress</h2><div class="profile-list"><div class="profile-row"><span>Identity</span><strong>${status("approved", "Verified")}</strong></div><div class="profile-row"><span>Income</span><strong>${status("pending", "Reviewing")}</strong></div><div class="profile-row"><span>Contact</span><strong>${status("approved", "Verified")}</strong></div></div></section><section class="panel"><h2>Next Step</h2>${noticeList()}</section></div>`;
  if (type === "loan-form") return loanApplicationForm();
  if (type === "loan-history" || type === "loans") return loansTable();
  if (type === "loan-details") return `<div class="content-grid two"><section class="panel"><h2>Loan Summary</h2><div class="profile-list"><div class="profile-row"><span>Loan ID</span><strong>EZL-2026-018</strong></div><div class="profile-row"><span>Amount</span><strong>&#8369;25,000</strong></div><div class="profile-row"><span>Status</span><strong>${status("approved", "Approved")}</strong></div><div class="profile-row"><span>Monthly Payment</span><strong>&#8369;4,250</strong></div></div></section><section class="panel"><h2>Actions</h2><div class="quick-actions"><a class="action-tile" href="../payments/upload-payment.html"><span class="material-symbols-outlined">upload_file</span>Upload payment proof</a><a class="action-tile" href="loan-status.html"><span class="material-symbols-outlined">monitoring</span>Track status</a></div></section></div>`;
  if (type === "loan-status") return `<section class="loan-status-hero panel">
        <div class="loan-status-hero-copy">
          <div class="loan-status-chip"><span class="material-symbols-outlined">hourglass_top</span><span>Pending Review</span></div>
          <h2>Application ID: #LN-2026-00123</h2>
          <p>Track your loan application progress in real time. Your documents are currently being reviewed by the Easy Loan verification team.</p>
          <div class="loan-status-meta">
            <div><span>Loan Amount</span><strong>&#8369;10,000</strong></div>
            <div><span>Date Applied</span><strong>May 20, 2026</strong></div>
            <div><span>Current Status</span><strong>Pending Review</strong></div>
            <div><span>Reference</span><strong>APP-203</strong></div>
          </div>
        </div>
        <div class="loan-status-scorecard">
          <div class="loan-status-ring" aria-hidden="true"><div class="loan-status-ring-center"><strong>40%</strong><span>Complete</span></div></div>
          <div class="loan-status-score-copy"><strong>Processing / Under Verification</strong><p>Two of five application stages are complete.</p></div>
        </div>
      </section>

      <section class="panel loan-status-panel">
        <div class="panel-title-row loan-status-panel-head"><h2>Progress Tracker</h2><span class="status pending">Pending Review</span></div>
        <div class="loan-stage-list">
          <article class="loan-stage-item is-done"><div class="loan-stage-marker"><span class="material-symbols-outlined">check</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>Application Submitted</strong><span class="status success">Completed</span></div><p>Your online loan application was received successfully.</p><small>May 20, 2026 at 09:14 AM</small></div></article>
          <article class="loan-stage-item is-current"><div class="loan-stage-marker"><span class="material-symbols-outlined">hourglass_top</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>Under Review</strong><span class="status pending">In Progress</span></div><p>Your documents are under review by the admin team.</p><small>Started May 24, 2026</small></div></article>
          <article class="loan-stage-item"><div class="loan-stage-marker"><span class="material-symbols-outlined">manage_search</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>Credit Checking</strong><span class="status unpaid">Waiting</span></div><p>Credit checking starts once document review is complete.</p><small>Pending</small></div></article>
          <article class="loan-stage-item"><div class="loan-stage-marker"><span class="material-symbols-outlined">rule</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>Approval Decision</strong><span class="status unpaid">Waiting</span></div><p>The admin will approve or reject after review.</p><small>Pending</small></div></article>
          <article class="loan-stage-item"><div class="loan-stage-marker"><span class="material-symbols-outlined">payments</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>Funds Release</strong><span class="status unpaid">Waiting</span></div><p>Funds will be released after approval and final confirmation.</p><small>Pending</small></div></article>
        </div>
      </section>

      <div class="content-grid two">
        <section class="panel"><h2>Loan Details Summary</h2><div class="profile-list"><div class="profile-row"><span>Loan Type</span><strong>Personal</strong></div><div class="profile-row"><span>Loan Amount Requested</span><strong>&#8369;10,000</strong></div><div class="profile-row"><span>Loan Term</span><strong>6 months</strong></div><div class="profile-row"><span>Monthly Payment Estimate</span><strong>&#8369;1,780</strong></div><div class="profile-row"><span>Interest Rate</span><strong>4.5% APR</strong></div><div class="profile-row"><span>Payment Schedule</span><strong>Monthly</strong></div></div></section>
        <section class="panel"><h2>Admin Remarks</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">info</span></div><div><strong>Your documents are under review</strong><p>Please wait while the admin validates your submitted ID and income files.</p></div></article><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">upload_file</span></div><div><strong>Possible follow-up</strong><p>If the valid ID is unclear, you may be asked to upload it again.</p></div></article></div></section>
      </div>

      <div class="content-grid two">
        <section class="panel"><h2>Document Status</h2><div class="profile-list"><div class="profile-row"><span>Valid ID</span><strong><span class="status success">Approved</span></strong></div><div class="profile-row"><span>Proof of Income</span><strong><span class="status pending">Pending</span></strong></div><div class="profile-row"><span>Selfie Verification</span><strong><span class="status success">Approved</span></strong></div></div></section>
        <section class="panel"><h2>Payment Status</h2><div class="profile-list"><div class="profile-row"><span>Total Loan Amount</span><strong>&#8369;10,000</strong></div><div class="profile-row"><span>Paid Amount</span><strong>&#8369;0</strong></div><div class="profile-row"><span>Remaining Balance</span><strong>&#8369;10,000</strong></div><div class="profile-row"><span>Next Due Date</span><strong>After release</strong></div><div class="profile-row"><span>Overdue Status</span><strong><span class="status success">None</span></strong></div></div></section>
      </div>

      <section class="panel"><h2>Actions</h2><div class="quick-actions"><a class="action-tile" href="loan-form.html"><span class="material-symbols-outlined">edit_document</span>Edit Application</a><a class="action-tile" href="loans.html"><span class="material-symbols-outlined">cancel</span>Cancel Application</a><a class="action-tile" href="../support/ticket.html"><span class="material-symbols-outlined">support_agent</span>Contact Admin</a><a class="action-tile" href="../support/live-chat.html"><span class="material-symbols-outlined">forum</span>Chat Support</a><a class="action-tile" href="../support/faq.html"><span class="material-symbols-outlined">quiz</span>FAQ Help</a></div></section>`;
  if (type === "payments") return paymentsDashboard();
  if (type === "payment-history") return paymentTable();
  if (type === "receipts") return `<section class="panel"><h2>Receipts</h2>${paymentTable()}</section>`;
  if (type === "upload-payment") return form("Upload Payment Proof", [["Loan ID","text","EZL-2026-018"],["Payment Reference","text","GCASH-20260524-001"],["Amount Paid","number","4250"],["Payment Date","date","2026-05-24"]], "Submit Proof");
  if (type === "profile") return `<div class="content-grid two"><section class="panel"><h2>Personal Details</h2><div class="profile-list"><div class="profile-row"><span>Name</span><strong>Lance Navarro</strong></div><div class="profile-row"><span>Email</span><strong>lance@example.com</strong></div><div class="profile-row"><span>Contact Number</span><strong>+63 912 345 6789</strong></div><div class="profile-row"><span>Address</span><strong>Manila, Philippines</strong></div></div></section><section class="panel"><h2>Profile Actions</h2><div class="quick-actions"><a class="action-tile" href="edit-profile.html"><span class="material-symbols-outlined">edit</span>Edit profile</a><a class="action-tile" href="change-password.html"><span class="material-symbols-outlined">lock_reset</span>Change password</a></div></section></div>`;
  if (type === "edit-profile") return form("Edit Profile", [["Full Name","text","Lance Navarro"],["Email","email","lance@example.com"],["Contact Number","text","+63 912 345 6789"],["Address","text","Manila, Philippines"]], "Save Profile");
  if (type === "change-password") return form("Change Password", [["Current Password","password",""],["New Password","password",""],["Confirm Password","password",""]], "Update Password");
  if (type === "security") return `<section class="panel"><h2>Account Security</h2><div class="toggle-row"><div><strong>Email login alerts</strong><p class="muted">Notify me when my account signs in on a new device.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div><div class="toggle-row"><div><strong>SMS reminders</strong><p class="muted">Send payment and account reminders by SMS.</p></div><label class="toggle"><input type="checkbox" checked><span></span></label></div></section>`;
  if (type === "faq") return `<section class="panel"><h2>Frequently Asked Questions</h2><div class="profile-list"><div class="profile-row"><span>How long is approval?</span><strong>Most applications are reviewed within 24 hours.</strong></div><div class="profile-row"><span>Where do I upload documents?</span><strong>Use Documents in your account dashboard.</strong></div><div class="profile-row"><span>How do I confirm payment?</span><strong>Upload payment proof from the Payments section.</strong></div></div></section>`;
  if (type === "chat") return `<div class="content-grid two"><section class="panel"><h2>Live Chat</h2><div class="notice-list"><article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">support_agent</span></div><div><strong>Support Agent</strong><p>Hello Lance, how can we help with your Easy Loan account?</p></div></article><article class="notice-card"><div class="icon-badge green"><span class="material-symbols-outlined">person</span></div><div><strong>You</strong><p>I need help confirming my latest payment.</p></div></article></div></section>${form("Send Message", [["Message","text","Please check my payment reference."]], "Send")}</div>`;
  if (type === "ticket") return form("Create Support Ticket", [["Subject","text","Payment confirmation"],["Loan ID","text","EZL-2026-018"],["Priority","text","Normal"],["Message","text","Please review my payment upload."]], "Submit Ticket");
  return `<div class="content-grid two"><section class="panel"><h2>Support Options</h2><div class="quick-actions"><a class="action-tile" href="faq.html"><span class="material-symbols-outlined">quiz</span>Read FAQ</a><a class="action-tile" href="live-chat.html"><span class="material-symbols-outlined">forum</span>Live chat</a><a class="action-tile" href="ticket.html"><span class="material-symbols-outlined">confirmation_number</span>Create ticket</a></div></section><section class="panel"><h2>Recent Updates</h2>${noticeList()}</section></div>`;
};

const authPage = (page, type) => {
  if (type === "logout") {
    return `${head(page[0])}
<body class="login-page">
  <main class="login-page-wrap">
    <section class="login-panel">
      <div class="login-brand-lockup"><a class="brand login-brand" href="../../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a><p>User Access</p></div>
      <h2>${page[0]}</h2>
      <p class="login-copy">${page[2]}</p>
      <div class="form-actions"><a class="btn btn-primary btn-block" href="login.html">Sign In Again</a><a class="btn-secondary btn-block" href="../../landing.html">Back to Home</a></div>
    </section>
  </main>
  <script src="../../static/script.js"></script>
</body>
</html>`;
  }

  const fields = {
    login: [["Gmail Address", "email", "lance@example.com"], ["Password", "password", ""]],
    register: [["Full Name", "text", "Lance Navarro"], ["Gmail Address", "email", "lance@example.com"], ["Contact Number", "text", "+63 912 345 6789"], ["Password", "password", ""]],
    forgot: [["Gmail Address", "email", "lance@example.com"], ["Contact Number", "text", "+63 912 345 6789"]],
    reset: [["New Password", "password", ""], ["Confirm Password", "password", ""]],
    otp: [["One-Time Code", "text", "123456"]],
  }[type];

  const action = { login: "Login", register: "Create Account", forgot: "Send Reset Code", reset: "Reset Password", otp: "Verify Code" }[type];
  const formAttrs = type === "login" ? 'data-login-form data-redirect="../dashboard.html"' : type === "register" ? 'data-register-form data-redirect="../dashboard.html"' : "data-demo-form";

  return `${head(page[0])}
<body class="login-page">
  <main class="login-page-wrap">
    <section class="login-panel">
      <div class="login-brand-lockup"><a class="brand login-brand" href="../../landing.html"><span class="material-symbols-outlined brand-icon">account_balance</span><span>Easy Loan</span></a><p>User Access</p></div>
      <h2>${page[0]}</h2>
      <p class="login-copy">${page[2]}</p>
      <form class="form-grid login-form" ${formAttrs}>
        ${fields.map(([label, inputType, value]) => `<label class="field login-field"><span>${label}</span><span class="input-with-icon"><span class="material-symbols-outlined">${inputType === "password" ? "lock" : "mail"}</span><input type="${inputType}" value="${value}" required></span></label>`).join("\n        ")}
        <button class="btn btn-primary btn-block" type="submit">${action}</button>
        <p class="muted" data-form-message></p>
      </form>
      <p class="login-switch"><a href="${type === "login" ? "register.html" : "login.html"}">${type === "login" ? "Create account" : "Back to login"}</a></p>
    </section>
  </main>
  <script src="../../static/script.js"></script>
</body>
</html>`;
};

for (const [folder, folderPages] of Object.entries(pages)) {
  for (const [file, page] of Object.entries(folderPages)) {
    const target = path.join(userRoot, folder, file);
    const html = folder === "auth" ? authPage(page, page[3]) : shell(page, content(page[3]));
    fs.writeFileSync(target, html, "utf8");
  }
}

console.log("Nested user HTML pages generated.");
