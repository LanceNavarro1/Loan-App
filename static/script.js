const applyButtons = document.querySelectorAll("[data-apply-button]");
const bottomNavLinks = document.querySelectorAll(".bottom-nav a[href^='#']");
const sections = [...document.querySelectorAll("main section[id], main[id], footer[id]")];
const userNavLinks = document.querySelectorAll("[data-user-nav] a");
const demoForms = document.querySelectorAll("[data-demo-form]");
const loginModal = document.querySelector("[data-login-modal]");
const loginOpenButtons = document.querySelectorAll("[data-login-open]");
const loginCloseButtons = document.querySelectorAll("[data-login-close]");
const loginForms = document.querySelectorAll("[data-login-form]");
const adminLoginForms = document.querySelectorAll("[data-admin-login-form]");
const registerForms = document.querySelectorAll("[data-register-form]");
const registerNameFields = document.querySelectorAll("[data-clear-register-name]");
const countryCodeSelects = document.querySelectorAll("[data-country-code]");
const userSessionKey = "easyLoan.currentUserEmail";
const userStoreKey = "easyLoan.users";
const pendingLoanEditKey = "easyLoan.pendingLoanEditId";
const loanAgreementAcceptedKey = "easyLoan.loanAgreementAccepted";
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

const toastIconFor = (type = "info") =>
  ({
    success: "check_circle",
    error: "error",
    warning: "warning",
    info: "info",
  }[type] || "info");

const ensureToastRegion = () => {
  let region = document.querySelector("[data-global-toast-region]");

  if (region) {
    return region;
  }

  region = document.createElement("div");
  region.className = "global-toast-region";
  region.dataset.globalToastRegion = "";
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "false");
  document.body.append(region);
  return region;
};

const dismissToast = (toast) => {
  if (!toast) {
    return;
  }

  window.clearTimeout(Number(toast.dataset.dismissTimer || 0));
  toast.classList.remove("show");
  window.setTimeout(() => toast.remove(), 220);
};

const showToast = (message, options = {}) => {
  const text = String(message || "").trim();

  if (!text) {
    return null;
  }

  const type = ["success", "error", "warning", "info"].includes(options.type) ? options.type : "info";
  const region = ensureToastRegion();
  const toast = document.createElement("article");
  const duration = Number(options.duration ?? 3200);

  toast.className = `global-toast global-toast-${type}`;
  toast.dataset.toastType = type;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.innerHTML = `
    <span class="material-symbols-outlined global-toast-icon" aria-hidden="true">${toastIconFor(type)}</span>
    <div class="global-toast-copy">
      ${options.title ? `<strong>${escapeHtml(options.title)}</strong>` : ""}
      <p>${escapeHtml(text)}</p>
    </div>
    <button class="global-toast-close" type="button" aria-label="Dismiss notification">
      <span class="material-symbols-outlined" aria-hidden="true">close</span>
    </button>
  `;

  toast.querySelector(".global-toast-close")?.addEventListener("click", () => dismissToast(toast));
  region.append(toast);

  [...region.querySelectorAll(".global-toast")].slice(0, -4).forEach(dismissToast);
  window.requestAnimationFrame(() => toast.classList.add("show"));

  if (duration > 0) {
    toast.dataset.dismissTimer = String(window.setTimeout(() => dismissToast(toast), duration));
  }

  return toast;
};

window.showToast = showToast;

const globalLoadingState = {
  requests: new Map(),
  nextId: 0,
  shownAt: 0,
  hideTimer: null,
};

const ensureGlobalLoader = () => {
  let loader = document.querySelector("[data-global-loader]");

  if (loader) {
    return loader;
  }

  loader = document.createElement("div");
  loader.className = "global-loader";
  loader.dataset.globalLoader = "";
  loader.hidden = true;
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-live", "polite");
  loader.setAttribute("aria-label", "Loading");
  loader.innerHTML = `
    <div class="global-loader-backdrop"></div>
    <section class="global-loader-card" aria-atomic="true">
      <div class="global-loader-mark" aria-hidden="true">
        <span class="global-loader-ring"></span>
        <span class="global-loader-ring secondary"></span>
        <span class="material-symbols-outlined global-loader-symbol">account_balance</span>
      </div>
      <div class="global-loader-copy">
        <strong data-global-loader-title>Loading</strong>
        <p data-global-loader-message>Please wait while Easy Loan prepares your request.</p>
      </div>
    </section>
  `;
  document.body.append(loader);
  return loader;
};

const updateGlobalLoaderCopy = () => {
  const loader = ensureGlobalLoader();
  const requests = [...globalLoadingState.requests.values()];
  const latestRequest = requests[requests.length - 1] || {};

  loader.querySelector("[data-global-loader-title]").textContent = latestRequest.title || "Loading";
  loader.querySelector("[data-global-loader-message]").textContent =
    latestRequest.message || "Please wait while Easy Loan prepares your request.";
};

const showGlobalLoading = (message = "Please wait while Easy Loan prepares your request.", options = {}) => {
  const loader = ensureGlobalLoader();
  const id = `loader-${++globalLoadingState.nextId}`;
  const token = { id };

  window.clearTimeout(globalLoadingState.hideTimer);
  globalLoadingState.requests.set(id, {
    title: options.title || "Loading",
    message,
  });
  updateGlobalLoaderCopy();

  if (loader.hidden) {
    loader.hidden = false;
    globalLoadingState.shownAt = performance.now();
    document.body.classList.add("global-loading-active");
    document.body.setAttribute("aria-busy", "true");
    window.requestAnimationFrame(() => loader.classList.add("show"));
  }

  return token;
};

const hideGlobalLoading = (token, options = {}) => {
  const loader = document.querySelector("[data-global-loader]");

  if (!loader) {
    return;
  }

  if (token?.id) {
    globalLoadingState.requests.delete(token.id);
  } else {
    globalLoadingState.requests.clear();
  }

  if (globalLoadingState.requests.size) {
    updateGlobalLoaderCopy();
    return;
  }

  const minVisible = Number(options.minVisible ?? 1200);
  const elapsed = performance.now() - globalLoadingState.shownAt;
  const delay = Math.max(0, minVisible - elapsed);

  window.clearTimeout(globalLoadingState.hideTimer);
  globalLoadingState.hideTimer = window.setTimeout(() => {
    loader.classList.remove("show");
    document.body.classList.remove("global-loading-active");
    document.body.removeAttribute("aria-busy");
    window.setTimeout(() => {
      if (!globalLoadingState.requests.size) {
        loader.hidden = true;
      }
    }, 220);
  }, delay);
};

window.showGlobalLoading = showGlobalLoading;
window.hideGlobalLoading = hideGlobalLoading;

const showBriefGlobalLoading = (message, options = {}) => {
  const token = showGlobalLoading(message, options);
  window.setTimeout(() => hideGlobalLoading(token), Number(options.duration ?? 120));
  return token;
};

window.showBriefGlobalLoading = showBriefGlobalLoading;

const setButtonLoading = (button, isLoading, label = "Processing") => {
  if (!button) {
    return;
  }

  if (isLoading) {
    if (!button.dataset.loadingOriginalHtml) {
      button.dataset.loadingOriginalHtml = button.innerHTML;
      button.dataset.loadingWasDisabled = String(button.disabled);
    }

    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `<span class="button-loader" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`;
    return;
  }

  if (button.dataset.loadingOriginalHtml) {
    button.innerHTML = button.dataset.loadingOriginalHtml;
    delete button.dataset.loadingOriginalHtml;
  }

  button.disabled = button.dataset.loadingWasDisabled === "true";
  delete button.dataset.loadingWasDisabled;
  button.classList.remove("is-loading");
  button.removeAttribute("aria-busy");
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

const shouldKeepUserValue = (value) => {
  if (Array.isArray(value)) {
    return true;
  }

  if (value && typeof value === "object") {
    return true;
  }

  return String(value || "").trim();
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
    ...Object.fromEntries(Object.entries(nextUser).filter(([, value]) => shouldKeepUserValue(value))),
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

const currentGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 18) {
    return "Good Afternoon";
  }

  return "Good Evening";
};

const userGreetingText = (name) => {
  const firstName = name?.trim().split(/\s+/)[0] || "there";
  return `${currentGreeting()}, ${firstName}`;
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

const applyUserProfileImages = (user, root = document) => {
  const imageUrl = user?.profilePicture || "";

  root.querySelectorAll("[data-user-profile-image]").forEach((image) => {
    const uploadTarget = image.closest(".member-avatar-upload, .profile-picture-upload");

    image.hidden = !imageUrl;

    if (imageUrl) {
      image.src = imageUrl;
    } else {
      image.removeAttribute("src");
    }

    if (uploadTarget) {
      uploadTarget.dataset.profilePictureReady = imageUrl ? "true" : "false";
    }
  });

  root.querySelectorAll("[data-profile-avatar-fallback]").forEach((fallback) => {
    fallback.hidden = Boolean(imageUrl);
  });
};

const ensureProfilePictureViewer = () => {
  let viewer = document.querySelector("[data-profile-picture-viewer]");

  if (viewer) {
    return viewer;
  }

  viewer = document.createElement("div");
  viewer.className = "profile-picture-viewer";
  viewer.dataset.profilePictureViewer = "";
  viewer.hidden = true;
  viewer.innerHTML = `
    <section class="profile-picture-viewer-card" role="dialog" aria-modal="true" aria-label="Profile picture preview">
      <button class="icon-button profile-picture-viewer-close" type="button" data-profile-picture-viewer-close aria-label="Close profile picture"><span class="material-symbols-outlined">close</span></button>
      <img data-profile-picture-viewer-image alt="Profile picture preview">
    </section>
  `;
  document.body.append(viewer);
  return viewer;
};

const openProfilePictureViewer = (imageUrl) => {
  if (!imageUrl) {
    return;
  }

  const viewer = ensureProfilePictureViewer();
  const image = viewer.querySelector("[data-profile-picture-viewer-image]");

  image.src = imageUrl;
  viewer.hidden = false;
  document.body.classList.add("modal-open");
};

const closeProfilePictureViewer = () => {
  document.querySelectorAll("[data-profile-picture-viewer]").forEach((viewer) => {
    viewer.hidden = true;
    viewer.querySelector("[data-profile-picture-viewer-image]")?.removeAttribute("src");
  });
  document.body.classList.remove("modal-open");
};

const hydrateUserData = (root = document) => {
  const user = getCurrentUser();

  root.querySelectorAll("[data-user-field]").forEach((element) => {
    const value = userFieldValue(user, element.dataset.userField);
    element.textContent = value || element.dataset.userEmpty || element.textContent;
  });

  root.querySelectorAll("[data-user-greeting]").forEach((element) => {
    element.textContent = userGreetingText(user?.name);
  });

  root.querySelectorAll("[data-user-input]").forEach((input) => {
    populateUserInput(input, user);
  });

  applyUserProfileImages(user, root);
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
    element.textContent = userGreetingText(user?.name);
  });

  applyUserProfileImages(user, root);
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
      element.textContent = userGreetingText(value);
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
    const previews = JSON.parse(input.dataset.filePreviews || "[]");

    if (!files.length) {
      documents.push({ type: label, fileName: "Not uploaded", status: "Missing" });
      return;
    }

    files.forEach((file, index) => {
      const preview = previews[index] || {};
      documents.push({
        type: label,
        fileName: file.name,
        status: "For Review",
        previewDataUrl: preview.dataUrl || "",
        previewMime: preview.mime || file.type || "",
      });
    });
  });

  return documents;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) {
      resolve({ name: file?.name || "", mime: file?.type || "", dataUrl: "" });
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve({ name: file.name, mime: file.type, dataUrl: reader.result || "" }));
    reader.addEventListener("error", () => resolve({ name: file.name, mime: file.type, dataUrl: "" }));
    reader.readAsDataURL(file);
  });

const captureFormFilePreviews = async (form) => {
  await Promise.all(
    [...form.querySelectorAll('input[type="file"]')].map(async (input) => {
      const previews = await Promise.all([...input.files].map(readFileAsDataUrl));
      input.dataset.filePreviews = JSON.stringify(previews);
    })
  );
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

const hasUploadedFiles = (form) => [...form.querySelectorAll('input[type="file"]')].some((input) => input.files.length);

const parseMoneyValue = (value) => {
  const amount = Number(String(value || "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatNumberWithCommas = (value) => {
  const rawValue = String(value || "").replace(/[^\d]/g, "");

  if (!rawValue) {
    return "";
  }

  return new Intl.NumberFormat("en-US").format(Number(rawValue));
};

const formatCustomLoanTerm = (years, months) => {
  const yearCount = Number(years || 0);
  const monthCount = Number(months || 0);
  const parts = [];

  if (yearCount > 0) {
    parts.push(`${yearCount} year${yearCount === 1 ? "" : "s"}`);
  }

  if (monthCount > 0) {
    parts.push(`${monthCount} month${monthCount === 1 ? "" : "s"}`);
  }

  return parts.join(" and ");
};

const getLoanTermValue = (form) => {
  const selectedTerm = getInputValue(form, "loanTerm");

  if (selectedTerm !== "Other") {
    return selectedTerm || "Not selected";
  }

  return formatCustomLoanTerm(getInputValue(form, "customLoanYears"), getInputValue(form, "customLoanMonths")) || "Other";
};

const getLoanPurposeValue = (form) => {
  const selectedPurpose = getInputValue(form, "loanPurpose");

  if (selectedPurpose !== "Other") {
    return selectedPurpose || "Personal";
  }

  return getInputValue(form, "customLoanPurpose") || "Other";
};

const applySavedLoanTermToForm = (form, term) => {
  const select = form.querySelector("[data-loan-term-select]");

  if (!select || !term) {
    return false;
  }

  const existingOption = [...select.options].find((option) => option.value === term);

  if (existingOption) {
    select.value = term;
    return true;
  }

  const yearMatch = String(term).match(/(\d+)\s*year/i);
  const monthMatch = String(term).match(/(\d+)\s*month/i);

  select.value = "Other";
  const yearsInput = form.querySelector('[name="customLoanYears"]');
  const monthsInput = form.querySelector('[name="customLoanMonths"]');

  if (yearsInput) {
    yearsInput.value = yearMatch?.[1] || "0";
  }

  if (monthsInput) {
    monthsInput.value = monthMatch?.[1] || "0";
  }

  return true;
};

const applySavedLoanPurposeToForm = (form, purpose) => {
  const select = form.querySelector("[data-loan-purpose-select]");

  if (!select || !purpose) {
    return false;
  }

  const existingOption = [...select.options].find((option) => option.value === purpose);

  if (existingOption) {
    select.value = purpose;
    return true;
  }

  select.value = "Other";
  const customInput = form.querySelector('[name="customLoanPurpose"]');

  if (customInput) {
    customInput.value = purpose;
  }

  return true;
};

const saveLoanApplication = (form) => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const editingLoanId = form.dataset.editingLoanId;
  const applications = getUserApplications();
  const previousApplication = applications.find((application) => application.id === editingLoanId);
  const amount = String(parseMoneyValue(getInputValue(form, "loanAmount")));
  const timestamp = Date.now();
  const formData = collectFormPayload(form);
  const documents = hasUploadedFiles(form) ? collectUploadedDocuments(form) : previousApplication?.documents || collectUploadedDocuments(form);
  const application = {
    id: previousApplication?.id || `APP-${String(timestamp).slice(-6)}`,
    amount,
    purpose: getLoanPurposeValue(form),
    term: getLoanTermValue(form),
    schedule: getInputValue(form, "paymentSchedule") || "Not selected",
    status: previousApplication?.status || "Pending",
    formData,
    documents,
    submittedAt: previousApplication?.submittedAt || new Date(timestamp).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    updatedAt: editingLoanId
      ? new Date(timestamp).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "",
  };

  const nextApplications = editingLoanId
    ? applications.map((item) => (item.id === editingLoanId ? application : item))
    : [application, ...applications];

  saveCurrentUser({
    email: currentUser.email,
    applications: nextApplications,
  });

  delete form.dataset.editingLoanId;
  form.querySelectorAll('input[type="file"][data-loan-file-required="true"]').forEach((input) => {
    input.required = true;
    delete input.dataset.loanFileRequired;
  });
  const submitButton = form.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.textContent = "Submit Application";
  }
};

const savePaymentRecord = (form) => {
  const user = getCurrentUser();

  if (!user) {
    return null;
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

  return payment;
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
            <td><div class="loan-editor-actions compact"><a class="btn-secondary" href="loan-status.html">Track</a><button class="btn-secondary" type="button" data-loan-edit="${escapeHtml(application.id)}"><span class="material-symbols-outlined">edit</span>Edit</button><button class="btn-secondary danger" type="button" data-loan-delete="${escapeHtml(application.id)}"><span class="material-symbols-outlined">delete</span>Delete</button></div></td>
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
            <div class="loan-editor-actions"><button class="btn-secondary" type="button" data-loan-edit="${escapeHtml(application.id)}"><span class="material-symbols-outlined">edit</span>Edit</button><button class="btn-secondary danger" type="button" data-loan-delete="${escapeHtml(application.id)}"><span class="material-symbols-outlined">delete</span>Delete</button></div>
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

const renderUserLoanEditor = (root = document) => {
  const applications = getUserApplications();

  root.querySelectorAll("[data-user-loan-editor-list]").forEach((list) => {
    if (!applications.length) {
      list.innerHTML = `<article class="loan-row-card"><div><strong>No loan applications yet</strong><p class="muted">Submitted loan details will appear here.</p></div></article>`;
      return;
    }

    list.innerHTML = applications
      .map(
        (application) => `
          <article class="loan-row-card">
            <div>
              <strong>${escapeHtml(application.purpose || "Loan")} Loan</strong>
              <p class="muted">ID ${escapeHtml(application.id)}. Submitted ${escapeHtml(application.submittedAt || "No date saved")}.</p>
            </div>
            <div><strong>${formatPeso(application.amount)}</strong><span class="status ${userStatusClass(application.status)}">${escapeHtml(application.status || "Pending")}</span></div>
            <div class="loan-editor-actions">
              <button class="btn-secondary" type="button" data-loan-edit="${escapeHtml(application.id)}"><span class="material-symbols-outlined">edit</span>Edit</button>
              <button class="btn-secondary danger" type="button" data-loan-delete="${escapeHtml(application.id)}"><span class="material-symbols-outlined">delete</span>Delete</button>
            </div>
          </article>
        `
      )
      .join("");
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

  root.querySelectorAll("[data-user-payment-hero]").forEach((hero) => {
    const status = latestApplication?.status || "No Active Loan";
    const chip = hero.querySelector(".loan-status-chip span:last-child");
    const meta = hero.querySelector(".loan-status-meta");

    if (chip) {
      chip.textContent = latestApplication ? `${latestApplication.purpose || "Loan"} Loan` : "No Active Loan";
    }

    if (meta) {
      meta.innerHTML = `
        <div><span>Total Loan Amount</span><strong>${formatPeso(totalAmount)}</strong></div>
        <div><span>Remaining Balance</span><strong>${formatPeso(remaining)}</strong></div>
        <div><span>Submitted Payments</span><strong>${payments.length}</strong></div>
        <div><span>Status</span><strong>${escapeHtml(status)}</strong></div>
      `;
    }
  });

  root.querySelectorAll("[data-user-payment-options]").forEach((select) => {
    select.innerHTML = applications.length
      ? applications.map((application) => `<option>${escapeHtml(application.id)} - ${escapeHtml(application.purpose || "Loan")}</option>`).join("")
      : `<option>No submitted loans yet</option>`;
  });

  root.querySelectorAll("[data-user-payment-loan-cards]").forEach((grid) => {
    const form = grid.closest("form");
    const select = form?.querySelector("[data-user-payment-options]");

    if (!applications.length) {
      grid.innerHTML = `<button class="payment-choice-card is-selected" type="button"><span class="material-symbols-outlined">account_balance_wallet</span><strong>No loan selected</strong><small>Submit a loan first</small></button>`;
      return;
    }

    grid.innerHTML = applications
      .map((application, index) => {
        const optionValue = `${application.id} - ${application.purpose || "Loan"}`;
        return `
          <button class="payment-choice-card ${index === 0 ? "is-selected" : ""}" type="button" data-payment-loan-value="${escapeHtml(optionValue)}">
            <span class="material-symbols-outlined">request_quote</span>
            <strong>${escapeHtml(application.purpose || "Loan")} Loan</strong>
            <small>${escapeHtml(application.id)} · ${formatPeso(application.amount)}</small>
          </button>
        `;
      })
      .join("");

    if (select && !select.value) {
      select.selectedIndex = 0;
    }
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
      tbody.innerHTML = `<tr><td colspan="6">No payments submitted yet.</td></tr>`;
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
            <td>
              <div class="loan-editor-actions compact">
                <button class="btn-secondary" type="button" data-payment-receipt-download="${escapeHtml(payment.id)}"><span class="material-symbols-outlined">download</span>Download Receipt</button>
                <button class="btn-secondary danger" type="button" data-payment-delete="${escapeHtml(payment.id)}"><span class="material-symbols-outlined">delete</span>Delete</button>
              </div>
            </td>
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
              (payment) => `<div class="payment-row"><div><strong>${escapeHtml(payment.submittedAt)}</strong><small>${escapeHtml(payment.reference || payment.receipt)}</small></div><div><span class="material-symbols-outlined">payments</span>${escapeHtml(payment.method)}</div><strong>${formatPeso(payment.amount)}</strong><span class="status pending">${escapeHtml(payment.status)}</span><button class="btn-secondary danger" type="button" data-payment-delete="${escapeHtml(payment.id)}"><span class="material-symbols-outlined">delete</span>Delete</button></div>`
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

const loanTermMonths = (term) => {
  const match = String(term || "").match(/\d+/);
  return match ? Math.max(Number(match[0]), 1) : 6;
};

const paymentsForApplication = (application, applications, payments) => {
  if (!application) {
    return [];
  }

  return payments.filter((payment) => {
    const loanId = String(payment.loanId || "");
    return loanId.includes(application.id) || (applications.length === 1 && !loanId);
  });
};

const renderUserRemainingBalance = (root = document) => {
  const applications = getUserApplications();
  const payments = getUserPayments();
  const latestApplication = applications[0];
  const totalAmount = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const paidAmount = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const remaining = Math.max(totalAmount - paidAmount, 0);
  const paidPercent = totalAmount ? Math.min(Math.round((paidAmount / totalAmount) * 100), 100) : 0;

  root.querySelectorAll("[data-user-remaining-summary]").forEach((section) => {
    section.querySelector("h2").textContent = applications.length ? `${applications.length} saved loan balance${applications.length === 1 ? "" : "s"}` : "No saved loan balance yet";
    section.querySelector("p").textContent = applications.length
      ? "This balance is calculated from your saved loan applications minus submitted payment records."
      : "Submit a loan application to create a balance record.";
    section.querySelector(".progress-track span").style.width = `${paidPercent}%`;
    section.querySelector(".remaining-balance-total strong").textContent = formatPeso(remaining);
    section.querySelector(".remaining-balance-total small").textContent = `${paidPercent}% paid`;
  });

  root.querySelectorAll("[data-user-remaining-metrics]").forEach((grid) => {
    const cards = grid.querySelectorAll(".metric-card");

    if (cards[0]) {
      cards[0].querySelector("strong").textContent = formatPeso(totalAmount);
      cards[0].querySelector("small").textContent = `${applications.length} submitted loan${applications.length === 1 ? "" : "s"}`;
    }

    if (cards[1]) {
      cards[1].querySelector("strong").textContent = formatPeso(paidAmount);
      cards[1].querySelector("small").textContent = `${payments.length} payment record${payments.length === 1 ? "" : "s"}`;
    }

    if (cards[2]) {
      cards[2].querySelector("strong").textContent = formatPeso(remaining);
      cards[2].querySelector("small").textContent = `${paidPercent}% of balance paid`;
    }
  });

  root.querySelectorAll("[data-user-remaining-latest]").forEach((list) => {
    if (!latestApplication) {
      list.innerHTML = `
        <div class="profile-row"><span>Loan ID</span><strong>No loan yet</strong></div>
        <div class="profile-row"><span>Amount</span><strong>${formatPeso(0)}</strong></div>
        <div class="profile-row"><span>Paid</span><strong>${formatPeso(0)}</strong></div>
        <div class="profile-row"><span>Remaining</span><strong>${formatPeso(0)}</strong></div>
      `;
      return;
    }

    const latestPayments = paymentsForApplication(latestApplication, applications, payments);
    const latestPaid = latestPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const latestAmount = Number(latestApplication.amount || 0);
    const latestRemaining = Math.max(latestAmount - latestPaid, 0);
    const monthlyDue = Math.round(latestAmount / loanTermMonths(latestApplication.term)) || 0;

    list.innerHTML = `
      <div class="profile-row"><span>Loan ID</span><strong>${escapeHtml(latestApplication.id)}</strong></div>
      <div class="profile-row"><span>Loan Type</span><strong>${escapeHtml(latestApplication.purpose || "Loan")}</strong></div>
      <div class="profile-row"><span>Total Amount</span><strong>${formatPeso(latestAmount)}</strong></div>
      <div class="profile-row"><span>Total Paid</span><strong>${formatPeso(latestPaid)}</strong></div>
      <div class="profile-row"><span>Remaining</span><strong>${formatPeso(latestRemaining)}</strong></div>
      <div class="profile-row"><span>Estimated Monthly Due</span><strong>${formatPeso(monthlyDue)}</strong></div>
      <div class="profile-row"><span>Status</span><strong><span class="status ${userStatusClass(latestApplication.status)}">${escapeHtml(latestApplication.status || "Pending")}</span></strong></div>
    `;
  });

  root.querySelectorAll("[data-user-remaining-table]").forEach((tbody) => {
    if (!applications.length) {
      tbody.innerHTML = `<tr><td colspan="7">No loan applications yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = applications
      .map((application) => {
        const linkedPayments = paymentsForApplication(application, applications, payments);
        const applicationAmount = Number(application.amount || 0);
        const applicationPaid = linkedPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
        const applicationRemaining = Math.max(applicationAmount - applicationPaid, 0);
        const monthlyDue = Math.round(applicationAmount / loanTermMonths(application.term)) || 0;

        return `
          <tr>
            <td>${escapeHtml(application.id)}</td>
            <td>${escapeHtml(application.purpose || "Loan")}</td>
            <td>${formatPeso(applicationAmount)}</td>
            <td>${formatPeso(applicationPaid)}</td>
            <td>${formatPeso(applicationRemaining)}</td>
            <td>${formatPeso(monthlyDue)}</td>
            <td><span class="status ${userStatusClass(application.status)}">${escapeHtml(application.status || "Pending")}</span></td>
          </tr>
        `;
      })
      .join("");
  });
};

const renderUserDocuments = (root = document) => {
  const documents = getUserDocuments();
  const applications = getUserApplications();
  const applicationProofs = applications.map((application) => ({
    type: "Loan Application Form",
    fileName: `${application.id}-loan-application-form.pdf`,
    status: application.status || "Pending",
    uploadedAt: application.submittedAt || "Submitted application",
    applicationId: application.id,
    isApplicationProof: true,
  }));
  const applicationDocuments = applications.flatMap((application) => (application.documents || []).map((document) => ({
    ...document,
    applicationId: application.id,
  })));
  const allDocuments = [...applicationProofs, ...documents, ...applicationDocuments.map((document) => ({
    type: document.type,
    fileName: document.fileName,
    status: document.status,
    uploadedAt: "From loan form",
    applicationId: document.applicationId,
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

  root.querySelectorAll("[data-application-proof-list]").forEach((list) => {
    if (!applicationProofs.length) {
      list.innerHTML = `
        <article class="document-card documents-proof-card">
          <span class="material-symbols-outlined icon-badge blue">description</span>
          <div>
            <h2>No submitted applications yet</h2>
            <p class="muted">Application proofs appear here after you submit a loan.</p>
          </div>
        </article>
      `;
      return;
    }

    list.innerHTML = applicationProofs
      .map(
        (proof) => `
          <article class="document-card documents-proof-card">
            <span class="material-symbols-outlined icon-badge green">description</span>
            <div class="documents-proof-copy">
              <div>
                <h2>${escapeHtml(proof.applicationId)}</h2>
                <p class="muted">Loan Application Form - ${escapeHtml(proof.uploadedAt)}</p>
              </div>
              <div class="documents-proof-meta">
                <span class="status ${userStatusClass(proof.status)}">${escapeHtml(proof.status)}</span>
                <button class="btn-secondary compact" type="button" data-application-proof-download="${escapeHtml(proof.applicationId)}">Download Proof</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
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
    if (!applicationProofs.length) {
      tbody.innerHTML = `<tr><td colspan="5">No loan application forms yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = applicationProofs
      .map(
        (proof) => `
          <tr>
            <td>${escapeHtml(proof.type)}</td>
            <td>${escapeHtml(proof.fileName)}</td>
            <td><span class="status ${userStatusClass(proof.status)}">${escapeHtml(proof.status)}</span></td>
            <td>${escapeHtml(proof.uploadedAt)}</td>
            <td><button class="btn-secondary" type="button" data-application-proof-download="${escapeHtml(proof.applicationId)}">Download PDF</button></td>
          </tr>
        `
      )
      .join("");
  });
};

const populateLoanApplicationForm = (application, targetForm = null) => {
  const form = targetForm || document.querySelector(".loan-application-form");

  if (!form || !application) {
    return;
  }

  const formData = application.formData || {};
  form.dataset.editingLoanId = application.id;

  form.querySelectorAll("input, select, textarea").forEach((input) => {
    if (input.type === "file") {
      if (input.required) {
        input.dataset.loanFileRequired = "true";
        input.required = false;
      }
      return;
    }

    if (input.type === "checkbox") {
      input.checked = true;
      return;
    }

    const key = input.name || input.dataset.userInput || fieldLabelFor(input);
    const value = formData[key] ?? formData[fieldLabelFor(input)];

    if (value === undefined) {
      return;
    }

    input.value = input.matches("[data-money-input]") ? formatNumberWithCommas(value) : value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

  applySavedLoanTermToForm(form, application.term);
  applySavedLoanPurposeToForm(form, application.purpose);
  syncCustomLoanTermFields(form.closest("[data-loan-edit-modal]") || document);
  syncCustomLoanPurposeFields(form.closest("[data-loan-edit-modal]") || document);
  updateLoanReviewPreview(form);

  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector("[data-form-message]");

  if (submitButton) {
    submitButton.textContent = "Update Application";
  }

  if (message) {
    message.textContent = `Editing ${application.id}. Save to update this loan.`;
  }

  form.scrollIntoView({ behavior: "smooth", block: "start" });
};

const applyLoanPagePath = () => (window.location.pathname.includes("/loans/") ? "apply-loan.html" : "loans/apply-loan.html");

const loanEditModalFormMarkup = () => `
  <div class="application-progress" aria-label="Application progress">
    <button class="is-active" type="button" data-loan-step="details"><span>1</span>Loan Details</button>
    <button type="button" data-loan-step="review"><span>2</span>Review</button>
    <button type="button" data-loan-step="submit"><span>3</span>Save</button>
  </div>
  <form class="loan-application-form loan-edit-modal-form" data-demo-form data-agreement-accepted="true">
    <section class="form-section" data-loan-step-panel="details">
      <h2>Personal Information</h2>
      <div class="form-grid two">
        <label class="field"><span>Full Name</span><input type="text" name="name" data-user-input="name" placeholder="Full name" required></label>
        <label class="field"><span>Email Address</span><input type="email" name="email" data-user-input="email" placeholder="you@gmail.com" required></label>
        <label class="field"><span>Phone Number</span><input type="tel" name="contact" data-user-input="contact" placeholder="+63 912 345 6789" required></label>
        <label class="field"><span>Date of Birth</span><input type="date" name="birthDate" data-user-input="birthDate" required></label>
        <label class="field"><span>Gender</span><select name="gender" required><option>Male</option><option>Female</option><option>Prefer not to say</option></select></label>
        <label class="field"><span>Civil Status</span><select name="civilStatus" required><option>Single</option><option>Married</option><option>Separated</option><option>Widowed</option></select></label>
        <label class="field"><span>Street</span><input type="text" name="street" data-user-input="street" placeholder="Street" required></label>
        <label class="field"><span>Barangay</span><input type="text" name="barangay" data-user-input="barangay" placeholder="Barangay" required></label>
        <label class="field"><span>City</span><input type="text" name="city" data-user-input="city" placeholder="City" required></label>
        <label class="field"><span>Province</span><input type="text" name="province" data-user-input="province" placeholder="Province" required></label>
      </div>
    </section>
    <section class="form-section" data-loan-step-panel="details">
      <h2>Employment / Income Details</h2>
      <div class="form-grid two">
        <label class="field"><span>Employment Status</span><select name="employmentStatus" required><option>Employed</option><option>Self-employed</option><option>Unemployed</option></select></label>
        <label class="field"><span>Employer Name / Business Name</span><input type="text" name="employer" data-user-input="employer" placeholder="Employer or business name" required></label>
        <label class="field"><span>Job Position</span><input type="text" name="jobTitle" data-user-input="jobTitle" placeholder="Job position" required></label>
        <label class="field"><span>Monthly Income</span><input type="text" name="monthlyIncome" inputmode="numeric" data-money-input placeholder="Monthly income" required></label>
        <label class="field"><span>Work Address</span><input type="text" name="workAddress" placeholder="Work address" required></label>
        <label class="field"><span>Years of Employment</span><input type="number" name="yearsEmployed" min="0" placeholder="0" required></label>
      </div>
    </section>
    <section class="form-section" data-loan-step-panel="details">
      <h2>Loan Details</h2>
      <div class="form-grid two">
        <label class="field"><span>Loan Amount Requested</span><input type="text" name="loanAmount" inputmode="numeric" data-money-input placeholder="Loan amount" required></label>
        <label class="field"><span>Loan Purpose</span><select name="loanPurpose" data-loan-purpose-select required><option>Business</option><option>Education</option><option>Personal</option><option>Emergency</option><option>Housing</option><option>Other</option></select></label>
        <label class="field full-span custom-loan-purpose" data-custom-loan-purpose hidden><span>Custom Loan Purpose</span><input type="text" name="customLoanPurpose" placeholder="Enter loan purpose"></label>
        <label class="field"><span>Loan Term</span><select name="loanTerm" data-loan-term-select required><option>3 months</option><option>5 months</option><option selected>6 months</option><option>12 months</option><option>Other</option></select></label>
        <div class="form-grid two full-span custom-loan-term" data-custom-loan-term hidden>
          <label class="field"><span>Custom Years</span><input type="number" name="customLoanYears" min="0" placeholder="0"></label>
          <label class="field"><span>Custom Months</span><input type="number" name="customLoanMonths" min="0" max="11" placeholder="0"></label>
        </div>
        <label class="field"><span>Preferred Payment Schedule</span><select name="paymentSchedule" required><option>Weekly</option><option>Bi-weekly</option><option selected>Monthly</option></select></label>
      </div>
      <div class="loan-calculation-panel" data-loan-calculation-panel>
        <div class="panel-title-row"><div><p class="page-kicker">Loan computation</p><h3>Estimated Monthly Payment</h3></div><span class="status pending">5% Interest</span></div>
        <div class="loan-calculation-grid">
          <article><span>Monthly Income</span><strong data-loan-calc="income">Enter income</strong></article>
          <article><span>Loan Amount</span><strong data-loan-calc="amount">Enter amount</strong></article>
          <article><span>Interest Amount</span><strong data-loan-calc="interest">0</strong></article>
          <article><span>Total Payable</span><strong data-loan-calc="total">0</strong></article>
          <article><span>Monthly Due</span><strong data-loan-calc="monthly">0</strong></article>
          <article><span>Salary Usage</span><strong data-loan-calc="ratio">0%</strong></article>
        </div>
        <p class="muted" data-loan-calc="advice">Enter monthly income and loan amount to preview affordability.</p>
      </div>
    </section>
    <section class="form-section" data-loan-step-panel="details">
      <h2>Financial Information</h2>
      <div class="form-grid two">
        <label class="field"><span>Existing Loans?</span><select name="existingLoans" required><option>No</option><option>Yes</option></select></label>
        <label class="field"><span>Monthly Expenses</span><input type="text" name="monthlyExpenses" inputmode="numeric" data-money-input placeholder="Monthly expenses" required></label>
        <label class="field"><span>Bank Account Number</span><input type="text" name="bankAccount" placeholder="Bank account number" required></label>
        <label class="field"><span>Bank Name</span><input type="text" name="bankName" placeholder="Bank name" required></label>
        <label class="field full-span"><span>Credit Score</span><input type="number" name="creditScore" placeholder="Optional / admin review"></label>
      </div>
    </section>
    <section class="form-section" data-loan-step-panel="details">
      <h2>Emergency Contact</h2>
      <div class="form-grid two">
        <label class="field"><span>Full Name</span><input type="text" name="emergencyName" data-user-input="emergencyName" placeholder="Emergency contact name" required></label>
        <label class="field"><span>Relationship</span><input type="text" name="emergencyRelationship" placeholder="Relationship" required></label>
        <label class="field"><span>Phone Number</span><input type="tel" name="emergencyPhone" placeholder="+63 917 222 3344" required></label>
        <label class="field"><span>Address</span><input type="text" name="emergencyAddress" placeholder="Emergency contact address" required></label>
      </div>
    </section>
    <section class="form-section step-actions" data-loan-step-panel="details">
      <h2>Continue Application</h2>
      <p class="muted">Review the edited loan details before saving changes.</p>
      <div class="submit-section"><button class="btn btn-primary" type="button" data-loan-next-step="review">Next</button></div>
    </section>
    <section class="form-section" data-loan-step-panel="review" hidden>
      <h2>Review Application Details</h2>
      <div class="loan-review-grid" data-loan-review-summary></div>
      <div class="payment-preview">
        <article><span>Requested</span><strong data-loan-review="amount">Enter amount</strong></article>
        <article><span>Estimated Term</span><strong data-loan-review="term">Select term</strong></article>
        <article><span>Estimated Monthly</span><strong data-loan-review="monthly">Calculated after review</strong></article>
      </div>
      <div class="submit-section"><button class="btn-secondary" type="button" data-loan-next-step="details">Back</button><button class="btn btn-primary" type="button" data-loan-next-step="submit">Next</button></div>
    </section>
    <section class="form-section" data-loan-step-panel="submit" hidden>
      <h2>Save Changes</h2>
      <div class="agreement-list">
        <label><input type="checkbox" required checked><span>I certify that all updated information is true.</span></label>
        <label><input type="checkbox" required checked><span>I agree to update this loan application.</span></label>
      </div>
      <div class="submit-section">
        <button class="btn btn-primary" type="submit">Update Application</button>
        <button class="btn-secondary" type="button" data-loan-edit-close>Cancel</button>
        <p class="muted" data-form-message></p>
      </div>
    </section>
  </form>
`;

const ensureLoanEditModal = () => {
  let modal = document.querySelector("[data-loan-edit-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "modal-backdrop loan-edit-backdrop";
  modal.dataset.loanEditModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="loan-edit-modal" role="dialog" aria-modal="true" aria-labelledby="loan-edit-title">
      <button class="icon-button modal-close" type="button" data-loan-edit-close aria-label="Close loan editor">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="loan-edit-modal-head">
        <p class="page-kicker">Saved loan details</p>
        <h2 id="loan-edit-title">Edit Loan Application</h2>
        <p class="muted">Update the selected application without leaving this page.</p>
      </div>
      <div class="loan-edit-modal-body">
        ${loanEditModalFormMarkup()}
      </div>
    </section>
  `;
  document.body.append(modal);
  syncCustomLoanTermFields(modal);
  syncCustomLoanPurposeFields(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-loan-edit-close]")) {
      modal.hidden = true;
      document.body.classList.remove("modal-open");
    }
  });

  return modal;
};

const openLoanEditor = (loanId) => {
  const application = getUserApplications().find((item) => item.id === loanId);

  if (!application) {
    return;
  }

  const modal = ensureLoanEditModal();
  const form = modal.querySelector(".loan-application-form");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  populateLoanApplicationForm(application, form);
  setLoanApplicationStep("details", form);
  form.querySelector("input:not([type='hidden']), select, textarea")?.focus();
};

const consumePendingLoanEdit = () => {
  const pendingLoanId = localStorage.getItem(pendingLoanEditKey);

  if (!pendingLoanId || !document.querySelector(".loan-application-form")) {
    return;
  }

  const application = getUserApplications().find((item) => item.id === pendingLoanId);

  if (!application) {
    return;
  }

  localStorage.removeItem(pendingLoanEditKey);
  window.setTimeout(() => populateLoanApplicationForm(application), 0);
};

const deleteLoanApplication = (loanId) => {
  const user = getCurrentUser();

  if (!user || !loanId) {
    return;
  }

  const nextApplications = getUserApplications().filter((application) => application.id !== loanId);
  const nextPayments = getUserPayments().filter((payment) => !String(payment.loanId || "").includes(loanId));

  saveCurrentUser({
    email: user.email,
    applications: nextApplications,
    payments: nextPayments,
  });

  syncRenderedData();
};

const deletePaymentRecord = (paymentId) => {
  const user = getCurrentUser();

  if (!user || !paymentId) {
    return;
  }

  saveCurrentUser({
    email: user.email,
    payments: getUserPayments().filter((payment) => payment.id !== paymentId),
  });

  syncRenderedData();
};

const ensureLoanAgreementModal = () => {
  let modal = document.querySelector("[data-loan-agreement-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "loan-agreement-backdrop";
  modal.dataset.loanAgreementModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="loan-agreement-modal" role="dialog" aria-modal="true" aria-labelledby="loan-agreement-title">
      <div class="loan-agreement-head">
        <p class="page-kicker">Online Loan Agreement Contract</p>
        <h2 id="loan-agreement-title">Borrower and Lending Agreement</h2>
        <p class="muted">Read and accept the terms before continuing with the loan application.</p>
      </div>
      <div class="loan-agreement-body">
        <section class="loan-agreement-section"><h3>Parties</h3><div class="loan-agreement-grid"><div><span>Bank / Lending Company</span><strong>Easy Loan</strong></div><div><span>Borrower / User</span><strong data-user-field="name">User</strong></div><div><span>Borrower Email</span><strong data-user-field="email">No email saved</strong></div><div><span>Date</span><strong>${new Date().toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</strong></div></div></section>
        <section class="loan-agreement-section"><h3>1. Purpose of Agreement</h3><p>This Agreement establishes the terms and conditions governing online loan services provided through the Online Loan Application Platform. The Borrower confirms that all submitted information and documents are true, accurate, and complete.</p></section>
        <section class="loan-agreement-section"><h3>2. Loan Details</h3><div class="loan-agreement-grid"><div><span>Loan Amount</span><strong>Based on submitted form</strong></div><div><span>Interest Rate</span><strong>Based on approved loan plan</strong></div><div><span>Loan Term</span><strong>Based on selected term</strong></div><div><span>Total Payable Amount</span><strong>Shown after review</strong></div></div></section>
        <section class="loan-agreement-section"><h3>3. Borrower Responsibilities</h3><ul><li>Provide accurate and truthful information.</li><li>Pay the loan on or before the due date.</li><li>Maintain confidentiality of account credentials and OTP codes.</li><li>Avoid fraudulent activity, identity theft, and falsified documents.</li><li>Use the loan only for lawful purposes and accept late payment penalties.</li></ul></section>
        <section class="loan-agreement-section"><h3>4. Bank / Lending Company Responsibilities</h3><ul><li>Protect personal information and financial records.</li><li>Provide secure online payment and loan processing systems.</li><li>Maintain confidentiality of user data under Philippine laws.</li><li>Provide loan computations, transaction history, and payment schedule information.</li><li>Investigate fraud reports and unauthorized transactions.</li></ul></section>
        <section class="loan-agreement-section"><h3>5. Data Privacy and Security Policy</h3><p>The Bank shall comply with Republic Act No. 10173, Republic Act No. 8792, Republic Act No. 8484, and Republic Act No. 11765. The Borrower authorizes collection, processing, and storage of personal information for verification, fraud prevention, credit investigation, and legal compliance.</p><ul><li>Encrypted transactions</li><li>OTP verification and account authentication</li><li>Fraud monitoring systems</li><li>Secure payment gateways</li><li>Data breach prevention measures</li></ul></section>
        <section class="loan-agreement-section"><h3>6. Bill of Rights of the Borrower</h3><ul><li>Receive clear loan information, rates, penalties, and fees.</li><li>Access personal loan records and payment history.</li><li>File complaints regarding unfair practices.</li><li>Receive fair treatment, data privacy, and protection from unauthorized transactions.</li><li>Request correction of inaccurate personal data and receive official payment confirmations.</li></ul></section>
        <section class="loan-agreement-section"><h3>7. Fraud Prevention and Security</h3><p>The Bank may verify documents, suspend suspicious accounts, reject false applications, conduct audits, and coordinate with law enforcement. System manipulation, hacking, fake identity use, or unauthorized transactions may result in permanent suspension, legal action, criminal prosecution, and financial penalties under applicable laws including Republic Act No. 10175 and Republic Act No. 9160.</p></section>
        <section class="loan-agreement-section"><h3>8. Payment Terms</h3><p>Payments shall be made through authorized payment channels only. Late or repeated non-payment may result in penalties, increased interest, collection procedures, credit record reporting, and legal collection procedures.</p></section>
        <section class="loan-agreement-section"><h3>9. Electronic Consent</h3><p>The Borrower agrees that electronic signatures, OTP verification, digital confirmations, online transactions, and electronic records are legally binding and valid evidence under Republic Act No. 8792.</p></section>
        <section class="loan-agreement-section"><h3>10. Termination, Dispute Resolution, and Governing Law</h3><p>The Bank may suspend or terminate accounts for fraud, fake documents, payment violations, policy violations, or cybersecurity threats. Disputes shall first undergo internal settlement and may be submitted to Philippine courts if unresolved. This Agreement is governed by the laws of the Republic of the Philippines.</p></section>
        <section class="loan-agreement-section"><h3>11. Agreement and Acceptance</h3><p>By clicking I Agree or submitting the application, the Borrower confirms they have read and understood this Agreement, agree to all terms and conditions, consent to electronic processing of data, and accept the responsibilities stated herein.</p><div class="loan-agreement-grid"><div><span>Bank Representative</span><strong>Easy Loan Authorized Representative</strong></div><div><span>Borrower / User</span><strong data-user-field="name">User</strong></div></div></section>
      </div>
      <div class="loan-agreement-actions">
        <label class="loan-agreement-check"><input type="checkbox" data-loan-agreement-check><span>I have read and agree to the Online Loan Agreement Contract.</span></label>
        <div class="form-actions"><button class="btn btn-primary" type="button" data-loan-agreement-accept>I Agree</button></div>
      </div>
    </section>
  `;
  document.body.append(modal);
  hydrateUserData(modal);
  return modal;
};

const setLoanStepActive = (step, root = document) => {
  root.querySelectorAll("[data-loan-step]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.loanStep === step);
  });
};

const setLoanApplicationStep = (step = "details", targetForm = null) => {
  const form = targetForm || document.querySelector(".loan-application-form");

  if (!form) {
    return;
  }

  setLoanStepActive(step, form.closest("[data-loan-edit-modal]") || document);
  form.querySelectorAll("[data-loan-step-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.loanStepPanel !== step;
  });
  form.querySelector(`[data-loan-step-panel="${step}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const validateLoanStep = (step = "details", targetForm = null) => {
  const form = targetForm || document.querySelector(".loan-application-form");
  const panels = [...(form?.querySelectorAll(`[data-loan-step-panel="${step}"]`) || [])];
  let firstInvalidField = null;

  for (const panel of panels) {
    panel.querySelectorAll("input, select, textarea").forEach((field) => {
      if (field.disabled) {
        field.closest(".field")?.classList.remove("is-invalid");
        return;
      }

      const isInvalid = !field.checkValidity();
      field.closest(".field")?.classList.toggle("is-invalid", isInvalid);

      if (isInvalid && !firstInvalidField) {
        firstInvalidField = field;
      }
    });
  }

  if (firstInvalidField) {
    firstInvalidField.reportValidity();
    firstInvalidField.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidField.focus({ preventScroll: true });
    return false;
  }

  return true;
};

const openLoanAgreementModal = () => {
  const modal = ensureLoanAgreementModal();

  modal.hidden = false;
  document.body.classList.add("modal-open");
  setLoanStepActive("details");
  modal.querySelector("[data-loan-agreement-check]")?.focus();
};

const closeLoanAgreementModal = () => {
  document.querySelectorAll("[data-loan-agreement-modal]").forEach((modal) => {
    modal.hidden = true;
  });
  document.body.classList.remove("modal-open");
};

const acceptLoanAgreement = () => {
  const modal = ensureLoanAgreementModal();
  const checkbox = modal.querySelector("[data-loan-agreement-check]");

  if (!checkbox?.checked) {
    checkbox?.focus();
    return false;
  }

  document.querySelector(".loan-application-form")?.setAttribute("data-agreement-accepted", "true");
  document.querySelector('[data-loan-step="details"]')?.classList.add("is-complete");
  closeLoanAgreementModal();
  setLoanApplicationStep("details");
  return true;
};

const hasAcceptedLoanAgreement = (targetForm = null) =>
  (targetForm || document.querySelector(".loan-application-form"))?.dataset.agreementAccepted === "true";

const syncLoanAgreementState = () => {
  const form = document.querySelector(".loan-application-form");

  if (!form) {
    return;
  }

  localStorage.removeItem(loanAgreementAcceptedKey);
  const accepted = hasAcceptedLoanAgreement();
  form.dataset.agreementAccepted = String(accepted);
  document.querySelector('[data-loan-step="details"]')?.classList.toggle("is-complete", accepted);

  if (!form.dataset.stepInitialized) {
    form.dataset.stepInitialized = "true";
    setLoanApplicationStep("details");
  }

  if (!accepted && !form.dataset.agreementPrompted) {
    form.dataset.agreementPrompted = "true";
    window.setTimeout(openLoanAgreementModal, 250);
  }
};

const updateLoanReviewPreview = (root = document) => {
  const form = root.matches?.(".loan-application-form")
    ? root
    : root.querySelector?.(".loan-application-form") || document.querySelector(".loan-application-form");

  if (!form) {
    return;
  }

  const amount = parseMoneyValue(form.querySelector('[name="loanAmount"]')?.value || 0);
  const income = parseMoneyValue(form.querySelector('[name="monthlyIncome"]')?.value || 0);
  const term = getLoanTermValue(form);
  const months = loanTermMonths(term);
  const interestRate = 0.05;
  const interestAmount = amount ? Math.round(amount * interestRate) : 0;
  const totalPayable = amount + interestAmount;
  const monthly = totalPayable ? Math.round(totalPayable / months) : 0;
  const salaryRatio = income && monthly ? Math.round((monthly / income) * 100) : 0;
  const amountTarget = form.querySelector('[data-loan-review="amount"]');
  const termTarget = form.querySelector('[data-loan-review="term"]');
  const monthlyTarget = form.querySelector('[data-loan-review="monthly"]');
  const reviewSummary = form.querySelector("[data-loan-review-summary]");
  const calculationPanel = form.querySelector("[data-loan-calculation-panel]");
  const fieldValue = (selector, fallback = "Not provided") => form.querySelector(selector)?.value?.trim() || fallback;
  const selectValue = (name, fallback = "Not selected") => form.querySelector(`[name="${name}"]`)?.value || fallback;
  const purpose = getLoanPurposeValue(form);
  const uploadedFiles = [...form.querySelectorAll('input[type="file"]')].reduce((count, input) => count + input.files.length, 0);

  if (amountTarget) amountTarget.textContent = amount ? formatPeso(amount) : "Enter amount";
  if (termTarget) termTarget.textContent = term || "Select term";
  if (monthlyTarget) monthlyTarget.textContent = monthly ? formatPeso(monthly) : "Calculated after review";

  if (calculationPanel) {
    const setCalc = (key, value) => {
      const target = calculationPanel.querySelector(`[data-loan-calc="${key}"]`);
      if (target) target.textContent = value;
    };
    const advice = salaryRatio > 40
      ? "This monthly due may be high compared with the saved income. Consider a lower amount or longer term."
      : salaryRatio > 0
        ? "This estimate is based on 5% interest and the selected repayment term."
        : "Enter monthly income and loan amount to preview affordability.";

    setCalc("income", income ? formatPeso(income) : "Enter income");
    setCalc("amount", amount ? formatPeso(amount) : "Enter amount");
    setCalc("interest", formatPeso(interestAmount));
    setCalc("total", formatPeso(totalPayable));
    setCalc("monthly", monthly ? formatPeso(monthly) : formatPeso(0));
    setCalc("ratio", `${salaryRatio}%`);
    setCalc("advice", advice);
  }

  if (reviewSummary) {
    reviewSummary.innerHTML = `
      <article><span>Borrower</span><strong>${escapeHtml(fieldValue('[name="name"]'))}</strong></article>
      <article><span>Email</span><strong>${escapeHtml(fieldValue('[name="email"]'))}</strong></article>
      <article><span>Phone</span><strong>${escapeHtml(fieldValue('[name="contact"]'))}</strong></article>
      <article><span>Address</span><strong>${escapeHtml([fieldValue('[name="street"]', ""), fieldValue('[name="barangay"]', ""), fieldValue('[name="city"]', ""), fieldValue('[name="province"]', "")].filter(Boolean).join(", ") || "Not provided")}</strong></article>
      <article><span>Employment</span><strong>${escapeHtml(form.querySelector("select")?.value || "Not selected")}</strong></article>
      <article><span>Employer / Business</span><strong>${escapeHtml(fieldValue('[name="employer"]'))}</strong></article>
      <article><span>Monthly Income</span><strong>${formatPeso(parseMoneyValue(fieldValue('[name="monthlyIncome"]', "0")))}</strong></article>
      <article><span>Loan Amount</span><strong>${amount ? formatPeso(amount) : "Enter amount"}</strong></article>
      <article><span>Interest</span><strong>${formatPeso(interestAmount)} (5%)</strong></article>
      <article><span>Total Payable</span><strong>${formatPeso(totalPayable)}</strong></article>
      <article><span>Monthly Due</span><strong>${monthly ? formatPeso(monthly) : "Calculated after review"}</strong></article>
      <article><span>Salary Usage</span><strong>${salaryRatio}%</strong></article>
      <article><span>Loan Purpose</span><strong>${escapeHtml(purpose)}</strong></article>
      <article><span>Loan Term</span><strong>${escapeHtml(term || "Select term")}</strong></article>
      <article><span>Payment Schedule</span><strong>${escapeHtml(selectValue("paymentSchedule"))}</strong></article>
      <article><span>Bank</span><strong>${escapeHtml(fieldValue('[name="bankName"]'))}</strong></article>
      <article><span>Emergency Contact</span><strong>${escapeHtml(fieldValue('[name="emergencyName"]'))}</strong></article>
      <article><span>Emergency Phone</span><strong>${escapeHtml(fieldValue('[name="emergencyPhone"]'))}</strong></article>
      <article><span>Uploaded Files</span><strong>${uploadedFiles}</strong></article>
    `;
  }
};

const syncCustomLoanTermFields = (root = document) => {
  const forms = root.querySelectorAll?.(".loan-application-form") || [];

  forms.forEach((form) => {
    const select = form.querySelector("[data-loan-term-select]");
    const customWrap = form.querySelector("[data-custom-loan-term]");
    const isCustom = select?.value === "Other";

    if (customWrap) {
      customWrap.hidden = !isCustom;
      customWrap.querySelectorAll("input").forEach((input) => {
        input.required = isCustom;
        input.disabled = !isCustom;

        if (!isCustom) {
          input.value = "";
        }
      });
    }
  });
};

const syncCustomLoanPurposeFields = (root = document) => {
  const forms = root.querySelectorAll?.(".loan-application-form") || [];

  forms.forEach((form) => {
    const select = form.querySelector("[data-loan-purpose-select]");
    const customWrap = form.querySelector("[data-custom-loan-purpose]");
    const input = customWrap?.querySelector("input");
    const isCustom = select?.value === "Other";

    if (customWrap) {
      customWrap.hidden = !isCustom;
    }

    if (input) {
      input.required = isCustom;
      input.disabled = !isCustom;

      if (!isCustom) {
        input.value = "";
      }
    }
  });
};

const downloadPaymentProof = (payment) => {
  if (!payment) {
    return;
  }

  const lines = [
    "Easy Loan Payment Proof",
    "-----------------------",
    `Payment ID: ${payment.id}`,
    `Loan: ${payment.loanId}`,
    `Amount: ${formatPeso(payment.amount)}`,
    `Method: ${payment.method}`,
    `Reference: ${payment.reference || payment.receipt || "No reference saved"}`,
    `Status: ${payment.status}`,
    `Submitted: ${payment.submittedAt}`,
    "",
    "Keep this file as proof of submitted payment details. Admin confirmation is still required.",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `${payment.id}-payment-proof.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 250);
};

const downloadPaymentReceipt = (paymentId) => {
  const payment = getUserPayments().find((item) => item.id === paymentId);

  if (!payment) {
    showToast("Payment record was not found.", { type: "error" });
    return;
  }

  const application = getUserApplications().find((item) => String(payment.loanId || "").includes(item.id));
  const borrower = getCurrentUser();
  const receiptNumber = `RCPT-${String(payment.id || Date.now()).replace(/^PAY-?/i, "")}`;
  const safePaymentId = String(payment.id || "payment").replace(/[^\w-]/g, "-");

  downloadTextFile(`${safePaymentId}-receipt.txt`, [
    "Easy Loan Payment Receipt",
    "-------------------------",
    `Receipt No: ${receiptNumber}`,
    `Payment ID: ${payment.id}`,
    `Borrower: ${borrower?.name || nameFromEmail(borrower?.email || "user@example.com")}`,
    `Loan: ${payment.loanId || application?.id || "No loan selected"}`,
    `Loan Purpose: ${application?.purpose || "Loan"}`,
    `Amount Paid: ${formatPeso(payment.amount)}`,
    `Method Used: ${payment.method || "Not selected"}`,
    `Reference Number: ${payment.reference || payment.receipt || "No reference saved"}`,
    `Status: ${payment.status || "Pending Confirmation"}`,
    `Date Paid: ${payment.submittedAt || "No date saved"}`,
    "",
    "This receipt was generated from your saved Easy Loan payment record.",
  ]);
};

const downloadTextFile = (fileName, lines) => {
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 250);
};

const escapePdfText = (value) =>
  String(value || "")
    .replace(/\u20b1/g, "PHP ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapPdfLine = (line, maxLength = 88) => {
  const words = String(line || "").replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  return currentLine ? [...lines, currentLine] : [""];
};

const downloadPdfFile = (fileName, lines) => {
  const pdfLines = lines.flatMap((line) => (line ? wrapPdfLine(line) : [""])).slice(0, 48);
  const content = [
    "BT",
    "/F1 11 Tf",
    "50 750 Td",
    "14 TL",
    ...pdfLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n");
  pdf += `\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 250);
};

const downloadApplicationProof = (applicationId) => {
  const application = getUserApplications().find((item) => item.id === applicationId);

  if (!application) {
    return;
  }

  const formData = application.formData || {};
  const documents = application.documents || [];
  const lines = [
    "Easy Loan Application Proof",
    "---------------------------",
    `Application ID: ${application.id}`,
    `Status: ${application.status || "Pending"}`,
    `Submitted: ${application.submittedAt || "No date saved"}`,
    `Loan Purpose: ${application.purpose || "Loan"}`,
    `Loan Amount: ${formatPeso(application.amount)}`,
    `Loan Term: ${application.term || "Not selected"}`,
    `Payment Schedule: ${application.schedule || "Not selected"}`,
    "",
    "Borrower Details",
    `Name: ${formData.name || "Not provided"}`,
    `Email: ${formData.email || "Not provided"}`,
    `Contact: ${formData.contact || "Not provided"}`,
    `Address: ${[formData.street, formData.barangay, formData.city, formData.province].filter(Boolean).join(", ") || "Not provided"}`,
    "",
    "Income and Bank Details",
    `Employer / Business: ${formData.employer || "Not provided"}`,
    `Monthly Income: ${formData.monthlyIncome || "Not provided"}`,
    `Bank Name: ${formData.bankName || "Not provided"}`,
    "",
    "Submitted Documents",
    ...(documents.length ? documents.map((document) => `${document.type}: ${document.fileName} (${document.status})`) : ["No submitted documents saved."]),
    "",
    "This file is a generated proof that the borrower submitted an online loan application through Easy Loan.",
  ];

  downloadPdfFile(`${application.id}-loan-application-form.pdf`, lines);
};

const downloadDocumentProof = (fileName) => {
  downloadTextFile(`${String(fileName || "document").replace(/\s+/g, "-")}-document-proof.txt`, [
    "Easy Loan Document Proof",
    "------------------------",
    `File Name: ${fileName || "No file name saved"}`,
    "Status: Submitted for review",
    "",
    "This file confirms that a document record exists in the user account.",
  ]);
};

const ensurePaymentQrModal = () => {
  let modal = document.querySelector("[data-payment-qr-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "payment-qr-backdrop";
  modal.dataset.paymentQrModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="payment-qr-card" role="dialog" aria-modal="true" aria-labelledby="payment-qr-title">
      <button class="icon-button payment-qr-close" type="button" data-payment-qr-close aria-label="Close QR code"><span class="material-symbols-outlined">close</span></button>
      <div>
        <p class="page-kicker" data-payment-qr-kicker>GCash QR Payment</p>
        <h3 id="payment-qr-title">Scan to pay Easy Loan</h3>
        <p data-payment-qr-copy>Use GCash scan-to-pay, then enter the reference number and upload the receipt in the payment form.</p>
        <div class="payment-qr-details">
          <span>Account Name</span><strong>Easy Loan</strong>
          <span>Channel</span><strong data-payment-qr-channel>GCash</strong>
        </div>
      </div>
      <div class="payment-qr-code" aria-label="Demo GCash QR code">
        <span></span><span></span><span></span>
      </div>
    </section>
  `;
  document.body.append(modal);
  return modal;
};

const bankTransferDetails = {
  BDO: {
    accountName: "Easy Loan",
    accountNumber: "BDO-0000-1234-5678",
    branch: "BDO Main Branch",
    note: "Use your Loan ID as the transfer note.",
  },
  LandBank: {
    accountName: "Easy Loan",
    accountNumber: "LBP-0000-9876-5432",
    branch: "LandBank Main Branch",
    note: "Send proof of transfer after payment.",
  },
  BPI: {
    accountName: "Easy Loan",
    accountNumber: "BPI-0000-2468-1357",
    branch: "BPI Business Banking",
    note: "Enter your reference number after transfer.",
  },
  Metrobank: {
    accountName: "Easy Loan",
    accountNumber: "MBTC-0000-1122-3344",
    branch: "Metrobank Main Branch",
    note: "Keep your confirmation receipt.",
  },
  UnionBank: {
    accountName: "Easy Loan",
    accountNumber: "UBP-0000-5566-7788",
    branch: "UnionBank Online",
    note: "Upload the transfer receipt below.",
  },
};

const defaultLoanPlans = [
  {
    name: "Starter Loan Plan",
    category: "Starter",
    amount: "PHP 5,000 - PHP 20,000",
    rate: "5% Monthly",
    term: "3 - 6 Months",
    status: "Active",
  },
  {
    name: "Personal Loan Plan",
    category: "Personal",
    amount: "PHP 20,000 - PHP 100,000",
    rate: "3% Monthly",
    term: "6 - 24 Months",
    status: "Active",
  },
  {
    name: "Business Loan Plan",
    category: "Business",
    amount: "PHP 50,000 - PHP 500,000",
    rate: "2.5% Monthly",
    term: "12 - 36 Months",
    status: "Active",
  },
  {
    name: "Salary Loan Plan",
    category: "Salary",
    amount: "PHP 10,000 - PHP 50,000",
    rate: "2% Monthly",
    term: "6 - 12 Months",
    status: "Active",
  },
  {
    name: "Emergency Loan Plan",
    category: "Emergency",
    amount: "PHP 3,000 - PHP 15,000",
    rate: "6% Monthly",
    term: "1 - 3 Months",
    status: "Active",
  },
  {
    name: "Student Loan Plan",
    category: "Student",
    amount: "PHP 10,000 - PHP 80,000",
    rate: "1.5% Monthly",
    term: "12 - 48 Months",
    status: "Active",
  },
];

const ensureBankTransferModal = () => {
  let modal = document.querySelector("[data-bank-transfer-modal]");

  if (modal) {
    return modal;
  }

  const bankOptions = Object.keys(bankTransferDetails)
    .map((bank, index) => `<button class="bank-option ${index === 0 ? "is-selected" : ""}" type="button" data-bank-option="${bank}">${bank}</button>`)
    .join("");

  modal = document.createElement("div");
  modal.className = "payment-qr-backdrop";
  modal.dataset.bankTransferModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="bank-transfer-card" role="dialog" aria-modal="true" aria-labelledby="bank-transfer-title">
      <button class="icon-button payment-qr-close" type="button" data-bank-transfer-close aria-label="Close bank transfer details"><span class="material-symbols-outlined">close</span></button>
      <div>
        <p class="page-kicker">Bank Transfer</p>
        <h3 id="bank-transfer-title">Choose your bank</h3>
        <p>Select the bank you will use, then transfer to the account details shown below.</p>
      </div>
      <div class="bank-option-grid">${bankOptions}</div>
      <div class="bank-detail-panel" data-bank-transfer-details></div>
      <form class="bank-transfer-form" data-bank-transfer-form>
        <input type="hidden" name="selectedBank" value="BDO" data-bank-selected-input>
        <div class="form-grid two">
          <label class="field"><span>Transfer Amount</span><input type="number" name="bankAmount" placeholder="Amount transferred" required></label>
          <label class="field"><span>Bank Reference Number</span><input type="text" name="bankReference" placeholder="Reference number" required></label>
          <label class="field"><span>Sender Account Name</span><input type="text" name="bankSender" placeholder="Your account name" required></label>
          <label class="field"><span>Transfer Date</span><input type="date" name="bankTransferDate" required></label>
        </div>
        <div class="form-actions"><button class="btn btn-primary" type="submit">Submit Bank Details</button><p class="muted">These details will be copied to the payment form.</p></div>
      </form>
    </section>
  `;
  document.body.append(modal);
  return modal;
};

const renderBankTransferDetails = (bank = "BDO") => {
  const modal = ensureBankTransferModal();
  const details = bankTransferDetails[bank] || bankTransferDetails.BDO;
  const detailPanel = modal.querySelector("[data-bank-transfer-details]");

  modal.querySelectorAll("[data-bank-option]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.bankOption === bank);
  });

  const bankInput = modal.querySelector("[data-bank-selected-input]");

  if (bankInput) {
    bankInput.value = bank;
  }

  detailPanel.innerHTML = `
    <div class="bank-detail-head"><span class="material-symbols-outlined">account_balance</span><div><strong>${bank}</strong><small>Transfer details</small></div></div>
    <div class="payment-qr-details bank-details">
      <span>Account Name</span><strong>${escapeHtml(details.accountName)}</strong>
      <span>Account Number</span><strong>${escapeHtml(details.accountNumber)}</strong>
      <span>Branch / Channel</span><strong>${escapeHtml(details.branch)}</strong>
      <span>Reminder</span><strong>${escapeHtml(details.note)}</strong>
    </div>
  `;
};

const setBankTransferVisibility = (shouldShow, bank = "BDO") => {
  const modal = ensureBankTransferModal();

  modal.hidden = !shouldShow;

  if (shouldShow) {
    delete modal.dataset.bankTarget;
    document.body.classList.add("modal-open");
    renderBankTransferDetails(bank);
  }
};

const setPaymentQrVisibility = (method) => {
  const qrPanel = ensurePaymentQrModal();
  const qrMethods = ["GCash", "PayMaya"];
  const shouldShow = qrMethods.includes(method);

  if (!qrPanel) {
    return;
  }

  qrPanel.hidden = !shouldShow;
  document.body.classList.toggle("modal-open", shouldShow);

  if (!shouldShow) {
    return;
  }

  const label = method === "PayMaya" ? "PayMaya" : "GCash";
  const walletName = method === "PayMaya" ? "Maya" : "GCash";

  qrPanel.querySelector("[data-payment-qr-kicker]").textContent = `${label} QR Payment`;
  qrPanel.querySelector("#payment-qr-title").textContent = `Scan to pay with ${label}`;
  qrPanel.querySelector("[data-payment-qr-copy]").textContent = `Use ${walletName} scan-to-pay, then enter the reference number and upload the receipt in the payment form.`;
  qrPanel.querySelector("[data-payment-qr-channel]").textContent = label;
};

const selectedLoanPlanData = (button) => ({
  name: button.dataset.planName || "Loan Plan",
  amount: button.dataset.planAmount || "--",
  rate: button.dataset.planRate || "--",
  term: button.dataset.planTerm || "--",
  example: button.dataset.planExample || "--",
  description: button.dataset.planDescription || "Review the selected plan details.",
  min: Number(button.dataset.planMin || 0),
  months: Math.max(Number(button.dataset.planMonths || 1), 1),
  rateValue: Number(button.dataset.planRateValue || 0),
});

const ensureLoanPlanModal = () => {
  let modal = document.querySelector("[data-loan-plan-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "modal-backdrop loan-plan-modal-backdrop";
  modal.dataset.loanPlanModal = "";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="loan-plan-modal" role="dialog" aria-modal="true" aria-labelledby="loan-plan-modal-title">
      <button class="icon-button modal-close" type="button" data-loan-plan-close aria-label="Close plan payment preview"><span class="material-symbols-outlined">close</span></button>
      <div class="loan-plan-modal-head">
        <p class="page-kicker">Application preview</p>
        <h2 id="loan-plan-modal-title" data-plan-modal-name>Loan Plan</h2>
        <p class="muted" data-plan-modal-description>Review the selected plan details.</p>
      </div>
      <form class="loan-plan-payment-form" data-loan-plan-payment-form>
        <div class="loan-plan-modal-grid">
          <article><span>Loan Amount</span><strong data-plan-modal-amount>--</strong></article>
          <article><span>Interest Rate</span><strong data-plan-modal-rate>--</strong></article>
          <article><span>Repayment Term</span><strong data-plan-modal-term>--</strong></article>
          <article><span>Sample Monthly</span><strong data-plan-modal-example>--</strong></article>
        </div>
        <div class="loan-plan-estimate">
          <label class="field"><span>Amount to Preview</span><input type="text" name="previewAmount" data-plan-preview-amount data-money-input inputmode="numeric" required></label>
          <div class="loan-plan-apply-note"><span class="material-symbols-outlined">info</span><p>Click Apply This Plan to save this selected plan as a loan application for admin review.</p></div>
        </div>
        <div class="loan-plan-payment-result">
          <div><span>Estimated Payable</span><strong data-plan-modal-total>--</strong></div>
          <div><span>Estimated Monthly</span><strong data-plan-modal-monthly>--</strong></div>
        </div>
        <div class="form-actions">
          <a class="btn btn-primary" href="loans/apply-loan.html" data-plan-apply-link>Apply This Plan</a>
          <button class="btn-secondary" type="button" data-loan-plan-close>Close</button>
          <p class="muted" data-plan-modal-message></p>
        </div>
      </form>
    </section>
  `;
  document.body.append(modal);
  return modal;
};

const updateLoanPlanEstimate = (modal) => {
  const form = modal?.querySelector("[data-loan-plan-payment-form]");

  if (!form) {
    return;
  }

  const amountInput = form.querySelector("[data-plan-preview-amount]");
  const amount = parseMoneyValue(amountInput?.value || 0);
  const months = Math.max(Number(form.dataset.planMonths || 1), 1);
  const rate = Number(form.dataset.planRateValue || 0) / 100;
  const total = amount + Math.round(amount * rate * months);
  const monthly = Math.round(total / months);

  modal.querySelector("[data-plan-modal-total]").textContent = amount ? formatPeso(total) : "--";
  modal.querySelector("[data-plan-modal-monthly]").textContent = amount ? formatPeso(monthly) : "--";
};

const openLoanPlanModal = (button) => {
  const modal = ensureLoanPlanModal();

  if (!modal || !button) {
    return;
  }

  const plan = selectedLoanPlanData(button);
  const form = modal.querySelector("[data-loan-plan-payment-form]");
  const amountInput = modal.querySelector("[data-plan-preview-amount]");

  modal.querySelector("[data-plan-modal-name]").textContent = plan.name;
  modal.querySelector("[data-plan-modal-description]").textContent = plan.description;
  modal.querySelector("[data-plan-modal-amount]").textContent = plan.amount;
  modal.querySelector("[data-plan-modal-rate]").textContent = plan.rate;
  modal.querySelector("[data-plan-modal-term]").textContent = plan.term;
  modal.querySelector("[data-plan-modal-example]").textContent = plan.example;

  if (form) {
    form.dataset.planMonths = String(plan.months);
    form.dataset.planRateValue = String(plan.rateValue);
  }

  if (amountInput) {
    amountInput.value = formatNumberWithCommas(plan.min);
  }

  updateLoanPlanEstimate(modal);
  modal.hidden = false;
  document.body.classList.add("modal-open");
  amountInput?.focus();
};

const closeLoanPlanModal = (modal = document.querySelector("[data-loan-plan-modal]")) => {
  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("modal-open");
};

const savePlanApplicationRecord = (form) => {
  const user = getCurrentUser();
  const modal = form?.closest("[data-loan-plan-modal]");

  if (!user || !form || !modal) {
    return null;
  }

  const timestamp = Date.now();
  const amount = parseMoneyValue(form.querySelector("[data-plan-preview-amount]")?.value || 0);
  const planName = modal.querySelector("[data-plan-modal-name]")?.textContent?.trim() || "Loan Plan";
  const term = modal.querySelector("[data-plan-modal-term]")?.textContent?.trim() || "Not selected";
  const application = {
    id: `APP-${String(timestamp).slice(-6)}`,
    amount: String(amount),
    purpose: planName.replace(/\s*Loan Plan$/i, "") || "Loan Plan",
    term,
    schedule: "Monthly",
    status: "Pending",
    formData: {
      loanAmount: String(amount),
      loanPurpose: planName,
      loanTerm: term,
      paymentSchedule: "Monthly",
      selectedPlan: planName,
    },
    documents: [],
    submittedAt: new Date(timestamp).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    updatedAt: "",
  };

  saveCurrentUser({
    email: user.email,
    applications: [application, ...getUserApplications()],
  });

  syncRenderedData();
  return application;
};

const submitPlanApplication = (form) => {
  const application = savePlanApplicationRecord(form);
  const message = form?.querySelector("[data-plan-modal-message]");

  if (message) {
    message.textContent = application
      ? `${application.id} saved as a pending loan application. You can review it in My Loans.`
      : "Sign in first before applying for a plan.";
  }

  showToast(
    application ? `${application.id} saved as a pending loan application.` : "Sign in first before applying for a plan.",
    { type: application ? "success" : "warning" }
  );
};

const aiChatContext = () => {
  const user = getCurrentUser();
  const applications = getUserApplications();
  const payments = getUserPayments();
  const documents = getUserDocuments();
  const totalLoan = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const totalPaid = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

  return {
    user,
    applications,
    payments,
    documents,
    latestApplication: applications[0],
    balance: Math.max(totalLoan - totalPaid, 0),
  };
};

const aiChatIncludesAny = (text, words) => words.some((word) => text.includes(word));

const aiChatUserName = () => getCurrentUser()?.name?.trim().split(/\s+/)[0] || "there";

const setAiChatTopic = (topic) => {
  document.querySelectorAll("[data-floating-ai-chat]").forEach((chat) => {
    chat.dataset.aiLastTopic = topic;
  });
};

const aiChatLastTopic = () => document.querySelector("[data-floating-ai-chat]")?.dataset.aiLastTopic || "";

const aiAssistantReply = (message) => {
  const text = String(message || "").toLowerCase();
  const context = aiChatContext();
  const name = aiChatUserName();
  const lastTopic = aiChatLastTopic();

  if (!text.trim()) {
    return ["Please type your question so I can help with the right next step."];
  }

  if (aiChatIncludesAny(text, ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"])) {
    setAiChatTopic("greeting");
    return [
      `Hi ${name}, I am here to help with your Easy Loan account.`,
      "You can ask me about applying, loan status, payments, documents, remaining balance, loan plans, or account problems.",
    ];
  }

  if (aiChatIncludesAny(text, ["apply", "application", "loan form", "borrow", "submit loan"])) {
    setAiChatTopic("application");
    return [
      "Sure. To apply, open Apply Loan and complete the borrower, employment, loan, financial, emergency contact, and document sections.",
      "After you submit, the saved application will appear in My Loans and Loan Status.",
      "Before submitting, compare Loan Plans if you are not sure which amount, term, or interest rate fits your need.",
    ];
  }

  if (aiChatIncludesAny(text, ["status", "approved", "pending", "reject", "review", "processing"])) {
    setAiChatTopic("status");
    if (!context.latestApplication) {
      return [
        "I do not see a saved loan application yet.",
        "Go to Apply Loan first, submit the form, then check Loan Status for review updates.",
      ];
    }
    return [
      `Your latest saved loan is ${context.latestApplication.id}.`,
      `Current status: ${context.latestApplication.status || "Pending"}.`,
      "Open Loan Status to view the timeline, document review, approval step, and recommended actions.",
    ];
  }

  if (aiChatIncludesAny(text, ["payment", "pay", "gcash", "maya", "paymaya", "bank", "receipt", "reference"])) {
    setAiChatTopic("payment");
    if (!context.applications.length) {
      return [
        "You need a saved loan before submitting a payment.",
        "Once you have a loan, open Payments, choose the loan, select GCash, PayMaya, Bank Transfer, or Cash, then submit the reference.",
      ];
    }
    return [
      "To submit a payment, open Payments and choose the loan you want to pay.",
      "Then select GCash, PayMaya, Bank Transfer, or Cash, and submit the payment reference.",
      `Your current estimated remaining balance is ${formatPeso(context.balance)} based on saved records.`,
    ];
  }

  if (aiChatIncludesAny(text, ["balance", "remaining", "amount due", "due", "unpaid"])) {
    setAiChatTopic("balance");
    return [
      `Your estimated remaining balance is ${formatPeso(context.balance)}.`,
      "If this looks wrong, check if the payment was saved and linked to the correct loan.",
      "You can also open Remaining Balance to see the per-loan breakdown.",
    ];
  }

  if (aiChatIncludesAny(text, ["document", "upload", "valid id", "id", "proof", "income", "requirement", "requirements"])) {
    setAiChatTopic("documents");
    return [
      "For loan verification, prepare a valid ID, proof of income, borrower signature, and any extra file requested by support.",
      "Open Documents to review uploaded files or check missing requirements.",
      "Make sure files are clear and readable before uploading.",
    ];
  }

  if (aiChatIncludesAny(text, ["profile", "account", "email", "password", "phone", "contact", "login"])) {
    setAiChatTopic("account");
    return [
      "For account details, open Profile to update your name, email, contact number, and address.",
      "For password or security changes, use the profile security options.",
      "Keep your email and phone number updated so you do not miss loan notices.",
    ];
  }

  if (aiChatIncludesAny(text, ["plan", "interest", "term", "starter", "personal", "business", "salary", "emergency", "student"])) {
    setAiChatTopic("plans");
    return [
      "Open Loan Plans to compare Starter, Personal, Business, Salary, Emergency, and Student plans.",
      "Each plan card is clickable, so you can preview estimated payment details before applying.",
      "Choose based on your purpose, amount needed, monthly interest, and repayment term.",
    ];
  }

  if (aiChatIncludesAny(text, ["help", "problem", "issue", "ticket", "concern", "not working", "wrong"])) {
    setAiChatTopic("support");
    return [
      "I can help you narrow it down.",
      "Tell me if the problem is about application, payment, documents, balance, profile, or login.",
      "If staff needs to verify it, create a support ticket and include your loan ID, payment reference, or document name.",
    ];
  }

  if (aiChatIncludesAny(text, ["yes", "okay", "ok", "sure", "how", "what next", "next"]) && lastTopic) {
    const nextSteps = {
      application: "Next step: open Apply Loan, fill out the form, upload requirements, then submit. After that, check My Loans.",
      status: "Next step: open Loan Status. If the status is still pending after review, check Documents for missing requirements.",
      payment: "Next step: open Payments, select your loan and channel, then enter your payment reference.",
      balance: "Next step: open Remaining Balance and compare loan amount versus submitted payment records.",
      documents: "Next step: open Documents and upload clear copies of your ID, proof of income, and other required files.",
      account: "Next step: open Profile. Update your details first, then save before applying or paying.",
      plans: "Next step: open Loan Plans, click a plan, preview the payment, then choose Apply This Plan.",
      support: "Next step: create a support ticket and describe the issue with any loan ID or payment reference.",
    };
    return [nextSteps[lastTopic] || "Tell me more about what you need, and I will guide you."];
  }

  setAiChatTopic("general");
  return [
    "I want to help, but I need a little more detail.",
    "Is your concern about applying, loan status, payment, documents, remaining balance, profile, or loan plans?",
  ];
};

const appendAiChatMessage = (messages, sender, text) => {
  if (!messages) {
    return;
  }

  const isUser = sender === "You";
  const article = document.createElement("article");
  article.className = `ai-chat-message ${isUser ? "is-user" : "is-ai"}`;
  article.innerHTML = `
    <span class="material-symbols-outlined">${isUser ? "person" : "smart_toy"}</span>
    <div><strong>${escapeHtml(sender)}</strong><p>${escapeHtml(text)}</p></div>
  `;
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
};

const showAiTypingMessage = (messages) => {
  if (!messages) {
    return null;
  }

  const article = document.createElement("article");
  article.className = "ai-chat-message is-ai is-typing";
  article.dataset.aiTyping = "";
  article.innerHTML = `
    <span class="material-symbols-outlined">smart_toy</span>
    <div><strong>Easy Loan AI</strong><p><span></span><span></span><span></span></p></div>
  `;
  messages.append(article);
  messages.scrollTop = messages.scrollHeight;
  return article;
};

const sendAiChatMessage = (form, message) => {
  const chatRoot = form?.closest(".ai-chat-shell") || form?.closest("[data-floating-ai-chat]");
  const messages = chatRoot?.querySelector("[data-ai-chat-messages]");
  const input = form?.querySelector("[data-ai-chat-input]");
  const prompt = String(message || input?.value || "").trim();

  if (!prompt) {
    return;
  }

  appendAiChatMessage(messages, "You", prompt);
  form.closest("[data-floating-ai-chat]")?.setAttribute("data-ai-user-started", "true");
  if (input) {
    input.value = "";
  }

  const typing = showAiTypingMessage(messages);
  window.setTimeout(() => {
    typing?.remove();
    const replies = aiAssistantReply(prompt);
    const replyList = Array.isArray(replies) ? replies : [replies];

    replyList.forEach((reply, index) => {
      window.setTimeout(() => appendAiChatMessage(messages, "Easy Loan AI", reply), index * 380);
    });
  }, 520);
};

const queueFloatingAiFollowUp = (chat) => {
  if (!chat || chat.dataset.aiFollowUpQueued === "true") {
    return;
  }

  chat.dataset.aiFollowUpQueued = "true";
  window.setTimeout(() => {
    const panel = chat.querySelector("[data-floating-ai-panel]");
    const messages = chat.querySelector("[data-ai-chat-messages]");

    if (!panel || panel.hidden || chat.dataset.aiUserStarted === "true") {
      return;
    }

    appendAiChatMessage(messages, "Easy Loan AI", "You can ask me things like: how to apply, why your balance changed, how to pay, or what documents are missing.");
  }, 4500);
};

const ensureFloatingAiChat = () => {
  if (!document.body.classList.contains("user-body") || document.querySelector("[data-floating-ai-chat]")) {
    return;
  }

  const chat = document.createElement("aside");
  chat.className = "floating-ai-chat";
  chat.dataset.floatingAiChat = "";
  chat.innerHTML = `
    <button class="floating-ai-chat-toggle" type="button" data-floating-ai-toggle aria-label="Open AI assistant" aria-expanded="false">
      <span class="material-symbols-outlined">smart_toy</span>
      <strong>AI Help</strong>
    </button>
    <section class="floating-ai-chat-panel" data-floating-ai-panel hidden>
      <div class="floating-ai-chat-head">
        <div><span class="material-symbols-outlined">smart_toy</span></div>
        <div>
          <strong>Easy Loan AI</strong>
          <small>Borrower assistant</small>
        </div>
        <button class="icon-button" type="button" data-floating-ai-close aria-label="Close AI assistant"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="floating-ai-chat-suggestions">
        <button type="button" data-ai-chat-suggestion="How do I apply for a loan?">Apply</button>
        <button type="button" data-ai-chat-suggestion="How can I check my loan status?">Status</button>
        <button type="button" data-ai-chat-suggestion="How do I submit a payment?">Payment</button>
        <button type="button" data-ai-chat-suggestion="What documents do I need?">Docs</button>
      </div>
      <div class="ai-chat-messages floating-ai-chat-messages" data-ai-chat-messages aria-live="polite">
        <article class="ai-chat-message is-ai">
          <span class="material-symbols-outlined">smart_toy</span>
          <div><strong>Easy Loan AI</strong><p>Hello! Ask me about loans, payments, documents, balances, or account help.</p></div>
        </article>
      </div>
      <form class="ai-chat-form floating-ai-chat-form" data-ai-chat-form>
        <label class="field">
          <span>Message</span>
          <input type="text" data-ai-chat-input placeholder="Type a message..." autocomplete="off" required>
        </label>
        <button class="btn btn-primary" type="submit" aria-label="Send message"><span class="material-symbols-outlined">send</span></button>
      </form>
    </section>
  `;
  document.body.append(chat);
};

const renderUserData = (root = document) => {
  hydrateUserData(root);
  renderUserLoans(root);
  renderUserLoanEditor(root);
  renderUserLoanStatus(root);
  renderUserStats(root);
  renderUserPayments(root);
  renderUserRemainingBalance(root);
  renderUserDocuments(root);
  consumePendingLoanEdit();
  syncLoanAgreementState();
  syncCustomLoanTermFields(root);
  syncCustomLoanPurposeFields(root);
  updateLoanReviewPreview(root);
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
          <td>
            <div class="admin-table-actions">
              <button class="btn admin-action-btn admin-action-view" type="button" data-action="Borrower profile loaded.">Profile</button>
              <button class="btn admin-action-btn admin-action-block" type="button" data-action="Borrower account blocked for review.">Block</button>
              <button class="btn admin-action-btn admin-action-remove" type="button" data-action="Borrower removal queued for admin confirmation.">Remove</button>
            </div>
          </td>
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
            <div class="admin-table-actions">
              <button class="btn admin-action-btn admin-action-approve" type="button" data-admin-loan-status="Approved" data-loan-id="${escapeHtml(application.id)}">Approve</button>
              <button class="btn admin-action-btn admin-action-reject" type="button" data-admin-loan-status="Rejected" data-loan-id="${escapeHtml(application.id)}">Reject</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
};

const renderAdminLoanPlansTable = (tbody) => {
  tbody.innerHTML = defaultLoanPlans
    .map((plan) => {
      const applicantCount = getAllApplications().filter((application) => {
        const selectedPlan = application.formData?.selectedPlan || application.formData?.loanPurpose || application.purpose || "";
        return String(selectedPlan).toLowerCase().includes(plan.category.toLowerCase());
      }).length;

      return `
        <tr>
          <td><strong>${escapeHtml(plan.name)}</strong><br><small>${escapeHtml(plan.amount)}</small></td>
          <td>${escapeHtml(plan.category)}</td>
          <td>${escapeHtml(plan.rate)}</td>
          <td>${escapeHtml(plan.term)}</td>
          <td><span class="status good">${escapeHtml(plan.status)}</span><br><small>${applicantCount} applicant${applicantCount === 1 ? "" : "s"}</small></td>
          <td><button class="btn secondary" type="button" data-action="${escapeHtml(plan.name)} is connected to borrower loan plan applications.">Open</button></td>
        </tr>
      `;
    })
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

const documentPriority = (document) => {
  const type = String(document?.type || "").toLowerCase();

  if (type.includes("government id")) return 5;
  if (type.includes("proof of income")) return 5;
  if (type.includes("selfie")) return 5;
  if (type.includes("signature")) return 5;
  if (type.includes("valid id")) return 4;
  return 1;
};

const dedupeDocumentsByFile = (documents = []) => {
  const map = new Map();

  documents.forEach((document) => {
    const fileName = String(document.fileName || "").trim();

    if (!fileName || fileName === "Not uploaded" || fileName === "No file selected") {
      return;
    }

    const key = fileName.toLowerCase();
    const existing = map.get(key);

    if (!existing || documentPriority(document) > documentPriority(existing)) {
      map.set(key, document);
    }
  });

  return [...map.values()];
};

const validAdminDocuments = (documents = []) => dedupeDocumentsByFile(documents);

const formatAdminDocumentList = (documents = []) => {
  const uploadedDocuments = validAdminDocuments(documents);

  if (!uploadedDocuments.length) {
    return `<span class="muted">No uploaded files</span>`;
  }

  return `
    <div class="admin-doc-list">
      ${uploadedDocuments
        .map(
          (document) => `
            <span>
              <strong>${escapeHtml(document.type || "Document")}</strong>
              <small>${escapeHtml(document.fileName || "No file name")} · ${escapeHtml(document.status || "For Review")}</small>
            </span>
          `
        )
        .join("")}
    </div>
  `;
};

const requiredVerificationDocuments = [
  { label: "Government ID", patterns: [/government id/i, /valid id/i] },
  { label: "Proof of Income", patterns: [/proof of income/i, /income/i] },
  { label: "Selfie with ID", patterns: [/selfie/i] },
  { label: "Borrower Signature", patterns: [/signature/i] },
];

const missingVerificationDocuments = (documents = []) => {
  const uploadedDocuments = validAdminDocuments(documents);

  return requiredVerificationDocuments
    .filter((required) => !uploadedDocuments.some((document) => required.patterns.some((pattern) => pattern.test(document.type || ""))))
    .map((required) => required.label);
};

const formatAdminVerificationDocuments = (documents = []) => {
  const uploadedDocuments = validAdminDocuments(documents);
  const missingDocuments = missingVerificationDocuments(uploadedDocuments);

  if (!uploadedDocuments.length) {
    return `<div class="admin-doc-list"><span class="is-missing"><strong>No uploaded files</strong><small>Missing: ${missingDocuments.map(escapeHtml).join(", ")}</small></span></div>`;
  }

  return `
    <div class="admin-doc-list">
      ${uploadedDocuments
        .map(
          (document) => `
            <span>
              <strong>${escapeHtml(document.type || "Document")}</strong>
              <small>${escapeHtml(document.fileName || "No file name")} - ${escapeHtml(document.status || "For Review")}</small>
            </span>
          `
        )
        .join("")}
      ${
        missingDocuments.length
          ? `<span class="is-missing"><strong>Missing requirements</strong><small>${missingDocuments.map(escapeHtml).join(", ")}</small></span>`
          : `<span class="is-complete"><strong>Required files complete</strong><small>Ready for admin review</small></span>`
      }
    </div>
  `;
};

const adminVerificationDetailsFor = (email, loanId) => {
  const store = readUserStore();
  const user = store[String(email || "").toLowerCase()];

  if (!user) {
    return {};
  }

  const applications = user.applications || [];
  const application = applications.find((item) => item.id === loanId) || applications[0] || null;
  const formData = application?.formData || {};
  const directDocuments = validAdminDocuments(user.documents || []);
  const applicationDocuments = validAdminDocuments(application?.documents || []);
  const allDocuments = [...applicationDocuments, ...directDocuments];

  return {
    "User ID": user.userId || "",
    Borrower: user.name || nameFromEmail(user.email || email),
    Email: user.email || email,
    Contact: user.contact || formData.contact || "No contact saved",
    Address: user.address || [formData.street, formData.barangay, formData.city, formData.province].filter(Boolean).join(", "),
    "Loan ID": application?.id || "No loan submitted",
    "Loan Amount": application?.amount ? formatPeso(application.amount) : "",
    "Loan Purpose": application?.purpose || "",
    "Loan Term": application?.term || "",
    "Payment Schedule": application?.schedule || "",
    Status: application?.status || (allDocuments.length ? "For Review" : "Registered"),
    "Monthly Income": formData.monthlyIncome || "",
    "Monthly Expenses": formData.monthlyExpenses || "",
    Employer: formData.employer || "",
    "Bank Name": formData.bankName || "",
    "Bank Account": formData.bankAccount || "",
    "Uploaded IDs and Files": allDocuments.length
      ? allDocuments.map((document) => `${document.type}: ${document.fileName} (${document.status || "For Review"})`).join("; ")
      : "No uploaded files saved",
  };
};

const renderAdminVerificationTable = (tbody) => {
  const borrowers = getAllBorrowers();
  const rows = borrowers.flatMap((user) => {
    const applications = user.applications || [];
    const directDocuments = validAdminDocuments(user.documents || []);

    if (!applications.length) {
      return [{
        user,
        application: null,
        documents: directDocuments,
      }];
    }

    return applications.map((application, index) => ({
      user,
      application,
      documents: dedupeDocumentsByFile([...validAdminDocuments(application.documents || []), ...(index === 0 ? directDocuments : [])]),
    }));
  });

  if (!rows.length) {
    renderEmptyAdminRow(tbody, 6, "borrower verification records");
    return;
  }

  tbody.innerHTML = rows
    .map(({ user, application, documents }) => {
      const borrower = user.name || nameFromEmail(user.email || "user@example.com");
      const email = user.email || "";
      const formData = application?.formData || {};
      const contact = user.contact || formData.contact || "No contact saved";
      const missingDocuments = missingVerificationDocuments(documents);
      const status = application?.status || (documents.length ? "For Review" : "Registered");
      const loanAmount = parseMoneyValue(application?.amount);
      const monthlyIncome = parseMoneyValue(formData.monthlyIncome);
      const termMonths = loanTermMonths(application?.term);
      const monthlyDue = loanAmount && termMonths ? Math.round((loanAmount * 1.05) / termMonths) : 0;
      const incomeShare = monthlyIncome && monthlyDue ? Math.round((monthlyDue / monthlyIncome) * 100) : 0;
      const capacityClass = !monthlyDue ? "warn" : incomeShare <= 35 ? "good" : incomeShare <= 50 ? "warn" : "bad";
      const capacityText = monthlyDue
        ? `${formatPeso(monthlyDue)} monthly due (${incomeShare}% of income)`
        : "Needs loan amount and income";
      const reviewStatus = missingDocuments.length ? `Missing ${missingDocuments.length}` : status;

      return `
        <tr>
          <td><strong>${escapeHtml(borrower)}</strong><br><small>${escapeHtml(email || "No email saved")}</small></td>
          <td><strong>${escapeHtml(application?.id || "No loan submitted")}</strong><br><small>${application?.amount ? `${formatPeso(application.amount)} - ${escapeHtml(application.purpose || "Loan")}` : "No amount"}</small><br><small>${escapeHtml(application?.term || "No term")} - ${escapeHtml(contact)}</small></td>
          <td>
            <div class="admin-table-actions">
              <button class="btn admin-action-btn admin-action-view" type="button" data-admin-view-documents="${escapeHtml(email)}" data-admin-view-documents-loan="${escapeHtml(application?.id || "")}">View</button>
              <button class="btn admin-action-btn admin-action-approve" type="button" data-document-proof-download="${escapeHtml(application?.id || email || "borrower-documents")}">Download</button>
            </div>
            <small>${validAdminDocuments(documents).length} uploaded, ${missingDocuments.length} missing</small>
          </td>
          <td><span class="status ${capacityClass}">${escapeHtml(capacityText)}</span><br><small>Income: ${monthlyIncome ? formatPeso(monthlyIncome) : "Not provided"}</small></td>
          <td><span class="status ${missingDocuments.length ? "bad" : statusClass(status)}">${escapeHtml(reviewStatus)}</span></td>
          <td><div class="admin-row-actions"><button class="btn secondary" type="button" data-admin-verification-email="${escapeHtml(email)}" data-admin-verification-loan="${escapeHtml(application?.id || "")}" data-action="Borrower verification opened.">Review</button>${application ? `<button class="btn secondary" type="button" data-admin-loan-status="Approved" data-loan-id="${escapeHtml(application.id)}">Approve</button>` : ""}</div></td>
        </tr>
      `;
    })
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

const adminPaymentsExportRows = () =>
  getAllBorrowers().flatMap((user) =>
    (user.payments || []).map((payment) => ({
      "Payment ID": payment.id || "",
      "Loan ID": payment.loanId || "",
      Borrower: user.name || nameFromEmail(user.email || "user@example.com"),
      Email: user.email || "",
      Amount: formatPeso(payment.amount),
      Method: payment.method || "",
      Reference: payment.reference || payment.receipt || "",
      Status: payment.status || "",
      "Date Paid": payment.submittedAt || "",
    }))
  );

const adminActivitiesExportRows = () =>
  getAllBorrowers().flatMap((user) =>
    (user.activities || []).map((activity) => ({
      Time: activity.submittedAt || activity.id || "",
      Admin: activity.user?.name || user.name || nameFromEmail(user.email || "admin@example.com"),
      Borrower: user.name || nameFromEmail(user.email || "user@example.com"),
      Activity: `${activity.action || activity.source || "Activity"}: ${Object.entries(activity.fields || {}).map(([key, value]) => `${key}: ${value}`).join("; ")}`,
      Status: activity.status || "Saved",
    }))
  );

const adminReportExportRows = () => {
  const borrowers = getAllBorrowers();
  const applications = getAllApplications();
  const payments = borrowers.flatMap((user) => (user.payments || []).map((payment) => ({ ...payment, user })));
  const totalLoanAmount = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const totalPaid = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const approvedLoans = applications.filter((application) => /approved/i.test(application.status || "")).length;
  const pendingLoans = applications.filter((application) => /pending|review/i.test(application.status || "")).length;
  const reportDate = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  return [
    { "Report ID": "RPT-BORROWERS", Report: "Borrower Summary", Period: reportDate, Metric: borrowers.length, Amount: "", Status: "Ready" },
    { "Report ID": "RPT-LOANS", Report: "Loan Applications", Period: reportDate, Metric: applications.length, Amount: formatPeso(totalLoanAmount), Status: "Ready" },
    { "Report ID": "RPT-PAYMENTS", Report: "Payment Collections", Period: reportDate, Metric: payments.length, Amount: formatPeso(totalPaid), Status: "Ready" },
    { "Report ID": "RPT-APPROVED", Report: "Approved Loans", Period: reportDate, Metric: approvedLoans, Amount: "", Status: "Ready" },
    { "Report ID": "RPT-PENDING", Report: "Pending Reviews", Period: reportDate, Metric: pendingLoans, Amount: "", Status: "Ready" },
  ];
};

const renderAdminReportsTable = (tbody) => {
  const rows = adminReportExportRows();

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row["Report ID"])}</td>
          <td>${escapeHtml(row.Report)}<br><small>${escapeHtml(row.Amount || `${row.Metric} record${row.Metric === 1 ? "" : "s"}`)}</small></td>
          <td>${escapeHtml(row.Period)}</td>
          <td><span class="status good">${escapeHtml(row.Status)}</span></td>
          <td><button class="btn secondary" type="button" data-admin-report-download="${escapeHtml(row["Report ID"])}">Download</button></td>
        </tr>
      `
    )
    .join("");
};

const csvEscape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const downloadCsvFile = (fileName, rows) => {
  if (!rows.length) {
    downloadTextFile(fileName.replace(/\.csv$/i, ".txt"), ["No records available for this admin copy."]);
    return;
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 250);
};

const adminExportFileName = (label) => {
  const date = new Date().toISOString().slice(0, 10);
  const slug = String(label || "admin-copy").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `easy-loan-${slug}-${date}.csv`;
};

const adminExportRowsForPage = () => {
  const page = String(document.body.dataset.page || "").toLowerCase();

  if (page.includes("payment")) {
    return {
      label: "payments",
      rows: adminPaymentsExportRows(),
    };
  }

  if (page.includes("activity")) {
    return {
      label: "activity-logs",
      rows: adminActivitiesExportRows(),
    };
  }

  if (page.includes("report") || page.includes("analytics") || page.includes("statistics")) {
    return {
      label: page || "reports",
      rows: adminReportExportRows(),
    };
  }

  return null;
};

const downloadAdminPageCopy = () => {
  const exportData = adminExportRowsForPage();

  if (!exportData) {
    showAdminToast("No admin export is configured for this page yet.");
    return false;
  }

  downloadCsvFile(adminExportFileName(exportData.label), exportData.rows);
  showAdminToast("Admin copy downloaded.");
  return true;
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
        <button class="btn admin-action-btn admin-action-approve" type="button" data-admin-loan-status="Approved" data-loan-id="${escapeHtml(application.id)}">Approve</button>
        <button class="btn admin-action-btn admin-action-reject" type="button" data-admin-loan-status="Rejected" data-loan-id="${escapeHtml(application.id)}">Reject</button>
      </div>
    `;
  });
};

const renderAdminDashboardStats = (root = document) => {
  const applications = getAllApplications();
  const borrowers = getAllBorrowers();
  const pendingCount = applications.filter((application) => String(application.status || "").toLowerCase() === "pending").length;
  const totalAmount = applications.reduce((total, application) => total + Number(application.amount || 0), 0);
  const uploadedDocumentCount = borrowers.reduce(
    (total, user) =>
      total +
      validAdminDocuments(user.documents || []).length +
      (user.applications || []).reduce((sum, application) => sum + validAdminDocuments(application.documents || []).length, 0),
    0
  );
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

  if ((document.body.dataset.page || "").includes("borrower")) {
    setCard(cards[0], "Borrowers", String(borrowers.length), "Registered users");
    setCard(cards[1], "Pending reviews", String(pendingCount), "Need verification");
    setCard(cards[2], "Applications", String(applications.length), "Submitted loans");
    setCard(cards[3], "Uploaded files", String(uploadedDocumentCount), "IDs and proof files");
    return;
  }

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
  return parseMoneyValue(value);
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
  if (button.dataset.adminVerificationEmail) {
    return adminVerificationDetailsFor(button.dataset.adminVerificationEmail, button.dataset.adminVerificationLoan);
  }

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

const adminDocumentBundleFor = (email, loanId) => {
  const store = readUserStore();
  const user = store[String(email || "").toLowerCase()] || null;

  if (!user) {
    return { user: null, application: null, documents: [] };
  }

  const applications = user.applications || [];
  const application = applications.find((item) => item.id === loanId) || applications[0] || null;
  const documents = dedupeDocumentsByFile([
    ...validAdminDocuments(application?.documents || []),
    ...validAdminDocuments(user.documents || []),
  ]);

  return { user, application, documents };
};

const adminInfoRows = (items) =>
  items
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `<div class="admin-info-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

const ensureAdminDocumentsModal = () => {
  let modal = document.querySelector("[data-admin-documents-modal]");

  if (modal) {
    return modal;
  }

  modal = document.createElement("div");
  modal.className = "modal-backdrop admin-modal-backdrop";
  modal.hidden = true;
  modal.dataset.adminDocumentsModal = "";
  modal.innerHTML = `
    <section class="admin-detail-modal admin-documents-modal" role="dialog" aria-modal="true" aria-labelledby="admin-documents-title">
      <button class="icon-button modal-close" type="button" data-admin-documents-close aria-label="Close documents">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="admin-detail-modal-head">
        <p class="eyebrow">borrower full review</p>
        <h2 id="admin-documents-title">Borrower Details</h2>
      </div>
      <div class="admin-documents-modal-body" data-admin-documents-body></div>
    </section>
  `;
  document.body.append(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest("[data-admin-documents-close]")) {
      modal.hidden = true;
      document.body.style.overflow = "";
    }
  });

  return modal;
};

const openAdminDocumentsModal = (button) => {
  const modal = ensureAdminDocumentsModal();
  const body = modal.querySelector("[data-admin-documents-body]");
  const { user, application, documents } = adminDocumentBundleFor(button.dataset.adminViewDocuments, button.dataset.adminViewDocumentsLoan);
  const borrower = user ? user.name || nameFromEmail(user.email || "") : "Borrower";
  const formData = application?.formData || {};
  const missingDocuments = missingVerificationDocuments(documents);
  const address = user?.address || [formData.street, formData.barangay, formData.city, formData.province].filter(Boolean).join(", ");
  const loanAmount = parseMoneyValue(application?.amount);
  const monthlyIncome = parseMoneyValue(formData.monthlyIncome);
  const termMonths = loanTermMonths(application?.term);
  const monthlyDue = loanAmount && termMonths ? Math.round((loanAmount * 1.05) / termMonths) : 0;
  const totalPayable = loanAmount ? Math.round(loanAmount * 1.05) : 0;

  modal.querySelector("#admin-documents-title").textContent = `${borrower} Full Details`;
  body.innerHTML = `
    <div class="admin-documents-summary">
      <article><span>Loan ID</span><strong>${escapeHtml(application?.id || "No loan")}</strong></article>
      <article><span>Status</span><strong>${escapeHtml(application?.status || "For Review")}</strong></article>
      <article><span>Documents</span><strong>${documents.length} uploaded / ${missingDocuments.length} missing</strong></article>
    </div>
    <div class="admin-borrower-detail-grid">
      <section class="admin-borrower-detail-card">
        <h3>Borrower Information</h3>
        ${adminInfoRows([
          ["Full Name", borrower],
          ["Email", user?.email],
          ["Contact Number", user?.contact || formData.contact],
          ["Address", address],
          ["Emergency Contact", formData.emergencyName],
          ["Emergency Number", formData.emergencyContact],
        ]) || `<p class="muted">No borrower information saved.</p>`}
      </section>
      <section class="admin-borrower-detail-card">
        <h3>Loan Information</h3>
        ${adminInfoRows([
          ["Application ID", application?.id],
          ["Loan Amount", application?.amount ? formatPeso(application.amount) : ""],
          ["Purpose", application?.purpose],
          ["Term", application?.term],
          ["Payment Schedule", application?.schedule],
          ["Submitted", application?.submittedAt],
        ]) || `<p class="muted">No loan information saved.</p>`}
      </section>
      <section class="admin-borrower-detail-card">
        <h3>Income and Bank Details</h3>
        ${adminInfoRows([
          ["Monthly Income", monthlyIncome ? formatPeso(monthlyIncome) : formData.monthlyIncome],
          ["Monthly Expenses", formData.monthlyExpenses],
          ["Employer / Business", formData.employer],
          ["Bank Name", formData.bankName],
          ["Bank Account", formData.bankAccount],
          ["Estimated Monthly Due", monthlyDue ? formatPeso(monthlyDue) : ""],
          ["Total Payable", totalPayable ? formatPeso(totalPayable) : ""],
        ]) || `<p class="muted">No income or bank information saved.</p>`}
      </section>
      <section class="admin-borrower-detail-card">
        <h3>Document Checklist</h3>
        ${adminInfoRows([
          ["Uploaded Files", String(documents.length)],
          ["Missing Requirements", missingDocuments.length ? missingDocuments.join(", ") : "None"],
        ])}
      </section>
    </div>
    <h3 class="admin-documents-section-title">Uploaded Pictures and Files</h3>
    <div class="admin-document-preview-grid">
      ${
        documents.length
          ? documents
              .map(
                (document) => `
                  <article class="admin-document-preview-card">
                    <div class="admin-document-preview-media">
                      ${
                        document.previewDataUrl
                          ? `<img src="${document.previewDataUrl}" alt="${escapeHtml(document.type || "Uploaded document")} preview">`
                          : `<div class="admin-document-placeholder"><span class="material-symbols-outlined">image</span><strong>No image preview</strong><small>${escapeHtml(document.fileName || "File name unavailable")}</small></div>`
                      }
                    </div>
                    <div>
                      <h3>${escapeHtml(document.type || "Document")}</h3>
                      <p>${escapeHtml(document.fileName || "No file name saved")}</p>
                      <span class="status ${statusClass(document.status)}">${escapeHtml(document.status || "For Review")}</span>
                      <div class="admin-document-actions">
                        <button class="btn-secondary" type="button" data-document-proof-download="${escapeHtml(document.fileName || document.type || "borrower-document")}">
                          <span class="material-symbols-outlined">download</span>Download
                        </button>
                      </div>
                    </div>
                  </article>
                `
              )
              .join("")
          : `<article class="admin-document-preview-card"><div class="admin-document-placeholder"><span class="material-symbols-outlined">folder_off</span><strong>No uploaded documents</strong><small>The borrower has not submitted files yet.</small></div></article>`
      }
    </div>
  `;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
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

    if ((headings.includes("uploaded files") || headings.includes("submitted documents")) && headings.includes("borrower")) {
      renderAdminVerificationTable(tbody);
    } else if (headings.includes("activity id") || headings.includes("activity")) {
      renderAdminActivitiesTable(tbody);
    } else if (headings.includes("user id")) {
      renderAdminUsersTable(tbody);
    } else if (headings.includes("document id")) {
      renderAdminDocumentsTable(tbody);
    } else if (headings.includes("payment id")) {
      renderAdminPaymentsTable(tbody);
    } else if (headings.includes("loan id") && headings.includes("borrower")) {
      renderAdminLoansTable(tbody);
    } else if (headings.includes("plan") && headings.includes("category") && headings.includes("rate")) {
      renderAdminLoanPlansTable(tbody);
    } else if (headings.includes("report id") && headings.includes("report")) {
      renderAdminReportsTable(tbody);
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

const shouldOpenLoginModalFromLocation = () => {
  const params = new URLSearchParams(window.location.search);
  return params.has("login") || params.get("modal") === "login" || window.location.hash === "#login";
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

  if (shouldOpenLoginModalFromLocation()) {
    window.setTimeout(openLoginModal, 0);
  }
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLoginModal();
    closeLoanAgreementModal();
    closeProfilePictureViewer();
    document.querySelectorAll("[data-payment-qr-modal]").forEach((modal) => {
      modal.hidden = true;
    });
    document.querySelectorAll("[data-bank-transfer-modal]").forEach((modal) => {
      modal.hidden = true;
    });
    document.body.classList.remove("modal-open");
  }
});

loginForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setButtonLoading(form.querySelector('button[type="submit"]'), true, "Signing in");
    showGlobalLoading("Signing you in...", { title: "Welcome back" });
    saveCurrentUser({
      email: getInputValue(form, "email"),
      contact: getInputValue(form, "contact"),
    });
    window.location.href = form.dataset.redirect || "user/dashboard.html";
  });
});

adminLoginForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setButtonLoading(form.querySelector('button[type="submit"]'), true, "Opening");
    showGlobalLoading("Opening the admin dashboard...", { title: "Checking access" });
    window.location.href = form.dataset.redirect || "dashboard.html";
  });
});

registerForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    setButtonLoading(form.querySelector('button[type="submit"]'), true, "Creating");
    showGlobalLoading("Creating your Easy Loan profile...", { title: "Setting up account" });
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
window.addEventListener("pageshow", () => {
  hideGlobalLoading();
  syncRenderedData();
});

const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

userNavLinks.forEach((link) => {
  const hrefPage = link.getAttribute("href").split("/").pop();
  link.classList.toggle("active", hrefPage === currentPage);
});

document.addEventListener("submit", async (event) => {
  const aiChatForm = event.target.closest("[data-ai-chat-form]");

  if (aiChatForm) {
    event.preventDefault();
    const loader = showGlobalLoading("Sending your message...", { title: "Working" });
    sendAiChatMessage(aiChatForm);
    hideGlobalLoading(loader);
    return;
  }

  const planPaymentForm = event.target.closest("[data-loan-plan-payment-form]");

  if (planPaymentForm) {
    event.preventDefault();
    updateLoanPlanEstimate(planPaymentForm.closest("[data-loan-plan-modal]"));
    return;
  }

  const form = event.target.closest("[data-demo-form]");

  if (!form) {
    return;
  }

  if (event.defaultPrevented) {
    return;
  }

  event.preventDefault();
  if (form.classList.contains("loan-application-form") && !hasAcceptedLoanAgreement(form)) {
    openLoanAgreementModal();
    const message = form.querySelector("[data-form-message]");
    if (message) {
      message.textContent = "Please read and accept the loan agreement before submitting.";
    }
    showToast("Please read and accept the loan agreement before submitting.", { type: "warning" });
    return;
  }

  const loader = showGlobalLoading("Saving your information securely...", { title: "Processing" });
  const submitButton = form.querySelector('button[type="submit"]');
  setButtonLoading(submitButton, true, isPaymentForm(form) ? "Submitting" : "Saving");

  try {
    await captureFormFilePreviews(form);
    saveUserInputsFromForm(form);
    let savedPayment = null;
    if (form.classList.contains("loan-application-form")) {
      saveLoanApplication(form);
    }
    if (isPaymentForm(form)) {
      savedPayment = savePaymentRecord(form);
      downloadPaymentProof(savedPayment);
    }
    if (isDocumentForm(form)) {
      saveDocumentRecord(form);
    }
    syncRenderedData();
    const message = form.querySelector("[data-form-message]");

    if (message) {
      message.textContent = savedPayment ? "Payment submitted. Proof downloaded." : "Saved for the current user.";
    }

    showToast(savedPayment ? "Payment submitted. Proof downloaded." : "Saved for the current user.", { type: "success" });

    const loanEditModal = form.closest("[data-loan-edit-modal]");
    if (loanEditModal && form.classList.contains("loan-application-form")) {
      loanEditModal.hidden = true;
      document.body.classList.remove("modal-open");
    }
  } catch (error) {
    showToast("Something went wrong while processing your request. Please try again.", { type: "error" });
  } finally {
    setButtonLoading(submitButton, false);
    hideGlobalLoading(loader);
  }
});

document.addEventListener("reset", (event) => {
  const form = event.target.closest(".loan-application-form");

  if (!form) {
    return;
  }

  delete form.dataset.editingLoanId;
  form.querySelectorAll('input[type="file"][data-loan-file-required="true"]').forEach((input) => {
    input.required = true;
    delete input.dataset.loanFileRequired;
  });
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector("[data-form-message]");

  if (submitButton) {
    submitButton.textContent = "Submit Application";
  }

  if (message) {
    message.textContent = "";
  }
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("[data-user-input], [data-user-modal-input]");
  const loanInput = event.target.closest(".loan-application-form input, .loan-application-form select, .loan-application-form textarea");
  const planAmountInput = event.target.closest("[data-plan-preview-amount]");

  if (!input && !loanInput && !planAmountInput) {
    return;
  }

  if (input) {
    liveUpdateUserField(input);
  }

  if (loanInput) {
    if (loanInput.matches("[data-money-input]")) {
      loanInput.value = formatNumberWithCommas(loanInput.value);
    }
    loanInput.closest(".field")?.classList.toggle("is-invalid", !loanInput.checkValidity());
    syncCustomLoanTermFields(loanInput.closest("[data-loan-edit-modal]") || document);
    syncCustomLoanPurposeFields(loanInput.closest("[data-loan-edit-modal]") || document);
    updateLoanReviewPreview(loanInput.closest(".loan-application-form"));
  }

  if (planAmountInput) {
    planAmountInput.value = formatNumberWithCommas(planAmountInput.value);
    updateLoanPlanEstimate(planAmountInput.closest("[data-loan-plan-modal]"));
  }
});

document.addEventListener("change", (event) => {
  const profilePictureInput = event.target.closest("[data-profile-picture-input]");

  if (!profilePictureInput) {
    return;
  }

  const file = profilePictureInput.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file for your profile picture.", { type: "warning" });
    profilePictureInput.value = "";
    return;
  }

  const reader = new FileReader();
  const loader = showGlobalLoading("Updating your profile picture...", { title: "Uploading image" });

  reader.addEventListener("load", () => {
    const updatedUser = saveCurrentUserProfile({ profilePicture: reader.result || "" });
    applyUserSnapshotToDom(updatedUser);
    profilePictureInput.value = "";
    showToast("Profile picture updated.", { type: "success" });
    hideGlobalLoading(loader);
  });

  reader.addEventListener("error", () => {
    showToast("The profile picture could not be uploaded. Please try another image.", { type: "error" });
    profilePictureInput.value = "";
    hideGlobalLoading(loader);
  });

  reader.readAsDataURL(file);
});

document.addEventListener("change", (event) => {
  const field = event.target.closest("[data-loan-term-select], [name='customLoanYears'], [name='customLoanMonths'], [data-loan-purpose-select], [name='customLoanPurpose']");

  if (!field) {
    return;
  }

  syncCustomLoanTermFields(field.closest("[data-loan-edit-modal]") || document);
  syncCustomLoanPurposeFields(field.closest("[data-loan-edit-modal]") || document);
  field.closest(".field")?.classList.toggle("is-invalid", !field.checkValidity());
  updateLoanReviewPreview(field.closest(".loan-application-form"));
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

  const loader = showGlobalLoading(`Loading ${link.textContent.trim()}...`, { title: "Loading section" });
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
  } finally {
    hideGlobalLoading(loader);
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

    showBriefGlobalLoading(`Opening ${link.textContent.trim()}...`, { title: "Loading section" });
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
ensureFloatingAiChat();
renderUserData();
renderAdminData();
loadUserStoreFromServer();

document.querySelectorAll(".sign-out-link, a[href$='logout.html']").forEach((link) => {
  link.addEventListener("click", () => {
    localStorage.removeItem(userSessionKey);
  });
});

document.addEventListener("click", (event) => {
  const profilePictureTarget = event.target.closest(".member-avatar-upload, .profile-picture-upload");
  const viewerClose = event.target.closest("[data-profile-picture-viewer-close]");
  const viewerBackdrop = event.target.matches("[data-profile-picture-viewer]") ? event.target : null;

  if (!profilePictureTarget && !viewerClose && !viewerBackdrop) {
    return;
  }

  if (viewerClose || viewerBackdrop) {
    event.preventDefault();
    event.stopPropagation();
    closeProfilePictureViewer();
    return;
  }

  const currentUser = getCurrentUser();
  const imageUrl = currentUser?.profilePicture || "";

  if (!imageUrl) {
    return;
  }

  const bounds = profilePictureTarget.getBoundingClientRect();
  const clickedCameraCorner = event.clientX >= bounds.right - 30 && event.clientY >= bounds.bottom - 30;

  if (clickedCameraCorner) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  openProfilePictureViewer(imageUrl);
});

document.addEventListener("click", (event) => {
  const stepButton = event.target.closest("[data-loan-step]");

  if (!stepButton) {
    return;
  }

  event.preventDefault();
  const form = stepButton.closest(".loan-application-form") || document.querySelector(".loan-application-form");
  const step = stepButton.dataset.loanStep;
  if (step === "details" && !hasAcceptedLoanAgreement(form)) {
    openLoanAgreementModal();
    return;
  }

  showBriefGlobalLoading("Preparing loan step...", { title: "Loading step" });
  setLoanApplicationStep(step, form);
});

document.addEventListener("click", (event) => {
  const nextButton = event.target.closest("[data-loan-next-step]");

  if (!nextButton) {
    return;
  }

  event.preventDefault();
  const form = nextButton.closest(".loan-application-form") || document.querySelector(".loan-application-form");
  const step = nextButton.dataset.loanNextStep;

  if (!hasAcceptedLoanAgreement(form)) {
    openLoanAgreementModal();
    return;
  }

  if (step === "review" && !validateLoanStep("details", form)) {
    setLoanApplicationStep("details", form);
    return;
  }

  if (step === "submit" && !validateLoanStep("review", form)) {
    setLoanApplicationStep("review", form);
    return;
  }

  showBriefGlobalLoading("Preparing loan step...", { title: "Loading step" });
  setLoanApplicationStep(step, form);
});

document.addEventListener("click", (event) => {
  const modalBackdrop = event.target.matches("[data-loan-agreement-modal]") ? event.target : null;
  const closeButton = event.target.closest("[data-loan-agreement-close]");
  const acceptButton = event.target.closest("[data-loan-agreement-accept]");

  if (!modalBackdrop && !closeButton && !acceptButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (acceptButton) {
    acceptLoanAgreement();
    return;
  }

  closeLoanAgreementModal();
});

document.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-loan-edit]");
  const deleteButton = event.target.closest("[data-loan-delete]");

  if (!editButton && !deleteButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (editButton) {
    showBriefGlobalLoading("Opening loan editor...", { title: "Loading loan" });
    openLoanEditor(editButton.dataset.loanEdit);
    return;
  }

  const loanId = deleteButton.dataset.loanDelete;
  const confirmed = window.confirm(`Delete loan application ${loanId}? Linked payment records for this loan will also be removed.`);

  if (confirmed) {
    showBriefGlobalLoading("Removing loan application...", { title: "Updating loans" });
    deleteLoanApplication(loanId);
  }
});

document.addEventListener("click", (event) => {
  const floatingToggle = event.target.closest("[data-floating-ai-toggle]");
  const floatingClose = event.target.closest("[data-floating-ai-close]");

  if (!floatingToggle && !floatingClose) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  const chat = (floatingToggle || floatingClose).closest("[data-floating-ai-chat]") || document.querySelector("[data-floating-ai-chat]");
  const panel = chat?.querySelector("[data-floating-ai-panel]");
  const toggle = chat?.querySelector("[data-floating-ai-toggle]");
  const shouldOpen = Boolean(floatingToggle);

  if (panel) {
    panel.hidden = !shouldOpen;
  }

  toggle?.setAttribute("aria-expanded", String(shouldOpen));

  if (shouldOpen) {
    chat?.querySelector("[data-ai-chat-input]")?.focus();
    queueFloatingAiFollowUp(chat);
  }
});

document.addEventListener("click", (event) => {
  const aiSuggestion = event.target.closest("[data-ai-chat-suggestion]");

  if (!aiSuggestion) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  const chatRoot = aiSuggestion.closest(".ai-chat-shell") || aiSuggestion.closest("[data-floating-ai-chat]");
  const form = chatRoot?.querySelector("[data-ai-chat-form]");
  sendAiChatMessage(form, aiSuggestion.dataset.aiChatSuggestion);
});

document.addEventListener("click", (event) => {
  const planButton = event.target.closest("[data-loan-plan-open]");
  const closeButton = event.target.closest("[data-loan-plan-close]");
  const applyButton = event.target.closest("[data-plan-apply-link]");
  const backdrop = event.target.matches("[data-loan-plan-modal]") ? event.target : null;

  if (!planButton && !closeButton && !applyButton && !backdrop) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (planButton) {
    openLoanPlanModal(planButton);
    return;
  }

  if (applyButton) {
    const modal = applyButton.closest("[data-loan-plan-modal]");
    const form = modal?.querySelector("[data-loan-plan-payment-form]");
    showBriefGlobalLoading("Saving your selected loan plan...", { title: "Applying plan" });
    submitPlanApplication(form);
    window.setTimeout(() => closeLoanPlanModal(modal), 550);
    return;
  }

  closeLoanPlanModal(closeButton?.closest("[data-loan-plan-modal]") || backdrop);
});

document.addEventListener("click", (event) => {
  const applicationButton = event.target.closest("[data-application-proof-download]");
  const documentButton = event.target.closest("[data-document-proof-download]");

  if (!applicationButton && !documentButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (applicationButton) {
    showBriefGlobalLoading("Preparing application proof...", { title: "Preparing download" });
    downloadApplicationProof(applicationButton.dataset.applicationProofDownload);
    return;
  }

  showBriefGlobalLoading("Preparing document proof...", { title: "Preparing download" });
  downloadDocumentProof(documentButton.dataset.documentProofDownload);
});

document.addEventListener("click", (event) => {
  const receiptButton = event.target.closest("[data-payment-receipt-download]");
  const latestReceiptButton = event.target.closest("[data-latest-payment-receipt-download]");

  if (!receiptButton && !latestReceiptButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (latestReceiptButton) {
    const latestPayment = getUserPayments()[0];

    if (!latestPayment) {
      showToast("No payment receipt is available yet.", { type: "warning" });
      return;
    }

    showBriefGlobalLoading("Preparing payment receipt...", { title: "Preparing download" });
    downloadPaymentReceipt(latestPayment.id);
    return;
  }

  showBriefGlobalLoading("Preparing payment receipt...", { title: "Preparing download" });
  downloadPaymentReceipt(receiptButton.dataset.paymentReceiptDownload);
});

document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-payment-delete]");

  if (!deleteButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const paymentId = deleteButton.dataset.paymentDelete;
  const confirmed = window.confirm(`Delete payment record ${paymentId}?`);

  if (confirmed) {
    showBriefGlobalLoading("Deleting payment record...", { title: "Updating payments" });
    deletePaymentRecord(paymentId);
  }
});

document.addEventListener("click", (event) => {
  const loanCard = event.target.closest("[data-payment-loan-value]");
  const methodCard = event.target.closest("[data-payment-method-value]");

  if (!loanCard && !methodCard) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (loanCard) {
    showBriefGlobalLoading("Selecting loan for payment...", { title: "Updating payment" });
    const form = loanCard.closest("form");
    const select = form?.querySelector("[data-user-payment-options]");

    form?.querySelectorAll("[data-payment-loan-value]").forEach((card) => {
      card.classList.toggle("is-selected", card === loanCard);
    });

    if (select) {
      select.value = loanCard.dataset.paymentLoanValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  if (methodCard) {
    showBriefGlobalLoading("Setting payment method...", { title: "Updating payment" });
    const form = methodCard.closest("form");
    const methodInput = form?.querySelector("[data-payment-method-input]");
    const method = methodCard.dataset.paymentMethodValue;

    form?.querySelectorAll("[data-payment-method-value]").forEach((card) => {
      card.classList.toggle("is-selected", card === methodCard);
    });

    if (methodInput) {
      methodInput.value = method;
      methodInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    setPaymentQrVisibility(method);
    setBankTransferVisibility(method === "Bank Transfer");
  }
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-payment-qr-close]");
  const backdrop = event.target.matches("[data-payment-qr-modal]") ? event.target : null;

  if (!closeButton && !backdrop) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const modal = closeButton?.closest("[data-payment-qr-modal]") || backdrop;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-bank-transfer-close]");
  const backdrop = event.target.matches("[data-bank-transfer-modal]") ? event.target : null;

  if (!closeButton && !backdrop) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const modal = closeButton?.closest("[data-bank-transfer-modal]") || backdrop;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
});

document.addEventListener("click", (event) => {
  const bankButton = event.target.closest("[data-bank-option]");

  if (!bankButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  showBriefGlobalLoading("Loading bank transfer details...", { title: "Payment method" });
  renderBankTransferDetails(bankButton.dataset.bankOption);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-bank-transfer-form]");

  if (!form) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  const loader = showGlobalLoading("Copying bank details to payment form...", { title: "Updating payment" });

  const bank = form.querySelector("[data-bank-selected-input]")?.value || "BDO";
  const amount = form.querySelector('[name="bankAmount"]')?.value || "";
  const reference = form.querySelector('[name="bankReference"]')?.value || "";
  const sender = form.querySelector('[name="bankSender"]')?.value || "";
  const transferDate = form.querySelector('[name="bankTransferDate"]')?.value || "";
  const bankModal = form.closest("[data-bank-transfer-modal]");
  const paymentForm = document.querySelector(".payment-form");
  const amountInput = paymentForm?.querySelector('[name="paymentAmount"]');
  const referenceInput = paymentForm?.querySelector('[name="reference"]');
  const methodInput = paymentForm?.querySelector("[data-payment-method-input]");

  if (amountInput) {
    amountInput.value = amount;
  }

  if (referenceInput) {
    referenceInput.value = [bank, reference, sender, transferDate].filter(Boolean).join(" | ");
  }

  if (methodInput) {
    methodInput.value = `Bank Transfer - ${bank}`;
  }

  bankModal.hidden = true;
  document.body.classList.remove("modal-open");
  showToast(`${bank} transfer details copied to the payment form.`, { type: "success" });
  hideGlobalLoading(loader);
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
  const action = actionLabelFromButton(target);
  const latestApplication = getUserApplications()[0];

  if (/^edit\s+application$/i.test(action) && latestApplication?.id) {
    openLoanEditor(latestApplication.id);
    return;
  }

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
  ["Loan Plans", "loan plans management/loan-plans.html"],
  ["Payments", "Payments Management/payments.html"],
  ["Reports", "reports and analytics/reports.html"],
  ["Activity Logs", "activity-logs.html"],
  ["Logout", "logout.html"],
];

const showAdminToast = (message, options = {}) => showToast(message, { type: "info", ...options });

document.addEventListener("click", (event) => {
  const documentsButton = event.target.closest("[data-admin-view-documents]");
  const reportDownloadButton = event.target.closest("[data-admin-report-download]");

  if (documentsButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    openAdminDocumentsModal(documentsButton);
    return;
  }

  if (reportDownloadButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    downloadAdminPageCopy();
    return;
  }

  const button = event.target.closest(".admin-page [data-action]");

  if (!button) {
    return;
  }

  event.preventDefault();
  if (/export queued/i.test(button.dataset.action || "")) {
    event.stopImmediatePropagation();
    downloadAdminPageCopy();
    return;
  }

  openAdminModal(button);
});

document.addEventListener("click", (event) => {
  const button = event.target.closest('.admin-page button[type="button"]');

  if (
    !button ||
    button.dataset.action ||
    button.dataset.adminLoanStatus ||
    button.dataset.adminViewDocuments ||
    button.closest("[data-admin-modal]") ||
    button.closest("[data-admin-documents-modal]") ||
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

document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  const link = event.target.closest("a[href]");

  if (!link || link.target === "_blank" || link.hasAttribute("download")) {
    return;
  }

  const href = link.getAttribute("href") || "";

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
    return;
  }

  let url;

  try {
    url = new URL(href, window.location.href);
  } catch (error) {
    return;
  }

  if (url.origin !== window.location.origin || !/\.html?$/i.test(url.pathname)) {
    return;
  }

  showGlobalLoading("Opening the next Easy Loan page...", { title: "Loading page" });
});
