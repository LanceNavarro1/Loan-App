const applyButtons = document.querySelectorAll("[data-apply-button]");
const bottomNavLinks = document.querySelectorAll(".bottom-nav a[href^='#']");
const sections = [...document.querySelectorAll("main section[id], main[id], footer[id]")];
const userNavLinks = document.querySelectorAll("[data-user-nav] a");
const demoForms = document.querySelectorAll("[data-demo-form]");
const loginModal = document.querySelector("[data-login-modal]");
const loginOpenButtons = document.querySelectorAll("[data-login-open]");
const loginCloseButtons = document.querySelectorAll("[data-login-close]");
const loginForms = document.querySelectorAll("[data-login-form]");
const registerForms = document.querySelectorAll("[data-register-form]");
const registerNameFields = document.querySelectorAll("[data-clear-register-name]");
const countryCodeSelects = document.querySelectorAll("[data-country-code]");
const userSessionKey = "easyLoan.currentUserEmail";
const userStoreKey = "easyLoan.users";
const userStoreApi = "/api/user-store/";
const staticAssetBase = new URL(".", document.currentScript?.src || window.location.href);
let userStoreSyncTimer = null;
const countryMeta = {
  ar: ["Argentina", "+54", "ar"],
  au: ["Australia", "+61", "au"],
  at: ["Austria", "+43", "at"],
  bd: ["Bangladesh", "+880", "bd"],
  be: ["Belgium", "+32", "be"],
  br: ["Brazil", "+55", "br"],
  ca: ["Canada", "+1", "ca"],
  cl: ["Chile", "+56", "cl"],
  cn: ["China", "+86", "cn"],
  co: ["Colombia", "+57", "co"],
  dk: ["Denmark", "+45", "dk"],
  eg: ["Egypt", "+20", "eg"],
  fi: ["Finland", "+358", "fi"],
  fr: ["France", "+33", "fr"],
  de: ["Germany", "+49", "de"],
  gr: ["Greece", "+30", "gr"],
  hk: ["Hong Kong", "+852", "hk"],
  in: ["India", "+91", "in"],
  id: ["Indonesia", "+62", "id"],
  ie: ["Ireland", "+353", "ie"],
  il: ["Israel", "+972", "il"],
  it: ["Italy", "+39", "it"],
  jp: ["Japan", "+81", "jp"],
  my: ["Malaysia", "+60", "my"],
  mx: ["Mexico", "+52", "mx"],
  nl: ["Netherlands", "+31", "nl"],
  nz: ["New Zealand", "+64", "nz"],
  ng: ["Nigeria", "+234", "ng"],
  no: ["Norway", "+47", "no"],
  pk: ["Pakistan", "+92", "pk"],
  ph: ["Philippines", "+63", "ph"],
  pl: ["Poland", "+48", "pl"],
  pt: ["Portugal", "+351", "pt"],
  sa: ["Saudi Arabia", "+966", "sa"],
  sg: ["Singapore", "+65", "sg"],
  za: ["South Africa", "+27", "za"],
  kr: ["South Korea", "+82", "kr"],
  es: ["Spain", "+34", "es"],
  se: ["Sweden", "+46", "se"],
  ch: ["Switzerland", "+41", "ch"],
  tw: ["Taiwan", "+886", "tw"],
  th: ["Thailand", "+66", "th"],
  tr: ["Turkey", "+90", "tr"],
  ae: ["United Arab Emirates", "+971", "ae"],
  uk: ["United Kingdom", "+44", "gb"],
  us: ["United States", "+1", "us"],
  vn: ["Vietnam", "+84", "vn"],
};

const readUserStore = () => {
  try {
    return JSON.parse(localStorage.getItem(userStoreKey)) || {};
  } catch (error) {
    return {};
  }
};

const installAppIcon = () => {
  const iconUrl = new URL("easy-loan-icon.svg", staticAssetBase).href;

  document.querySelectorAll("link[rel~='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']").forEach((link) => {
    link.remove();
  });

  const iconLink = document.createElement("link");
  iconLink.rel = "icon";
  iconLink.type = "image/svg+xml";
  iconLink.href = iconUrl;
  document.head.append(iconLink);

  const shortcutLink = document.createElement("link");
  shortcutLink.rel = "shortcut icon";
  shortcutLink.href = iconUrl;
  document.head.append(shortcutLink);
};

const writeUserStore = (store) => {
  localStorage.setItem(userStoreKey, JSON.stringify(store));
  queueUserStoreSync(store);
};

const queueUserStoreSync = (store = readUserStore()) => {
  window.clearTimeout(userStoreSyncTimer);
  userStoreSyncTimer = window.setTimeout(() => {
    fetch(userStoreApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: store }),
    }).catch(() => {});
  }, 150);
};

const loadUserStoreFromServer = () => {
  fetch(userStoreApi)
    .then((response) => (response.ok ? response.json() : null))
    .then((payload) => {
      if (!payload?.users) {
        return;
      }

      const mergedStore = {
        ...payload.users,
        ...readUserStore(),
      };
      localStorage.setItem(userStoreKey, JSON.stringify(mergedStore));
      syncRenderedData();
      queueUserStoreSync(mergedStore);
    })
    .catch(() => {});
};

const titleCase = (value) =>
  value
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(" ");

const getInputValue = (form, names) => {
  const fields = Array.isArray(names) ? names : [names];

  for (const name of fields) {
    const input = form.querySelector(`[name="${name}"]`);
    if (input?.value.trim()) {
      return input.value.trim();
    }
  }

  return "";
};

const nameFromEmail = (email) => {
  const localPart = email.split("@")[0] || "User";
  return titleCase(localPart);
};

const saveCurrentUser = (nextUser) => {
  const email = nextUser.email?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const store = readUserStore();
  const previousUser = store[email] || {};
  const mergedUser = {
    ...previousUser,
    ...Object.fromEntries(Object.entries(nextUser).filter(([, value]) => String(value || "").trim())),
    email,
  };

  mergedUser.name = mergedUser.name || nameFromEmail(email);
  store[email] = mergedUser;
  writeUserStore(store);
  localStorage.setItem(userSessionKey, email);
  return mergedUser;
};

const getCurrentUser = () => {
  const email = localStorage.getItem(userSessionKey);
  const store = readUserStore();

  if (email && store[email]) {
    return store[email];
  }

  return null;
};

const saveCurrentUserProfile = (profileFields = {}) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const store = readUserStore();
  const currentEmail = currentUser.email;
  const nextEmail = String(profileFields.email || currentEmail).trim().toLowerCase();
  const nextUser = {
    ...currentUser,
    ...Object.fromEntries(Object.entries(profileFields).filter(([, value]) => String(value ?? "").trim())),
    email: nextEmail,
  };

  nextUser.name = nextUser.name || nameFromEmail(nextEmail);
  delete store[currentEmail];
  store[nextEmail] = nextUser;
  writeUserStore(store);
  localStorage.setItem(userSessionKey, nextEmail);
  return nextUser;
};

const getShortName = (name) => {
  const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0)}.` : parts[0] || "User";
};

const userFieldValue = (user, field) => {
  if (!user) {
    return "";
  }

  if (field === "shortName") {
    return getShortName(user.name);
  }

  if (field === "address") {
    return user.address || [user.street, user.barangay, user.city, user.province].filter(Boolean).join(", ");
  }

  return user[field] || "";
};

const populateUserInput = (input, user) => {
  const field = input.dataset.userInput;
  const value = userFieldValue(user, field);

  if (value && !input.value) {
    input.value = value;
  }
};

const hydrateUserData = (root = document) => {
  const user = getCurrentUser();

  root.querySelectorAll("[data-user-field]").forEach((element) => {
    const value = userFieldValue(user, element.dataset.userField);
    element.textContent = value || element.dataset.userEmpty || element.textContent;
  });

  root.querySelectorAll("[data-user-greeting]").forEach((element) => {
    const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
    element.textContent = `Good Morning, ${firstName}`;
  });

  root.querySelectorAll("[data-user-input]").forEach((input) => {
    populateUserInput(input, user);
  });
};

const applyUserSnapshotToDom = (user, root = document) => {
  if (!user) {
    return;
  }

  root.querySelectorAll("[data-user-field]").forEach((element) => {
    const value = userFieldValue(user, element.dataset.userField);
    element.textContent = value || element.dataset.userEmpty || element.textContent;
  });

  root.querySelectorAll("[data-user-greeting]").forEach((element) => {
    const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
    element.textContent = `Good Morning, ${firstName}`;
  });
};

const saveUserInputsFromForm = (form) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const nextUser = {};

  form.querySelectorAll("[data-user-input]").forEach((input) => {
    const field = input.dataset.userInput;
    const value = input.value.trim();

    if (field && value) {
      nextUser[field] = value;
    }
  });

  saveCurrentUserProfile(nextUser);
};

const liveUpdateUserField = (input) => {
  const field = input.dataset.userInput || input.dataset.userModalInput;
  const value = input.value.trim();

  if (!field) {
    return;
  }

  document.querySelectorAll(`[data-user-field="${field}"]`).forEach((element) => {
    element.textContent = value || element.dataset.userEmpty || element.textContent;
  });

  if (field === "name") {
    document.querySelectorAll('[data-user-field="shortName"]').forEach((element) => {
      element.textContent = getShortName(value);
    });
    document.querySelectorAll("[data-user-greeting]").forEach((element) => {
      const firstName = value.trim().split(/\s+/)[0] || "there";
      element.textContent = `Good Morning, ${firstName}`;
    });
  }
};

const fieldLabelFor = (input) => input.closest("label")?.querySelector("span")?.textContent.trim() || input.name || "";

const collectFormPayload = (form) => {
  const payload = {};

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    const key = input.name || input.dataset.userInput || fieldLabelFor(input);

    if (!key || input.type === "password" || input.type === "checkbox") {
      return;
    }

    if (input.type === "file") {
      payload[key] = [...input.files].map((file) => file.name);
      return;
    }

    payload[key] = input.value.trim();
  });

  return payload;
};

const collectUploadedDocuments = (form) => {
  const documents = [];

  form.querySelectorAll('input[type="file"]').forEach((input) => {
    const label = fieldLabelFor(input) || "Uploaded Document";
    const files = [...input.files];

    if (!files.length) {
      documents.push({ type: label, fileName: "Not uploaded", status: "Missing" });
      return;
    }

    files.forEach((file) => {
      documents.push({ type: label, fileName: file.name, status: "For Review" });
    });
  });

  return documents;
};

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatPeso = (value) => {
  const amount = Number(value || 0);
  const formattedAmount = new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

  return `\u20b1${formattedAmount}`;
};

const userStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("approved")) {
    return "approved";
  }

  if (normalized.includes("reject")) {
    return "rejected";
  }

  return "pending";
};

const getUserApplications = () => getCurrentUser()?.applications || [];
const getUserPayments = () => getCurrentUser()?.payments || [];
const getUserDocuments = () => getCurrentUser()?.documents || [];

const saveLoanApplication = (form) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const amount = getInputValue(form, "loanAmount");
  const timestamp = Date.now();
  const formData = collectFormPayload(form);
  const application = {
    id: `APP-${String(timestamp).slice(-6)}`,
    amount,
    purpose: getInputValue(form, "loanPurpose") || "Personal",
    term: getInputValue(form, "loanTerm") || "Not selected",
    schedule: getInputValue(form, "paymentSchedule") || "Not selected",
    status: "Pending",
    formData,
    documents: collectUploadedDocuments(form),
    submittedAt: new Date(timestamp).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };

  saveCurrentUser({
    email: currentUser.email,
    applications: [application, ...getUserApplications()],
  });
};

const savePaymentRecord = (form) => {
  const user = getCurrentUser();

  if (!user) {
    return;
  }

  const data = collectFormPayload(form);
  const timestamp = Date.now();
  const payment = {
    id: `PAY-${String(timestamp).slice(-6)}`,
    loanId: data["Select Loan"] || data.loanId || getUserApplications()[0]?.id || "No loan selected",
    amount: data["Payment Amount"] || data.paymentAmount || "",
    method: data["Payment Method"] || data.paymentMethod || "Not selected",
    reference: data["Reference Number"] || data["Payment Reference"] || data.reference || "",
    receipt: data["Upload Receipt"]?.[0] || "No receipt uploaded",
    status: "Pending Confirmation",
    submittedAt: new Date(timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  };

  saveCurrentUser({
    email: user.email,
    payments: [payment, ...getUserPayments()],
  });
};

const saveDocumentRecord = (form) => {
  const user = getCurrentUser();

  if (!user) {
    return;
  }

  const data = collectFormPayload(form);
  const files = data["Upload File"] || [];
  const document = {
    id: `DOC-${String(Date.now()).slice(-6)}`,
    type: data["Select Document Type"] || data["Document Type"] || data.documentType || "Uploaded Document",
    fileName: files[0] || "No file selected",
    description: data.Description || "",
    status: files.length ? "For Review" : "Missing",
    uploadedAt: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  };

  saveCurrentUser({
    email: user.email,
    documents: [document, ...getUserDocuments()],
  });
};

const isPaymentForm = (form) => [...form.querySelectorAll(".field span")].some((field) => /payment amount|payment method|reference number|payment reference/i.test(field.textContent));
const isDocumentForm = (form) => [...form.querySelectorAll(".field span")].some((field) => /select document type|upload file/i.test(field.textContent));

const renderUserLoans = (root = document) => {
  const applications = getUserApplications();
  const userPayments = getUserPayments();

  root.querySelectorAll("[data-user-loans-table]").forEach((tbody) => {
    if (!applications.length) {
      tbody.innerHTML = `<tr><td colspan="5">No loan applications yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = applications
      .map(
        (application) => `
          <tr>
            <td>${escapeHtml(application.id)}</td>
            <td>${formatPeso(application.amount)}</td>
            <td><span class="status ${userStatusClass(application.status)}">${escapeHtml(application.status)}</span></td>
            <td>${escapeHtml(application.submittedAt)}</td>
            <td><a class="btn-secondary" href="loan-status.html">Track</a></td>
          </tr>
        `
      )
      .join("");
  });

  root.querySelectorAll(".active-loan-list").forEach((list) => {
    if (!applications.length) {
      list.innerHTML = `<article class="active-loan-card"><span class="material-symbols-outlined icon-badge blue">info</span><div class="active-loan-main"><strong>No active loans yet</strong><span>Apply for a loan to see it here.</span></div></article>`;
      return;
    }

    list.innerHTML = applications
      .slice(0, 2)
      .map(
        (application) => {
          const linkedPayments = userPayments.filter((payment) => String(payment.loanId || "").includes(application.id));
          const progress = loanProgressFor(application.status, application.documents?.length || 0, linkedPayments.length);

          return `
          <article class="active-loan-card" style="--loan-progress:${progress}%">
            <span class="material-symbols-outlined icon-badge blue">request_quote</span>
            <div class="active-loan-main">
              <strong>${escapeHtml(application.purpose)} Loan</strong>
              <span>ID: ${escapeHtml(application.id)}</span>
              <p>${escapeHtml(application.status)} review</p>
              <div class="progress-track"><span style="width:${progress}%"></span></div>
            </div>
            <div class="active-loan-money"><strong>${formatPeso(application.amount)}</strong><span>${escapeHtml(application.term)}</span><small>${progress}% Complete</small></div>
          </article>
        `;
        }
      )
      .join("");
  });

  root.querySelectorAll('[data-dashboard-panel="loans"] .detail-grid.two').forEach((grid) => {
    if (!applications.length) {
      grid.innerHTML = `<article class="panel loan-detail-card"><div class="panel-title-row"><h2>No loans yet</h2><span class="status pending">Empty</span></div><p class="muted">Submitted applications for the current user will appear here.</p></article>`;
      return;
    }

    grid.innerHTML = applications
      .slice(0, 4)
      .map(
        (application) => {
          const linkedPayments = userPayments.filter((payment) => String(payment.loanId || "").includes(application.id));
          const progress = loanProgressFor(application.status, application.documents?.length || 0, linkedPayments.length);

          return `
          <article class="panel loan-detail-card" style="--loan-progress:${progress}%">
            <div class="panel-title-row"><h2>${escapeHtml(application.purpose)} Loan</h2><span class="status ${userStatusClass(application.status)}">${escapeHtml(application.status)}</span></div>
            <div class="detail-amount">${formatPeso(application.amount)}</div>
            <p class="muted">Loan ID ${escapeHtml(application.id)}. Submitted ${escapeHtml(application.submittedAt)}.</p>
            <div class="progress-track"><span style="width:${progress}%"></span></div>
            <div class="summary-line"><span>Term</span><strong>${escapeHtml(application.term)}</strong></div>
            <div class="summary-line"><span>Schedule</span><strong>${escapeHtml(application.schedule)}</strong></div>
          </article>
        `;
        }
      )
      .join("");
  });

  root.querySelectorAll(".dashboard-payment-table").forEach((table) => {
    const heading = table.closest(".panel")?.querySelector("h2")?.textContent.trim();

    if (heading !== "Recent Applications") {
      return;
    }

    if (!applications.length) {
      table.innerHTML = `<div class="payment-row"><span>No loan applications yet.</span></div>`;
      return;
    }

    table.innerHTML = `
      <div class="payment-row payment-head"><span>Loan ID</span><span>Type</span><span>Amount</span><span>Status</span></div>
      ${applications
        .slice(0, 5)
        .map(
          (application) => `
            <div class="payment-row">
              <strong>${escapeHtml(application.id)}</strong>
              <div>${escapeHtml(application.purpose)} Loan</div>
              <strong>${formatPeso(application.amount)}</strong>
              <span class="status ${userStatusClass(application.status)}">${escapeHtml(application.status)}</span>
            </div>
          `
        )
        .join("")}
    `;
  });
};

const loanProgressFor = (status, documentCount = 0, paymentCount = 0) => {
  const normalized = String(status || "").toLowerCase();
  const activityBonus = Math.min(documentCount * 5 + paymentCount * 6, 24);

  if (normalized.includes("approved")) {
    return 100;
  }

  if (normalized.includes("reject")) {
    return 100;
  }

  if (normalized.includes("review")) {
    return Math.min(84 + activityBonus, 95);
  }

  return Math.min(38 + activityBonus, 78);
};

const loanStageMarkup = (application) => {
  const normalized = String(application?.status || "Pending").toLowerCase();
  const approved = normalized.includes("approved");
  const rejected = normalized.includes("reject");
  const review = normalized.includes("review") || approved || rejected;
  const finalLabel = rejected ? "Rejected" : approved ? "Approved" : "Waiting";
  const finalClass = rejected ? "rejected" : approved ? "success" : "unpaid";
  const finalIcon = rejected ? "close" : approved ? "check" : "rule";

  return `
    <article class="loan-stage-item is-done" data-status-kind="done">
      <div class="loan-stage-marker"><span class="material-symbols-outlined">check</span></div>
      <div class="loan-stage-body"><div class="loan-stage-head"><strong>Application Submitted</strong><span class="status success">Completed</span></div><p>Your loan application was saved for admin review.</p><small>${escapeHtml(application?.submittedAt || "Saved date")}</small></div>
    </article>
    <article class="loan-stage-item ${review ? "is-done" : "is-current"}" data-status-kind="${review ? "done" : "current"}">
      <div class="loan-stage-marker"><span class="material-symbols-outlined">${review ? "check" : "hourglass_top"}</span></div>
      <div class="loan-stage-body"><div class="loan-stage-head"><strong>Document Review</strong><span class="status ${review ? "success" : "pending"}">${review ? "Completed" : "In Progress"}</span></div><p>Uploaded files are checked against your loan form.</p><small>${review ? "Completed by admin" : "Waiting for admin update"}</small></div>
    </article>
    <article class="loan-stage-item ${approved || rejected ? "is-done" : review ? "is-current" : ""}" data-status-kind="${approved || rejected ? "done" : review ? "current" : "upcoming"}">
      <div class="loan-stage-marker"><span class="material-symbols-outlined">${approved || rejected ? finalIcon : "manage_search"}</span></div>
      <div class="loan-stage-body"><div class="loan-stage-head"><strong>Approval Decision</strong><span class="status ${finalClass}">${finalLabel}</span></div><p>The decision shown here follows the admin action on your application.</p><small>${approved || rejected ? escapeHtml(application.status) : "Pending"}</small></div>
    </article>
    <article class="loan-stage-item ${approved ? "is-current" : ""}" data-status-kind="${approved ? "current" : "upcoming"}">
      <div class="loan-stage-marker"><span class="material-symbols-outlined">payments</span></div>
      <div class="loan-stage-body"><div class="loan-stage-head"><strong>Funds Release</strong><span class="status ${approved ? "pending" : "unpaid"}">${approved ? "Ready" : "Waiting"}</span></div><p>Release and repayment details become active after approval.</p><small>${approved ? "Prepare repayment method" : "After approval"}</small></div>
    </article>
  `;
};

const renderUserLoanStatus = (root = document) => {
  const application = getUserApplications()[0];
  const payments = getUserPayments().filter((payment) => !application || String(payment.loanId || "").includes(application.id));
  const documents = application?.documents || [];
  const totalAmount = Number(application?.amount || 0);
  const paidAmount = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);
  const progress = application ? loanProgressFor(application.status, documents.length, payments.length) : 0;
  const status = application?.status || "No Application";
  const purpose = application?.purpose || "Loan";
  const documentCount = documents.filter((document) => document.fileName && document.fileName !== "Not uploaded").length;

  root.querySelectorAll("[data-user-loan-status]").forEach((section) => {
    const hero = section.querySelector(".loan-status-hero");
    const timeline = section.querySelector(".loan-stage-list");
    const metrics = section.querySelector(".loan-status-metrics");
    const summary = section.querySelector(".loan-status-summary");
    const grids = section.querySelectorAll(".content-grid.two");

    if (hero) {
      hero.querySelector(".loan-status-chip span:last-child").textContent = status;
      hero.querySelector("h2").textContent = application ? `${purpose} application ${application.id}` : "No saved loan application";
      hero.querySelector("p").textContent = application
        ? "This status is based on your submitted form, uploaded documents, payments, and admin updates."
        : "Submit a loan application to start tracking your real account activity here.";
      hero.querySelector(".loan-status-meta").innerHTML = `
        <div><span>Application ID</span><strong>${escapeHtml(application?.id || "No application yet")}</strong></div>
        <div><span>Requested Amount</span><strong>${formatPeso(totalAmount)}</strong></div>
        <div><span>Submitted</span><strong>${escapeHtml(application?.submittedAt || "No submitted date")}</strong></div>
        <div><span>Current Status</span><strong>${escapeHtml(status)}</strong></div>
      `;
      hero.querySelector(".loan-status-ring-center strong").textContent = `${progress}%`;
      hero.querySelector(".loan-status-ring")?.style.setProperty("--loan-progress", `${progress}%`);
      hero.querySelector(".loan-status-score-copy strong").textContent = application ? `${status} progress` : "Waiting for application";
      hero.querySelector(".loan-status-score-copy p").textContent = application
        ? `${documentCount} uploaded document${documentCount === 1 ? "" : "s"} and ${payments.length} payment${payments.length === 1 ? "" : "s"} are linked to this account.`
        : "Your saved loan details will replace this area after you submit the form.";
    }

    if (timeline) {
      timeline.innerHTML = application
        ? loanStageMarkup(application)
        : `<article class="loan-stage-item is-current"><div class="loan-stage-marker"><span class="material-symbols-outlined">edit_document</span></div><div class="loan-stage-body"><div class="loan-stage-head"><strong>No Application Submitted</strong><span class="status pending">Empty</span></div><p>Fill out the loan form to create your status timeline.</p><small>Waiting for submission</small></div></article>`;
    }

    if (metrics) {
      metrics.innerHTML = `
        <article class="metric-card"><span>Current Stage</span><strong>${escapeHtml(status)}</strong><small>Based on admin update</small></article>
        <article class="metric-card"><span>Latest Update</span><strong>${escapeHtml(application?.submittedAt || "No date yet")}</strong><small>From saved user activity</small></article>
        <article class="metric-card"><span>Documents</span><strong>${documentCount}</strong><small>Uploaded with this loan</small></article>
      `;
    }

    if (summary) {
      summary.innerHTML = `
        <div class="summary-line"><span>Loan Type</span><strong>${escapeHtml(purpose)}</strong></div>
        <div class="summary-line"><span>Repayment Term</span><strong>${escapeHtml(application?.term || "Not selected")}</strong></div>
        <div class="summary-line"><span>Payment Schedule</span><strong>${escapeHtml(application?.schedule || "Not selected")}</strong></div>
        <div class="summary-line"><span>Documents</span><strong>${documentCount}</strong></div>
        <div class="summary-line"><span>Remaining Balance</span><strong>${formatPeso(remaining)}</strong></div>
      `;
    }

    if (grids[0]) {
      const panels = grids[0].querySelectorAll(".panel");
      if (panels[0]) {
        panels[0].querySelector(".profile-list").innerHTML = `
          <div class="profile-row"><span>Loan Type</span><strong>${escapeHtml(purpose)}</strong></div>
          <div class="profile-row"><span>Loan Amount Requested</span><strong>${formatPeso(totalAmount)}</strong></div>
          <div class="profile-row"><span>Loan Term</span><strong>${escapeHtml(application?.term || "Not selected")}</strong></div>
          <div class="profile-row"><span>Payment Schedule</span><strong>${escapeHtml(application?.schedule || "Not selected")}</strong></div>
        `;
      }
      if (panels[1]) {
        panels[1].querySelector(".notice-list").innerHTML = application
          ? `<article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">info</span></div><div><strong>${escapeHtml(status)}</strong><p>Your admin-side status is synced to this user page.</p></div></article>`
          : `<article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">info</span></div><div><strong>No admin remarks yet</strong><p>Remarks appear after you submit a loan application.</p></div></article>`;
      }
    }

    if (grids[1]) {
      const panels = grids[1].querySelectorAll(".panel");
      if (panels[0]) {
        panels[0].querySelector(".profile-list").innerHTML = documents.length
          ? documents.map((document) => `<div class="profile-row"><span>${escapeHtml(document.type)}</span><strong><span class="status ${userStatusClass(document.status)}">${escapeHtml(document.status)}</span></strong></div>`).join("")
          : `<div class="profile-row"><span>Documents</span><strong>No files uploaded yet</strong></div>`;
      }
      if (panels[1]) {
        panels[1].querySelector(".profile-list").innerHTML = `
          <div class="profile-row"><span>Total Loan Amount</span><strong>${formatPeso(totalAmount)}</strong></div>
          <div class="profile-row"><span>Paid Amount</span><strong>${formatPeso(paidAmount)}</strong></div>
          <div class="profile-row"><span>Remaining Balance</span><strong>${formatPeso(remaining)}</strong></div>
          <div class="profile-row"><span>Payment Records</span><strong>${payments.length}</strong></div>
        `;
      }
    }
  });
};

const renderUserStats = (root = document) => {
  const applications = getUserApplications();
  const payments = getUserPayments();
  const totalAmount = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const paidAmount = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);
  const cards = root.querySelectorAll(".dashboard-stat-card");

  if (cards[0]) {
    cards[0].querySelector("strong").textContent = formatPeso(totalAmount);
    cards[0].querySelector("small").textContent = `${applications.length} submitted loan${applications.length === 1 ? "" : "s"}`;
  }

  if (cards[1]) {
    cards[1].querySelector("strong").textContent = formatPeso(remaining);
    cards[1].querySelector(".mini-progress span").style.width = totalAmount ? `${Math.min(Math.round((paidAmount / totalAmount) * 100), 100)}%` : "0%";
  }

  if (cards[2]) {
    cards[2].querySelector("strong").textContent = formatPeso(paidAmount);
    cards[2].querySelector("small").textContent = `${payments.length} payment${payments.length === 1 ? "" : "s"} submitted`;
  }
};

const renderUserPayments = (root = document) => {
  const applications = getUserApplications();
  const payments = getUserPayments();
  const latestApplication = applications[0];
  const totalAmount = Number(latestApplication?.amount || 0);
  const paidAmount = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);

  root.querySelectorAll("[data-user-payment-options]").forEach((select) => {
    select.innerHTML = applications.length
      ? applications.map((application) => `<option>${escapeHtml(application.id)} - ${escapeHtml(application.purpose || "Loan")}</option>`).join("")
      : `<option>No submitted loans yet</option>`;
  });

  root.querySelectorAll("[data-user-payment-summary]").forEach((section) => {
    section.innerHTML = `
      <div class="profile-row"><span>Total Paid</span><strong>${formatPeso(paidAmount)}</strong></div>
      <div class="profile-row"><span>Remaining Balance</span><strong>${formatPeso(remaining)}</strong></div>
      <div class="profile-row"><span>Submitted Payments</span><strong>${payments.length}</strong></div>
      <div class="profile-row"><span>Overdue Fees</span><strong>${formatPeso(0)}</strong></div>
    `;
  });

  root.querySelectorAll("[data-user-payment-table]").forEach((tbody) => {
    if (!payments.length) {
      tbody.innerHTML = `<tr><td colspan="5">No payments submitted yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = payments
      .map(
        (payment) => `
          <tr>
            <td>${escapeHtml(payment.submittedAt)}</td>
            <td>${formatPeso(payment.amount)}</td>
            <td>${escapeHtml(payment.method)}</td>
            <td>${escapeHtml(payment.reference || payment.receipt)}</td>
            <td><span class="status pending">${escapeHtml(payment.status)}</span></td>
          </tr>
        `
      )
      .join("");
  });

  root.querySelectorAll(".dashboard-payment-table").forEach((table) => {
    const heading = table.closest(".panel")?.querySelector("h2")?.textContent.trim();

    if (heading === "Payment History") {
      table.innerHTML = `<div class="payment-row payment-head"><span>Date</span><span>Method</span><span>Amount</span><span>Status</span></div>`;
      table.innerHTML += payments.length
        ? payments
            .map(
              (payment) => `<div class="payment-row"><div><strong>${escapeHtml(payment.submittedAt)}</strong><small>${escapeHtml(payment.reference || payment.receipt)}</small></div><div><span class="material-symbols-outlined">payments</span>${escapeHtml(payment.method)}</div><strong>${formatPeso(payment.amount)}</strong><span class="status pending">${escapeHtml(payment.status)}</span></div>`
            )
            .join("")
        : `<div class="payment-row"><span>No payments submitted yet.</span></div>`;
    }

    if (heading === "Repayment Schedule" || heading === "Upcoming Schedule") {
      table.innerHTML = `<div class="payment-row payment-head"><span>Due Date</span><span>Loan</span><span>Amount</span><span>Status</span></div>`;
      table.innerHTML += applications.length
        ? applications
            .map(
              (application) => `<div class="payment-row"><strong>${escapeHtml(application.submittedAt)}</strong><div>${escapeHtml(application.purpose || "Loan")}</div><strong>${formatPeso(Math.round(Number(application.amount || 0) / 6) || 0)}</strong><span class="status pending">${escapeHtml(application.status || "Pending")}</span></div>`
            )
            .join("")
        : `<div class="payment-row"><span>No payment schedule yet.</span></div>`;
    }
  });

  root.querySelectorAll("[data-user-schedule-table]").forEach((tbody) => {
    if (!applications.length) {
      tbody.innerHTML = `<tr><td colspan="4">No payment schedule yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = applications
      .map(
        (application) => `
          <tr>
            <td>${escapeHtml(application.submittedAt)}</td>
            <td>${formatPeso(Math.round(Number(application.amount || 0) / 6) || 0)}</td>
            <td><span class="status pending">${escapeHtml(application.status || "Pending")}</span></td>
            <td><button class="btn-secondary" type="button">Pay</button></td>
          </tr>
        `
      )
      .join("");
  });
};

const renderUserDocuments = (root = document) => {
  const documents = getUserDocuments();
  const applicationDocuments = getUserApplications().flatMap((application) => application.documents || []);
  const allDocuments = [...documents, ...applicationDocuments.map((document) => ({
    type: document.type,
    fileName: document.fileName,
    status: document.status,
    uploadedAt: "From loan form",
  }))];
  const uploadedDocuments = allDocuments.filter((document) => document.fileName && document.fileName !== "Not uploaded" && document.fileName !== "No file selected");
  const approvedDocuments = uploadedDocuments.filter((document) => /approved|verified|success/i.test(document.status || ""));
  const pendingDocuments = uploadedDocuments.filter((document) => /pending|review|missing/i.test(document.status || ""));
  const rejectedDocuments = uploadedDocuments.filter((document) => /reject/i.test(document.status || ""));
  const completion = uploadedDocuments.length ? Math.round((approvedDocuments.length / uploadedDocuments.length) * 100) : 0;

  root.querySelectorAll("[data-user-documents-status]").forEach((section) => {
    const chip = section.querySelector(".loan-status-chip span:last-child");
    const title = section.querySelector("h2");
    const copy = section.querySelector(".loan-status-hero-copy > p");
    const meta = section.querySelector(".loan-status-meta");
    const ring = section.querySelector(".loan-status-ring");
    const ringValue = section.querySelector(".loan-status-ring-center strong");
    const ringLabel = section.querySelector(".loan-status-ring-center span");
    const summaryTitle = section.querySelector(".loan-status-score-copy strong");
    const summaryCopy = section.querySelector(".loan-status-score-copy p");
    const statusText = uploadedDocuments.length ? (completion === 100 ? "Verified" : "For Review") : "No Documents";

    if (chip) chip.textContent = statusText;
    if (title) title.textContent = uploadedDocuments.length ? "My Uploaded Documents" : "No uploaded documents yet";
    if (copy) {
      copy.textContent = uploadedDocuments.length
        ? "Your document status is based on files uploaded from your forms and document page."
        : "Upload document files to start verification progress.";
    }
    if (meta) {
      meta.innerHTML = `
        <div><span>Uploaded Files</span><strong>${uploadedDocuments.length}</strong></div>
        <div><span>Approved</span><strong>${approvedDocuments.length}</strong></div>
        <div><span>Pending Review</span><strong>${pendingDocuments.length}</strong></div>
        <div><span>Rejected</span><strong>${rejectedDocuments.length}</strong></div>
      `;
    }
    if (ring) ring.style.setProperty("--loan-progress", `${completion}%`);
    if (ringValue) ringValue.textContent = `${completion}%`;
    if (ringLabel) ringLabel.textContent = uploadedDocuments.length ? "Verified" : "Complete";
    if (summaryTitle) summaryTitle.textContent = uploadedDocuments.length ? `${approvedDocuments.length} of ${uploadedDocuments.length} verified` : "No document data";
    if (summaryCopy) {
      summaryCopy.textContent = uploadedDocuments.length
        ? `${pendingDocuments.length} file${pendingDocuments.length === 1 ? "" : "s"} still need admin review.`
        : "The verification percentage will stay at 0% until files are uploaded.";
    }
  });

  root.querySelectorAll(".user-content").forEach((content) => {
    if (!content.querySelector("[data-user-documents-status]")) {
      return;
    }

    const overview = [...content.querySelectorAll(".panel")].find((panel) => panel.querySelector("h2")?.textContent.trim() === "Required Documents Overview");
    const verification = [...content.querySelectorAll(".panel")].find((panel) => panel.querySelector("h2")?.textContent.trim() === "Verification Status");

    if (overview?.querySelector(".profile-list")) {
      overview.querySelector(".profile-list").innerHTML = `
        <div class="profile-row"><span>Uploaded Documents</span><strong>${uploadedDocuments.length}</strong></div>
        <div class="profile-row"><span>Verified Documents</span><strong>${approvedDocuments.length}</strong></div>
        <div class="profile-row"><span>Status</span><strong><span class="status ${completion === 100 ? "success" : "pending"}">${uploadedDocuments.length ? (completion === 100 ? "Verified" : "For Review") : "No Documents"}</span></strong></div>
      `;
    }

    if (verification?.querySelector(".profile-list")) {
      verification.querySelector(".profile-list").innerHTML = `
        <div class="profile-row"><span>Status</span><strong><span class="status ${completion === 100 ? "success" : "pending"}">${uploadedDocuments.length ? (completion === 100 ? "Verified" : "For Review") : "No Documents"}</span></strong></div>
        <div class="profile-row"><span>Completion</span><strong>${completion}%</strong></div>
        <div class="profile-row"><span>Overall Result</span><strong>${uploadedDocuments.length ? "Waiting for admin review" : "Upload documents to begin"}</strong></div>
      `;
    }
  });

  root.querySelectorAll("[data-user-documents-table]").forEach((tbody) => {
    if (!allDocuments.length) {
      tbody.innerHTML = `<tr><td colspan="5">No documents uploaded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = allDocuments
      .map(
        (document) => `
          <tr>
            <td>${escapeHtml(document.type)}</td>
            <td>${escapeHtml(document.fileName)}</td>
            <td><span class="status ${userStatusClass(document.status)}">${escapeHtml(document.status)}</span></td>
            <td>${escapeHtml(document.uploadedAt)}</td>
            <td><button class="btn-secondary" type="button">View</button></td>
          </tr>
        `
      )
      .join("");
  });
};

const renderUserNotifications = (root = document) => {
  const applications = getUserApplications();
  const payments = getUserPayments();
  const docs = getUserDocuments();
  const activities = getCurrentUser()?.activities || [];

  root.querySelectorAll("[data-user-notices]").forEach((list) => {
    const notices = [
      ...applications.map((application) => [`Loan ${application.status || "submitted"}`, `${application.purpose || "Loan"} application ${application.id} is ${application.status || "Pending"}.`]),
      ...payments.map((payment) => ["Payment submitted", `${formatPeso(payment.amount)} via ${payment.method} is ${payment.status}.`]),
      ...docs.map((document) => ["Document uploaded", `${document.type} (${document.fileName}) is ${document.status}.`]),
      ...activities.map((activity) => [activity.action || "Saved action", `${activity.source || "Modal"} saved on ${activity.submittedAt}.`]),
    ];

    list.innerHTML = notices.length
      ? notices
          .map(
            ([title, body]) => `<article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">notifications</span></div><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></div></article>`
          )
          .join("")
      : `<article class="notice-card"><div class="icon-badge blue"><span class="material-symbols-outlined">info</span></div><div><strong>No account activity yet</strong><p>Loan, payment, and document updates will appear here.</p></div></article>`;
  });
};

const renderUserData = (root = document) => {
  hydrateUserData(root);
  renderUserLoans(root);
  renderUserLoanStatus(root);
  renderUserStats(root);
  renderUserPayments(root);
  renderUserDocuments(root);
  renderUserNotifications(root);
};

const getAllBorrowers = () =>
  Object.values(readUserStore()).map((user, index) => ({
    ...user,
    userId: `USR-${String(index + 1).padStart(4, "0")}`,
    applications: user.applications || [],
  }));

const getAllApplications = () =>
  getAllBorrowers().flatMap((user) =>
    (user.applications || []).map((application) => ({
      ...application,
      user,
    }))
  );

const statusClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("approved") || normalized.includes("verified") || normalized.includes("paid")) {
    return "good";
  }

  if (normalized.includes("reject") || normalized.includes("missing") || normalized.includes("overdue") || normalized.includes("blocked")) {
    return "bad";
  }

  return "warn";
};

const latestApplication = () => getAllApplications()[0] || null;

const renderEmptyAdminRow = (tbody, colspan, label) => {
  tbody.innerHTML = `<tr><td colspan="${colspan}">No ${label} submitted yet.</td></tr>`;
};

const renderAdminUsersTable = (tbody) => {
  const borrowers = getAllBorrowers();

  if (!borrowers.length) {
    renderEmptyAdminRow(tbody, 5, "borrowers");
    return;
  }

  tbody.innerHTML = borrowers
    .map(
      (user) => `
        <tr>
          <td>${escapeHtml(user.userId)}</td>
          <td>${escapeHtml(user.name || nameFromEmail(user.email || "user@example.com"))}</td>
          <td>${escapeHtml(user.email || "No email saved")}</td>
          <td><span class="status ${user.applications.length ? "warn" : "good"}">${user.applications.length ? "Applicant" : "Registered"}</span></td>
          <td><button class="btn secondary" type="button" data-action="Borrower profile loaded.">View</button></td>
        </tr>
      `
    )
    .join("");
};

const renderAdminLoansTable = (tbody) => {
  const applications = getAllApplications();

  if (!applications.length) {
    renderEmptyAdminRow(tbody, 6, "loan applications");
    return;
  }

  tbody.innerHTML = applications
    .map(
      (application) => `
        <tr>
          <td>${escapeHtml(application.id)}</td>
          <td>${escapeHtml(application.user.name || nameFromEmail(application.user.email || "user@example.com"))}</td>
          <td>${escapeHtml(application.purpose || "Personal")}</td>
          <td>${formatPeso(application.amount)}</td>
          <td><span class="status ${statusClass(application.status)}">${escapeHtml(application.status || "Pending")}</span></td>
          <td>
            <button class="btn secondary" type="button" data-admin-loan-status="Approved" data-loan-id="${escapeHtml(application.id)}">Approve</button>
            <button class="btn secondary" type="button" data-admin-loan-status="Rejected" data-loan-id="${escapeHtml(application.id)}">Reject</button>
          </td>
        </tr>
      `
    )
    .join("");
};

const renderAdminDocumentsTable = (tbody) => {
  const applicationRows = getAllApplications().flatMap((application) =>
    (application.documents || []).map((document, index) => ({
      ...document,
      id: `DOC-${application.id.replace(/\D/g, "").slice(-4)}-${index + 1}`,
      borrower: application.user.name || nameFromEmail(application.user.email || "user@example.com"),
      submittedAt: application.submittedAt,
    }))
  );
  const directRows = getAllBorrowers().flatMap((user) =>
    (user.documents || []).map((document) => ({
      ...document,
      borrower: user.name || nameFromEmail(user.email || "user@example.com"),
      submittedAt: document.uploadedAt || "Saved date",
    }))
  );
  const rows = [...directRows, ...applicationRows];

  if (!rows.length) {
    renderEmptyAdminRow(tbody, 6, "documents");
    return;
  }

  tbody.innerHTML = rows
    .map(
      (document) => `
        <tr>
          <td>${escapeHtml(document.id)}</td>
          <td>${escapeHtml(document.borrower)}</td>
          <td>${escapeHtml(document.type)}<br><small>${escapeHtml(document.fileName)}</small></td>
          <td>${escapeHtml(document.submittedAt)}</td>
          <td><span class="status ${statusClass(document.status)}">${escapeHtml(document.status)}</span></td>
          <td><button class="btn secondary" type="button" data-action="Document record opened.">Review</button></td>
        </tr>
      `
    )
    .join("");
};

const renderAdminPaymentsTable = (tbody) => {
  const rows = getAllBorrowers().flatMap((user) =>
    (user.payments || []).map((payment) => ({
      ...payment,
      user,
    }))
  );

  if (!rows.length) {
    renderEmptyAdminRow(tbody, 6, "payment records");
    return;
  }

  tbody.innerHTML = rows
    .map(
      (payment) => `
        <tr>
          <td>${escapeHtml(payment.id)}</td>
          <td>${escapeHtml(payment.loanId)}</td>
          <td>${escapeHtml(payment.user.name || nameFromEmail(payment.user.email || "user@example.com"))}</td>
          <td>${formatPeso(payment.amount)}</td>
          <td><span class="status ${statusClass(payment.status)}">${escapeHtml(payment.status)}</span></td>
          <td><button class="btn secondary" type="button" data-action="Payment record opened.">Open</button></td>
        </tr>
      `
    )
    .join("");
};

const renderAdminActivitiesTable = (tbody) => {
  const rows = getAllBorrowers().flatMap((user) =>
    (user.activities || []).map((activity) => ({
      ...activity,
      user,
    }))
  );

  if (!rows.length) {
    renderEmptyAdminRow(tbody, 5, "saved modal activity");
    return;
  }

  tbody.innerHTML = rows
    .map(
      (activity) => `
        <tr>
          <td>${escapeHtml(activity.submittedAt || activity.id)}</td>
          <td>${escapeHtml(activity.user.name || nameFromEmail(activity.user.email || "user@example.com"))}</td>
          <td>${escapeHtml(`${activity.action || activity.source}: ${Object.entries(activity.fields || {}).map(([key, value]) => `${key}: ${value}`).join("; ")}`)}</td>
          <td><span class="status good">${escapeHtml(activity.status || "Saved")}</span></td>
          <td><button class="btn secondary" type="button" data-action="Activity record opened.">Open</button></td>
        </tr>
      `
    )
    .join("");
};

const renderAdminDetailPanel = (root = document) => {
  const application = latestApplication();
  const page = document.body.dataset.page || "";
  const isBorrowerRecordPage =
    page.includes("loan") ||
    page.includes("borrower") ||
    page.includes("payment") ||
    page.includes("users");

  if (!application) {
    return;
  }

  if (!isBorrowerRecordPage) {
    return;
  }

  root.querySelectorAll(".admin-page .panel .list").forEach((list) => {
    list.innerHTML = `
      <li><strong>Reference</strong><span>${escapeHtml(application.id)}</span></li>
      <li><strong>Borrower</strong><span>${escapeHtml(application.user.name || nameFromEmail(application.user.email || "user@example.com"))}</span></li>
      <li><strong>Email</strong><span>${escapeHtml(application.user.email || "No email saved")}</span></li>
      <li><strong>Contact</strong><span>${escapeHtml(application.user.contact || "No contact saved")}</span></li>
      <li><strong>Amount</strong><span>${formatPeso(application.amount)}</span></li>
      <li><strong>Purpose</strong><span>${escapeHtml(application.purpose || "Personal")}</span></li>
      <li><strong>Status</strong><span><span class="status ${statusClass(application.status)}">${escapeHtml(application.status || "Pending")}</span></span></li>
      <li><strong>Submitted</strong><span>${escapeHtml(application.submittedAt)}</span></li>
    `;
  });

  root.querySelectorAll(".admin-page form").forEach((form) => {
    const data = application.formData || {};
    form.innerHTML = `
      <label class="field"><span>Reference ID</span><input type="text" value="${escapeHtml(application.id)}" readonly></label>
      <label class="field"><span>Borrower Name</span><input type="text" value="${escapeHtml(application.user.name || nameFromEmail(application.user.email || "user@example.com"))}" readonly></label>
      <label class="field"><span>Email</span><input type="text" value="${escapeHtml(application.user.email || "")}" readonly></label>
      <label class="field"><span>Contact Number</span><input type="text" value="${escapeHtml(application.user.contact || "")}" readonly></label>
      <label class="field"><span>Amount</span><input type="text" value="${escapeHtml(application.amount || "")}" readonly></label>
      <label class="field"><span>Purpose</span><input type="text" value="${escapeHtml(application.purpose || "")}" readonly></label>
      <label class="field"><span>Monthly Income</span><input type="text" value="${escapeHtml(data.monthlyIncome || "")}" readonly></label>
      <label class="field"><span>Bank Name</span><input type="text" value="${escapeHtml(data.bankName || "")}" readonly></label>
      <label class="field"><span>Admin Notes</span><input type="text" placeholder="Add review notes"></label>
      <div class="actions">
        <button class="btn" type="button" data-admin-loan-status="Approved" data-loan-id="${escapeHtml(application.id)}">Approve</button>
        <button class="btn secondary" type="button" data-admin-loan-status="Rejected" data-loan-id="${escapeHtml(application.id)}">Reject</button>
      </div>
    `;
  });
};

const renderAdminDashboardStats = (root = document) => {
  const applications = getAllApplications();
  const borrowers = getAllBorrowers();
  const pendingCount = applications.filter((application) => String(application.status || "").toLowerCase() === "pending").length;
  const totalAmount = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const cards = root.querySelectorAll(".admin-page .card");
  const setCard = (card, label, value, note) => {
    if (!card) {
      return;
    }

    const labelTarget = card.querySelector(".metric-card-head span:last-child") || card.querySelector("span");
    labelTarget.textContent = label;
    card.querySelector("strong").textContent = value;
    card.querySelector("small").textContent = note;
  };

  setCard(cards[0], "Active borrowers", String(borrowers.length), "Registered borrowers");
  setCard(cards[1], "Pending reviews", String(pendingCount), "Need admin decision");
  setCard(cards[2], "Applications", String(applications.length), "Submitted applications");
  setCard(cards[3], "Requested total", formatPeso(totalAmount), "Requested loan total");
};

const updateApplicationStatus = (loanId, status) => {
  const store = readUserStore();

  Object.values(store).forEach((user) => {
    (user.applications || []).forEach((application) => {
      if (application.id === loanId) {
        application.status = status;
      }
    });
  });

  writeUserStore(store);
};

const detailRowsFromObject = (details) =>
  Object.entries(details)
    .filter(([, value]) => String(value ?? "").trim())
    .map(
      ([label, value]) => `
        <label class="field">
          <span>${escapeHtml(label)}</span>
          <input type="text" data-record-field="${escapeHtml(label)}" value="${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}" ${label === "Action" ? "readonly" : ""}>
        </label>
      `
    )
    .join("");

const collectModalFields = (form) => {
  const fields = {};

  form.querySelectorAll("[data-record-field]").forEach((input) => {
    fields[input.dataset.recordField] = input.value.trim();
  });

  form.querySelectorAll("label.field").forEach((label) => {
    const key = label.querySelector("span")?.textContent.trim();
    const input = label.querySelector("input, select, textarea");

    if (!key || fields[key] || !input) {
      return;
    }

    if (input.type === "file") {
      fields[key] = [...input.files].map((file) => file.name).join(", ");
      return;
    }

    fields[key] = input.value.trim();
  });

  return fields;
};

const parseMoney = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const firstFieldValue = (fields, labels) => {
  const normalizedEntries = Object.entries(fields).map(([key, value]) => [key.toLowerCase(), value]);

  for (const label of labels) {
    const directValue = fields[label];

    if (String(directValue || "").trim()) {
      return String(directValue).trim();
    }

    const normalizedLabel = label.toLowerCase();
    const match = normalizedEntries.find(([key]) => key === normalizedLabel);

    if (String(match?.[1] || "").trim()) {
      return String(match[1]).trim();
    }
  }

  return "";
};

const resolveStoreUserEmail = (store, fields, fallbackEmail = "") => {
  const keys = Object.keys(store);
  const email = firstFieldValue(fields, ["Email", "Borrower Email", "User Email"]) || fallbackEmail;

  if (email && store[email.toLowerCase()]) {
    return email.toLowerCase();
  }

  const userId = firstFieldValue(fields, ["User ID"]);
  if (userId) {
    const index = Number(userId.replace(/\D/g, "")) - 1;
    if (keys[index]) {
      return keys[index];
    }
  }

  const name = firstFieldValue(fields, ["Borrower", "Name"]);
  if (name) {
    return keys.find((key) => {
      const user = store[key];
      return (user.name || nameFromEmail(user.email || key)).toLowerCase() === name.toLowerCase();
    }) || "";
  }

  return "";
};

const updateStoredUser = (store, email, fields) => {
  const user = store[email];

  if (!user) {
    return email;
  }

  const nextEmail = firstFieldValue(fields, ["Email", "Borrower Email", "User Email"]).toLowerCase() || email;
  const nextUser = {
    ...user,
    name: firstFieldValue(fields, ["Name", "Borrower"]) || user.name,
    email: nextEmail,
    contact: firstFieldValue(fields, ["Contact", "Contact Number"]) || user.contact,
    address: firstFieldValue(fields, ["Address"]) || user.address,
  };

  delete store[email];
  store[nextEmail] = nextUser;

  if (localStorage.getItem(userSessionKey) === email) {
    localStorage.setItem(userSessionKey, nextEmail);
  }

  return nextEmail;
};

const updateApplicationFromFields = (application, fields) => {
  if (!application) {
    return;
  }

  const amount = firstFieldValue(fields, ["Amount", "Requested Amount", "Loan Amount Requested", "Total Loan Amount"]);
  const purpose = firstFieldValue(fields, ["Purpose", "Loan Type", "Type"]);
  const term = firstFieldValue(fields, ["Term", "Repayment Term", "Loan Term"]);
  const schedule = firstFieldValue(fields, ["Schedule", "Payment Schedule"]);
  const status = firstFieldValue(fields, ["Status", "Current Status"]);

  if (amount) application.amount = String(parseMoney(amount));
  if (purpose) application.purpose = purpose.replace(/\s+Loan$/i, "");
  if (term) application.term = term;
  if (schedule) application.schedule = schedule;
  if (status) application.status = status;
};

const updateDocumentFromFields = (document, fields) => {
  if (!document) {
    return;
  }

  const type = firstFieldValue(fields, ["Document Type", "Type"]);
  const fileName = firstFieldValue(fields, ["File Name", "File"]);
  const status = firstFieldValue(fields, ["Status"]);
  const uploadedAt = firstFieldValue(fields, ["Date Uploaded", "Submitted"]);

  if (type) document.type = type;
  if (fileName) document.fileName = fileName;
  if (status) document.status = status;
  if (uploadedAt) document.uploadedAt = uploadedAt;
};

const updatePaymentFromFields = (payment, fields) => {
  if (!payment) {
    return;
  }

  const loanId = firstFieldValue(fields, ["Loan ID", "Loan"]);
  const amount = firstFieldValue(fields, ["Amount", "Amount Paid", "Payment Amount"]);
  const method = firstFieldValue(fields, ["Method Used", "Payment Method"]);
  const reference = firstFieldValue(fields, ["Reference Number", "Reference"]);
  const status = firstFieldValue(fields, ["Status"]);
  const submittedAt = firstFieldValue(fields, ["Date Paid", "Submitted"]);

  if (loanId) payment.loanId = loanId;
  if (amount) payment.amount = String(parseMoney(amount));
  if (method) payment.method = method;
  if (reference) payment.reference = reference;
  if (status) payment.status = status;
  if (submittedAt) payment.submittedAt = submittedAt;
};

const saveActivityRecord = (fields, source = "User modal", scope = "current") => {
  const store = readUserStore();
  const currentUser = getCurrentUser();
  const currentEmail = currentUser?.email || "";
  const email = scope === "current" ? currentEmail : resolveStoreUserEmail(store, fields, currentEmail);
  const user = email ? store[email] : null;

  if (!user || !email) {
    return false;
  }

  const ignoredFields = new Set(["Action", "Name", "Email", "Contact", "Contact Number", "Address"]);
  const savedFields = Object.fromEntries(Object.entries(fields).filter(([key, value]) => !ignoredFields.has(key) && String(value || "").trim()));

  if (!Object.keys(savedFields).length) {
    return false;
  }

  const activity = {
    id: `ACT-${String(Date.now()).slice(-6)}`,
    source,
    action: fields.Action || source,
    fields: savedFields,
    status: "Saved",
    submittedAt: new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  };

  store[email] = {
    ...user,
    activities: [activity, ...(user.activities || [])],
  };
  writeUserStore(store);

  return true;
};

const saveModalRecordEdits = (fields, scope = "current") => {
  const store = readUserStore();
  const currentEmail = getCurrentUser()?.email || "";
  const email = scope === "current" ? currentEmail : resolveStoreUserEmail(store, fields, currentEmail);
  let activeEmail = email;

  if (!activeEmail || !store[activeEmail]) {
    return false;
  }

  activeEmail = updateStoredUser(store, activeEmail, fields);
  const user = store[activeEmail];
  const loanId = firstFieldValue(fields, ["Loan ID", "Latest Loan", "Application ID"]);
  const paymentId = firstFieldValue(fields, ["Payment ID"]);
  const documentId = firstFieldValue(fields, ["Document ID"]);
  const documentType = firstFieldValue(fields, ["Document Type"]);
  const fileName = firstFieldValue(fields, ["File Name"]);

  if (loanId) {
    const application = (user.applications || []).find((item) => item.id === loanId || String(loanId).includes(item.id));
    updateApplicationFromFields(application, fields);
  }

  if (paymentId) {
    const payment = (user.payments || []).find((item) => item.id === paymentId);
    updatePaymentFromFields(payment, fields);
  }

  if (documentId || documentType || fileName) {
    (user.documents || []).forEach((document) => {
      const matchesStandalone = document.id === documentId || document.type === documentType || document.fileName === fileName;
      if (matchesStandalone) updateDocumentFromFields(document, fields);
    });

    (user.applications || []).forEach((application) => {
      (application.documents || []).forEach((document, index) => {
        const appDocId = `DOC-${application.id.replace(/\D/g, "").slice(-4)}-${index + 1}`;
        const matchesApplicationDoc = appDocId === documentId || document.type === documentType || document.fileName === fileName;
        if (matchesApplicationDoc) updateDocumentFromFields(document, fields);
      });
    });
  }

  writeUserStore(store);
  return true;
};

const getAdminApplicationDetails = () => {
  const application = latestApplication();

  if (!application) {
    return {};
  }

  const data = application.formData || {};
  return {
    "Loan ID": application.id,
    Borrower: application.user.name || nameFromEmail(application.user.email || "user@example.com"),
    Email: application.user.email || "",
    Contact: application.user.contact || "",
    Amount: formatPeso(application.amount),
    Purpose: application.purpose || "",
    Term: application.term || "",
    Schedule: application.schedule || "",
    Status: application.status || "Pending",
    "Monthly Income": data.monthlyIncome || "",
    "Monthly Expenses": data.monthlyExpenses || "",
    "Bank Name": data.bankName || "",
    "Bank Account": data.bankAccount || "",
    "Submitted Documents": (application.documents || []).map((document) => `${document.type}: ${document.fileName}`).join("; "),
  };
};

const getAdminButtonContext = (button) => {
  const row = button.closest("tr");

  if (row) {
    const table = row.closest("table");
    const headings = [...(table?.querySelectorAll("thead th") || [])].map((heading) => heading.textContent.trim());
    const details = {};

    row.querySelectorAll("td").forEach((cell, index) => {
      const label = headings[index] || `Field ${index + 1}`;
      details[label] = cell.textContent.trim();
    });

    return details;
  }

  const article = button.closest("article");

  if (article) {
    return {
      Item: article.querySelector("strong, h2, h3")?.textContent.trim() || "Selected item",
      Details: article.querySelector("span:not(.material-symbols-outlined), p")?.textContent.trim() || button.dataset.action || "",
    };
  }

  const form = button.closest("form");

  if (form) {
    const details = {};
    form.querySelectorAll("label.field").forEach((label) => {
      const key = label.querySelector("span")?.textContent.trim();
      const input = label.querySelector("input, select, textarea");
      if (key) {
        details[key] = input?.value || input?.placeholder || "";
      }
    });
    return details;
  }

  return getAdminApplicationDetails();
};

const getCurrentUserDetails = () => {
  const user = getCurrentUser();
  const application = getUserApplications()[0] || {};

  return {
    Name: user?.name || "User",
    Email: user?.email || "No email saved",
    Contact: user?.contact || "No contact saved",
    Address: userFieldValue(user, "address") || "No address saved",
    "Latest Loan": application.id || "No loan submitted",
    Amount: application.amount ? formatPeso(application.amount) : "",
    Purpose: application.purpose || "",
    Status: application.status || "",
  };
};

const getUserButtonContext = (button) => {
  const row = button.closest("tr");

  if (row) {
    const table = row.closest("table");
    const headings = [...(table?.querySelectorAll("thead th") || [])].map((heading) => heading.textContent.trim());
    const details = {};

    row.querySelectorAll("td").forEach((cell, index) => {
      const label = headings[index] || `Field ${index + 1}`;
      details[label] = cell.textContent.trim();
    });

    return details;
  }

  const panel = button.closest(".panel, .metric-card, .notice-card, .loan-detail-card, .active-loan-card");

  if (panel) {
    const details = {};
    const title = panel.querySelector("h2, h3, strong")?.textContent.trim();

    if (title) {
      details.Section = title;
    }

    panel.querySelectorAll(".profile-row, .summary-line").forEach((rowItem) => {
      const label = rowItem.querySelector("span")?.textContent.trim();
      const value = rowItem.querySelector("strong")?.textContent.trim();

      if (label && value) {
        details[label] = value;
      }
    });

    return details;
  }

  return {};
};

const actionLabelFromButton = (button) => {
  const clone = button.cloneNode(true);
  clone.querySelectorAll(".material-symbols-outlined").forEach((icon) => icon.remove());
  const label = clone.textContent.trim() || button.getAttribute("aria-label") || button.dataset.action || "Action";

  if (/^edit\s+profile$/i.test(label)) {
    return "Edit Profile";
  }

  return label;
};

const userModalFieldsFor = (action) => {
  const normalized = action.toLowerCase();

  if (normalized.includes("edit profile")) {
    const user = getCurrentUser();
    return `
      <label class="field"><span>Full Name</span><input type="text" data-user-modal-input="name" value="${escapeHtml(user?.name || "")}" placeholder="Full name"></label>
      <label class="field"><span>Email</span><input type="email" data-user-modal-input="email" value="${escapeHtml(user?.email || "")}" placeholder="you@gmail.com"></label>
      <label class="field"><span>Contact Number</span><input type="text" data-user-modal-input="contact" value="${escapeHtml(user?.contact || "")}" placeholder="+63 912 345 6789"></label>
      <label class="field full-span"><span>Address</span><textarea data-user-modal-input="address" placeholder="Address">${escapeHtml(userFieldValue(user, "address"))}</textarea></label>
    `;
  }

  if (normalized.includes("pay")) {
    return `
      <label class="field"><span>Payment Amount</span><input type="number" placeholder="Amount"></label>
      <label class="field"><span>Payment Method</span><select><option>GCash</option><option>Bank Transfer</option><option>Cash</option></select></label>
      <label class="field"><span>Reference Number</span><input type="text" placeholder="Payment reference"></label>
      <label class="field full-span"><span>Upload Receipt</span><input type="file" accept=".pdf,.jpg,.jpeg,.png"></label>
    `;
  }

  if (normalized.includes("upload") || normalized.includes("replace") || normalized.includes("reupload")) {
    return `
      <label class="field"><span>Document Type</span><select><option>Valid ID</option><option>Proof of Income</option><option>Selfie with ID</option><option>Payment Receipt</option></select></label>
      <label class="field"><span>Upload File</span><input type="file" accept=".pdf,.jpg,.jpeg,.png"></label>
      <label class="field full-span"><span>Notes</span><textarea placeholder="Optional notes"></textarea></label>
    `;
  }

  if (normalized.includes("contact") || normalized.includes("ticket") || normalized.includes("support") || normalized.includes("chat")) {
    return `
      <label class="field"><span>Topic</span><input type="text" placeholder="What do you need help with?"></label>
      <label class="field full-span"><span>Message</span><textarea placeholder="Write your message"></textarea></label>
    `;
  }

  return `<label class="field full-span"><span>Notes</span><textarea placeholder="Add notes for this action"></textarea></label>`;
};

const ensureUserModal = () => {
  let modal = document.querySelector("[data-user-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "modal-backdrop user-modal-backdrop";
  modal.hidden = true;
  modal.dataset.userModal = "";
  modal.innerHTML = `
    <section class="user-detail-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <button class="icon-button modal-close" type="button" data-user-modal-close aria-label="Close details">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="user-detail-modal-head">
        <p class="page-kicker">Account action</p>
        <h2 id="user-modal-title">Action Details</h2>
      </div>
      <form class="form-grid user-detail-form" data-user-modal-form></form>
    </section>
  `;
  document.body.append(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-user-modal-close]")) {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  });

  modal.querySelector("[data-user-modal-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getCurrentUser();
    const form = event.currentTarget;
    const fields = collectModalFields(form);
    const action = form.dataset.modalAction || fields.Action || "User modal";

    if (user) {
      const profileFields = {};

      modal.querySelectorAll("[data-user-modal-input]").forEach((input) => {
        const value = input.value.trim();

        profileFields[input.dataset.userModalInput] = value;
        if (input.dataset.userModalInput === "name") fields.Name = value;
        if (input.dataset.userModalInput === "email") fields.Email = value;
        if (input.dataset.userModalInput === "contact") fields.Contact = value;
        if (input.dataset.userModalInput === "address") fields.Address = value;
      });
      const isProfileSave = Object.keys(profileFields).length > 0;

      if (Object.keys(profileFields).length) {
        applyUserSnapshotToDom(saveCurrentUserProfile(profileFields));
      }

      if (!isProfileSave) {
        saveModalRecordEdits(fields, "current");
      }

      if (isPaymentForm(event.currentTarget)) {
        savePaymentRecord(event.currentTarget);
      }
      if (isDocumentForm(event.currentTarget)) {
        saveDocumentRecord(event.currentTarget);
      }
      saveActivityRecord(fields, action, "current");
      syncRenderedData();
    }

    modal.hidden = true;
    document.body.style.overflow = "";
  });

  return modal;
};

const openUserModal = (button) => {
  const modal = ensureUserModal();
  const form = modal.querySelector("[data-user-modal-form]");
  const action = actionLabelFromButton(button);
  const isProfileAction = action.toLowerCase().includes("edit profile");
  const details = {
    Action: action,
    ...getCurrentUserDetails(),
    ...getUserButtonContext(button),
  };

  modal.querySelector("#user-modal-title").textContent = action;
  form.dataset.modalAction = action;
  form.innerHTML = `
    ${isProfileAction ? "" : `<div class="user-modal-summary">${detailRowsFromObject(details)}</div>`}
    <div class="user-modal-fields">${userModalFieldsFor(action)}</div>
    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Save</button>
      <button class="btn-secondary" type="button" data-user-modal-close>Close</button>
    </div>
  `;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  form.querySelector("input:not([readonly]), textarea, select")?.focus();
};

const ensureAdminModal = () => {
  let modal = document.querySelector("[data-admin-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "modal-backdrop admin-modal-backdrop";
  modal.hidden = true;
  modal.dataset.adminModal = "";
  modal.innerHTML = `
    <section class="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
      <button class="icon-button modal-close" type="button" data-admin-modal-close aria-label="Close details">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="admin-detail-modal-head">
        <p class="eyebrow">Admin review</p>
        <h2 id="admin-modal-title">Record Details</h2>
      </div>
      <form class="form-grid admin-detail-form" data-admin-modal-form></form>
    </section>
  `;
  document.body.append(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-admin-modal-close]")) {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  });

  modal.querySelector("[data-admin-modal-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = collectModalFields(event.currentTarget);
    const saved = saveModalRecordEdits(fields, "admin");
    saveActivityRecord(fields, "Admin modal", "admin");
    syncRenderedData();
    modal.hidden = true;
    document.body.style.overflow = "";
    showAdminToast(saved ? "Record updated." : "Admin note saved locally.");
  });

  return modal;
};

const openAdminModal = (button) => {
  const modal = ensureAdminModal();
  const form = modal.querySelector("[data-admin-modal-form]");
  const title = button.textContent.trim() || "Record Details";
  const details = {
    Action: title,
    ...getAdminApplicationDetails(),
    ...getAdminButtonContext(button),
  };

  modal.querySelector("#admin-modal-title").textContent = `${title} Details`;
  form.innerHTML = `
    <div class="form-grid two">${detailRowsFromObject(details)}</div>
    <label class="field full-span"><span>Admin Notes</span><textarea placeholder="Add notes for this record"></textarea></label>
    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Save Note</button>
      <button class="btn-secondary" type="button" data-admin-modal-close>Close</button>
    </div>
  `;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  form.querySelector("textarea")?.focus();
};

const renderAdminData = (root = document) => {
  if (!document.body.classList.contains("admin-page")) {
    return;
  }

  root.querySelectorAll("#admin-records").forEach((table) => {
    const headings = [...table.querySelectorAll("thead th")].map((heading) => heading.textContent.trim().toLowerCase());
    const tbody = table.querySelector("tbody");

    if (!tbody) {
      return;
    }

    if (headings.includes("activity id") || headings.includes("activity")) {
      renderAdminActivitiesTable(tbody);
    } else if (headings.includes("user id")) {
      renderAdminUsersTable(tbody);
    } else if (headings.includes("document id")) {
      renderAdminDocumentsTable(tbody);
    } else if (headings.includes("payment id")) {
      renderAdminPaymentsTable(tbody);
    } else if (headings.includes("loan id") && headings.includes("borrower")) {
      renderAdminLoansTable(tbody);
    }
  });

  renderAdminDetailPanel(root);
  renderAdminDashboardStats(root);
};

const syncRenderedData = (root = document) => {
  renderUserData(root);
  renderAdminData(root);
};

applyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.location.hash = "benefits";
  });

  button.addEventListener("pointerdown", () => {
    button.classList.add("is-pressed");
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    button.addEventListener(eventName, () => {
      button.classList.remove("is-pressed");
    });
  });
});

const openLoginModal = () => {
  if (!loginModal) {
    window.location.href = "login.html";
    return;
  }

  loginModal.hidden = false;
  document.body.style.overflow = "hidden";
  const firstInput = loginModal.querySelector("input");

  if (firstInput) {
    firstInput.focus();
  }
};

const closeLoginModal = () => {
  if (!loginModal) {
    return;
  }

  loginModal.hidden = true;
  document.body.style.overflow = "";
};

loginOpenButtons.forEach((button) => {
  button.addEventListener("click", openLoginModal);

  button.addEventListener("pointerdown", () => {
    button.classList.add("is-pressed");
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    button.addEventListener(eventName, () => {
      button.classList.remove("is-pressed");
    });
  });
});

loginCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLoginModal);
});

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLoginModal();
  }
});

loginForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentUser({
      email: getInputValue(form, "email"),
      contact: getInputValue(form, "contact"),
    });
    window.location.href = form.dataset.redirect || "user/dashboard.html";
  });
});

registerForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCurrentUser({
      name: getInputValue(form, "name"),
      email: getInputValue(form, "email"),
      contact: getInputValue(form, "contact"),
    });
    window.location.href = form.dataset.redirect || "user/dashboard.html";
  });
});

const clearRegisterNameFields = () => {
  registerNameFields.forEach((field) => {
    field.value = "";
    field.defaultValue = "";
  });
};

window.addEventListener("pageshow", clearRegisterNameFields);
window.addEventListener("load", () => {
  window.setTimeout(clearRegisterNameFields, 80);
});

const closeCountryPickers = (exceptMenu) => {
  document.querySelectorAll("[data-country-menu]").forEach((menu) => {
    if (menu !== exceptMenu) {
      menu.hidden = true;
    }
  });
};

countryCodeSelects.forEach((select) => {
  const phoneInput = select.closest(".phone-input")?.querySelector("[data-phone-input]");
  const phoneWrap = select.closest(".phone-input");

  if (!phoneWrap || !phoneInput) {
    return;
  }

  const pickerButton = document.createElement("button");
  const pickerMenu = document.createElement("div");
  const search = document.createElement("input");
  const list = document.createElement("div");

  pickerButton.type = "button";
  pickerButton.className = "country-picker-trigger";
  pickerButton.setAttribute("aria-haspopup", "listbox");
  pickerButton.setAttribute("aria-expanded", "false");

  pickerMenu.className = "country-picker-menu";
  pickerMenu.hidden = true;
  pickerMenu.dataset.countryMenu = "";

  search.className = "country-search";
  search.type = "search";
  search.placeholder = "Search country...";
  search.setAttribute("aria-label", "Search country");

  list.className = "country-list";
  list.setAttribute("role", "listbox");

  pickerMenu.append(search, list);
  phoneWrap.insertBefore(pickerButton, select);
  phoneWrap.append(pickerMenu);

  const getMeta = (option) => countryMeta[option.value] || [option.value.toUpperCase(), "", option.value];
  const getFlagMarkup = (option) => {
    const [, , flagCode] = getMeta(option);
    return `<span class="fi fi-${flagCode} country-flag" aria-hidden="true"></span>`;
  };

  const updateButton = () => {
    const selectedOption = select.options[select.selectedIndex];
    const [countryName, dialCode] = getMeta(selectedOption);

    pickerButton.innerHTML = `
      ${getFlagMarkup(selectedOption)}
      <span class="country-code">${dialCode}</span>
      <span class="material-symbols-outlined" aria-hidden="true">expand_more</span>
    `;
    pickerButton.setAttribute("aria-label", `${countryName} ${dialCode}`);
  };

  const renderList = (filter = "") => {
    const normalizedFilter = filter.trim().toLowerCase();
    list.innerHTML = "";

    [...select.options].forEach((option) => {
      const [countryName, dialCode] = getMeta(option);
      const haystack = `${countryName} ${dialCode} ${option.value}`.toLowerCase();

      if (normalizedFilter && !haystack.includes(normalizedFilter)) {
        return;
      }

      const item = document.createElement("button");
      item.type = "button";
      item.className = "country-option";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", option.selected ? "true" : "false");
      item.innerHTML = `
        ${getFlagMarkup(option)}
        <span class="country-name">${countryName}</span>
        <span class="country-dial">${dialCode}</span>
      `;

      item.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        pickerMenu.hidden = true;
        pickerButton.setAttribute("aria-expanded", "false");
        pickerButton.focus();
      });

      list.append(item);
    });
  };

  select.addEventListener("change", () => {
    const selectedOption = select.options[select.selectedIndex];

    if (phoneInput && selectedOption?.dataset.placeholder) {
      phoneInput.value = "";
      phoneInput.placeholder = selectedOption.dataset.placeholder;
      phoneInput.focus();
    }

    updateButton();
    renderList(search.value);
  });

  pickerButton.addEventListener("click", () => {
    const shouldOpen = pickerMenu.hidden;
    closeCountryPickers(pickerMenu);
    pickerMenu.hidden = !shouldOpen;
    pickerButton.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      search.value = "";
      renderList();
      search.focus();
    }
  });

  search.addEventListener("input", () => {
    renderList(search.value);
  });

  updateButton();
  renderList();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".phone-input")) {
    closeCountryPickers();
  }
});

bottomNavLinks.forEach((link) => {
  link.addEventListener("click", () => {
    bottomNavLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
  });
});

const setActiveNavItem = () => {
  if (!sections.length || !bottomNavLinks.length) {
    return;
  }

  const scrollPoint = window.scrollY + 140;
  let activeId = "home";

  sections.forEach((section) => {
    if (section.offsetTop <= scrollPoint) {
      activeId = section.id;
    }
  });

  bottomNavLinks.forEach((link) => {
    const targetId = link.getAttribute("href").replace("#", "");
    const isLoanLink = targetId === "benefits" && activeId === "reviews";
    link.classList.toggle("active", targetId === activeId || isLoanLink);
  });
};

window.addEventListener("scroll", setActiveNavItem, { passive: true });
window.addEventListener("load", setActiveNavItem);
window.addEventListener("storage", (event) => {
  if (event.key === userStoreKey || event.key === userSessionKey) {
    syncRenderedData();
  }
});
window.addEventListener("focus", () => syncRenderedData());
window.addEventListener("pageshow", () => syncRenderedData());

const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

userNavLinks.forEach((link) => {
  const hrefPage = link.getAttribute("href").split("/").pop();
  link.classList.toggle("active", hrefPage === currentPage);
});

demoForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    saveUserInputsFromForm(form);
    if (form.classList.contains("loan-application-form")) {
      saveLoanApplication(form);
    }
    if (isPaymentForm(form)) {
      savePaymentRecord(form);
    }
    if (isDocumentForm(form)) {
      saveDocumentRecord(form);
    }
    syncRenderedData();
    const message = form.querySelector("[data-form-message]");

    if (message) {
      message.textContent = "Saved for the current user.";
    }
  });
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-demo-form]");

  if (!form) {
    return;
  }

  if (event.defaultPrevented) {
    return;
  }

  event.preventDefault();
  saveUserInputsFromForm(form);
  if (form.classList.contains("loan-application-form")) {
    saveLoanApplication(form);
  }
  if (isPaymentForm(form)) {
    savePaymentRecord(form);
  }
  if (isDocumentForm(form)) {
    saveDocumentRecord(form);
  }
  syncRenderedData();
  const message = form.querySelector("[data-form-message]");

  if (message) {
    message.textContent = "Saved for the current user.";
  }
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-user-input], [data-user-modal-input]");

  if (!input) {
    return;
  }

  liveUpdateUserField(input);
});

// Dashboard in-page navigation
const dashboardViewLinks = document.querySelectorAll("[data-dashboard-view]");
const dashboardPanels = document.querySelectorAll("[data-dashboard-panel]");
const dashboardRemotePanel = document.querySelector("[data-dashboard-remote-panel]");
const dashboardRemoteContent = document.querySelector("[data-dashboard-remote-content]");

const activateDashboardPanel = (view, updateHash = true) => {
  dashboardPanels.forEach((panel) => {
    const isActive = panel.dataset.dashboardPanel === view;
    panel.hidden = !isActive;
    panel.classList.toggle("is-active", isActive);
  });

  dashboardViewLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.dashboardView === view);
  });

  if (updateHash) {
    history.replaceState(null, "", `#${view}`);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const loadDashboardRemote = async (link, updateHash = true) => {
  if (!dashboardRemotePanel || !dashboardRemoteContent) {
    return false;
  }

  const view = link.dataset.dashboardView;
  const remotePath = link.dataset.dashboardRemote;

  if (!view || !remotePath) {
    return false;
  }

  dashboardRemotePanel.dataset.dashboardPanel = view;
  dashboardRemoteContent.innerHTML = `<section class="panel detail-panel"><h2>Loading ${link.textContent.trim()}...</h2></section>`;
  activateDashboardPanel(view, updateHash);

  try {
    const response = await fetch(remotePath, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Unable to load ${remotePath}`);
    }

    const html = await response.text();
    const parsedPage = new DOMParser().parseFromString(html, "text/html");
    const pageContent = parsedPage.querySelector(".user-content");

    dashboardRemoteContent.innerHTML = pageContent
      ? pageContent.innerHTML
      : `<section class="panel detail-panel"><h2>${link.textContent.trim()}</h2>${parsedPage.body.innerHTML}</section>`;
    renderUserData(dashboardRemoteContent);
  } catch (error) {
    dashboardRemoteContent.innerHTML = `<section class="panel detail-panel"><h2>${link.textContent.trim()}</h2><p class="muted">This section could not load inside the dashboard. Open the page directly below.</p><a class="btn btn-primary" href="${remotePath}">Open Page</a></section>`;
  }

  return true;
};

const setDashboardPanel = (view, updateHash = true) => {
  if (!dashboardPanels.length) {
    return;
  }

  const remoteLink = [...dashboardViewLinks].find((link) => link.dataset.dashboardView === view && link.dataset.dashboardRemote);

  if (remoteLink) {
    loadDashboardRemote(remoteLink, updateHash);
    return;
  }

  const nextView = [...dashboardPanels].some((panel) => panel.dataset.dashboardPanel === view) ? view : "dashboard";
  activateDashboardPanel(nextView, updateHash);
};

dashboardViewLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const view = link.dataset.dashboardView;
    if (!view || !dashboardPanels.length) {
      return;
    }

    event.preventDefault();
    if (link.dataset.dashboardRemote) {
      loadDashboardRemote(link);
      return;
    }

    setDashboardPanel(view);
  });
});

if (dashboardPanels.length) {
  const initialView = window.location.hash.replace("#", "") || "dashboard";
  setDashboardPanel(initialView, false);

  window.addEventListener("hashchange", () => {
    setDashboardPanel(window.location.hash.replace("#", "") || "dashboard", false);
  });
}

installAppIcon();
renderUserData();
renderAdminData();
loadUserStoreFromServer();

document.querySelectorAll(".sign-out-link, a[href$='logout.html']").forEach((link) => {
  link.addEventListener("click", () => {
    localStorage.removeItem(userSessionKey);
  });
});

document.addEventListener("click", (event) => {
  if (event.defaultPrevented) {
    return;
  }

  const target = event.target.closest(
    ".user-content .btn-secondary, .user-content .action-tile, .user-content button.btn, .user-content button[type='button'], .user-content a.btn"
  );

  if (
    !target ||
    target.closest("[data-user-modal]") ||
    (target.closest("form") && target.type !== "button") ||
    target.dataset.dashboardView ||
    target.dataset.dashboardRemote ||
    target.getAttribute("href")?.startsWith("#") && target.dataset.dashboardView
  ) {
    return;
  }

  const href = target.getAttribute("href") || "";
  const isPageAction = href.endsWith(".html") || href.startsWith("#") || target.tagName === "BUTTON";

  if (!isPageAction) {
    return;
  }

  event.preventDefault();
  openUserModal(target);
});

document.addEventListener("click", (event) => {
  const statusButton = event.target.closest("[data-admin-loan-status]");

  if (!statusButton) {
    return;
  }

  const loanId = statusButton.dataset.loanId;
  const status = statusButton.dataset.adminLoanStatus;

  if (!loanId || !status) {
    return;
  }

  updateApplicationStatus(loanId, status);
  syncRenderedData();
  openAdminModal(statusButton);
  showAdminToast(`Loan ${loanId} marked ${status}.`);
});

// Loan status timeline filter
const statusFilterButtons = document.querySelectorAll("[data-status-filter]");
const statusTimelineItems = document.querySelectorAll("[data-status-list] [data-status-kind]");

const setStatusFilter = (filter) => {
  if (!statusTimelineItems.length) {
    return;
  }

  statusTimelineItems.forEach((item) => {
    const kind = item.dataset.statusKind;
    const shouldShow = filter === "all" || kind === filter;
    item.classList.toggle("is-hidden", !shouldShow);
  });

  statusFilterButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.statusFilter === filter);
  });
};

statusFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setStatusFilter(button.dataset.statusFilter || "all");
  });
});

// Admin demo interactions
const adminActionButtons = document.querySelectorAll(".admin-page [data-action]");
const adminSearchFields = document.querySelectorAll(".admin-page [data-search]");
const adminFilterGroups = document.querySelectorAll(".admin-page [data-filter-tabs]");
const adminSidebarItems = [
  ["Dashboard", "dashboard.html"],
  ["Users", "user management/users.html"],
  ["Borrower Verification", "barrower verification page/kyc-verification.html"],
  ["Loan Applications", "loan application page/loan-applications.html"],
  ["Approved Loans", "loan application page/approved-loans.html"],
  ["Rejected Loans", "loan application page/loan-rejected.html"],
  ["Loan Plans", "loan plans management/loan-plans.html"],
  ["Payments", "Payments Management/payments.html"],
  ["Payment History", "Payments Management/payment-history.html"],
  ["Overdue Accounts", "Payments Management/overdue-payments.html"],
  ["Documents", "barrower verification page/documents.html"],
  ["Reports", "reports and analytics/reports.html"],
  ["Analytics", "analytics.html"],
  ["Activity Logs", "activity-logs.html"],
  ["Statistics", "statistics.html"],
  ["Logout", "logout.html"],
];

const showAdminToast = (message) => {
  let toast = document.querySelector(".admin-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "admin-toast";
    document.body.append(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
};

document.addEventListener("click", (event) => {
  const button = event.target.closest(".admin-page [data-action]");

  if (!button) {
    return;
  }

  event.preventDefault();
  openAdminModal(button);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest('.admin-page button[type="button"]');

  if (
    !button ||
    button.dataset.action ||
    button.dataset.adminLoanStatus ||
    button.closest("[data-admin-modal]") ||
    button.closest(".country-picker-menu")
  ) {
    return;
  }

  event.preventDefault();
  openAdminModal(button);
});

adminSearchFields.forEach((input) => {
  const target = document.querySelector(input.dataset.search);

  input.addEventListener("input", () => {
    const value = input.value.trim().toLowerCase();

    target?.querySelectorAll("tbody tr, .list li").forEach((row) => {
      row.style.display = row.textContent.toLowerCase().includes(value) ? "" : "none";
    });
  });
});

document.querySelectorAll(".admin-page .nav").forEach((nav) => {
  const depth = Number(document.body.dataset.adminDepth || 0);
  const prefix = depth > 0 ? `${"../".repeat(depth)}` : "";

  nav.innerHTML = adminSidebarItems
    .map(([label, href]) => `<a href="${prefix}${href}">${label}</a>`)
    .join("");
});

document.querySelectorAll(".admin-page .nav a").forEach((link) => {
  const pageName = document.body.dataset.page;
  const linkName = link.textContent.trim().toLowerCase();
  const isActive = pageName === linkName || linkName.includes(pageName) || pageName.includes(linkName);
  link.classList.toggle("active", isActive);
});

document.querySelectorAll(".admin-page table").forEach((table) => {
  const headings = [...table.querySelectorAll("thead th")].map((heading) => heading.textContent.trim());

  table.querySelectorAll("tbody tr").forEach((row) => {
    row.querySelectorAll("td").forEach((cell, index) => {
      cell.dataset.label = headings[index] || "";
    });
  });
});

adminFilterGroups.forEach((group) => {
  const list = group.parentElement?.querySelector("[data-filter-list]");
  const buttons = group.querySelectorAll("[data-filter-button]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filterButton || "all";

      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      list?.querySelectorAll("[data-filter-item]").forEach((item) => {
        item.classList.toggle("is-hidden", filter !== "all" && item.dataset.filterItem !== filter);
      });
    });
  });
});
