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
    window.location.href = form.dataset.redirect || "user/dashboard.html";
  });
});

registerForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
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

const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

userNavLinks.forEach((link) => {
  const hrefPage = link.getAttribute("href").split("/").pop();
  link.classList.toggle("active", hrefPage === currentPage);
});

demoForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.querySelector("[data-form-message]");

    if (message) {
      message.textContent = "Saved. This demo page is connected and ready for backend integration.";
    }
  });
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-demo-form]");

  if (!form) {
    return;
  }

  event.preventDefault();
  const message = form.querySelector("[data-form-message]");

  if (message) {
    message.textContent = "Saved. This demo page is connected and ready for backend integration.";
  }
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

adminActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showAdminToast(button.dataset.action || "Action ready for backend integration.");
  });
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
