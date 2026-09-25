let siteConfig = {};
let tournaments = [];
let activeTournament = null;
let activeMap = "all";
let countdownTimer = null;

const gridEl = document.getElementById("tournament-grid");
const emptyStateEl = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const mapPillsEl = document.getElementById("map-pills");
const modeFilter = document.getElementById("mode-filter");
const modal = document.getElementById("register-modal");
const modalSubtitle = document.getElementById("modal-subtitle");
const registerForm = document.getElementById("register-form");
const spotlightEl = document.getElementById("spotlight");
const toastEl = document.getElementById("toast");

/* ---------- Original per-map illustrated banners (no copyrighted assets) ---------- */
const MAP_ART = {
  erangel: `
    <svg class="pattern" viewBox="0 0 300 140" preserveAspectRatio="none">
      <polygon points="0,140 0,95 40,60 75,85 110,55 150,90 190,50 230,88 260,65 300,95 300,140" fill="rgba(255,255,255,0.12)"/>
      <polygon points="0,140 0,115 50,85 95,110 140,80 185,108 225,78 270,105 300,115 300,140" fill="rgba(255,255,255,0.18)"/>
      <rect x="248" y="35" width="6" height="34" fill="rgba(255,255,255,0.35)"/>
      <rect x="238" y="30" width="26" height="8" fill="rgba(255,255,255,0.35)"/>
    </svg>`,
  miramar: `
    <svg class="pattern" viewBox="0 0 300 140" preserveAspectRatio="none">
      <path d="M0 120 Q40 90 80 118 T160 110 T240 122 T300 105 V140 H0 Z" fill="rgba(255,255,255,0.14)"/>
      <path d="M0 135 Q60 112 120 132 T240 128 T300 135 V140 H0 Z" fill="rgba(255,255,255,0.2)"/>
      <ellipse cx="235" cy="55" rx="40" ry="16" fill="rgba(255,255,255,0.1)"/>
      <ellipse cx="255" cy="50" rx="26" ry="11" fill="rgba(255,255,255,0.14)"/>
    </svg>`,
  sanhok: `
    <svg class="pattern" viewBox="0 0 300 140" preserveAspectRatio="none">
      <circle cx="40" cy="100" r="26" fill="rgba(255,255,255,0.12)"/>
      <circle cx="80" cy="80" r="34" fill="rgba(255,255,255,0.16)"/>
      <circle cx="140" cy="95" r="28" fill="rgba(255,255,255,0.13)"/>
      <circle cx="195" cy="75" r="38" fill="rgba(255,255,255,0.17)"/>
      <circle cx="255" cy="90" r="30" fill="rgba(255,255,255,0.14)"/>
      <rect x="0" y="118" width="300" height="22" fill="rgba(255,255,255,0.2)"/>
    </svg>`,
  vikendi: `
    <svg class="pattern" viewBox="0 0 300 140" preserveAspectRatio="none">
      <polygon points="0,140 30,70 60,140" fill="rgba(255,255,255,0.16)"/>
      <polygon points="45,140 85,45 125,140" fill="rgba(255,255,255,0.22)"/>
      <polygon points="110,140 150,65 190,140" fill="rgba(255,255,255,0.16)"/>
      <polygon points="175,140 215,50 255,140" fill="rgba(255,255,255,0.22)"/>
      <polygon points="240,140 270,80 300,140" fill="rgba(255,255,255,0.16)"/>
      <polygon points="85,45 95,58 75,58" fill="rgba(255,255,255,0.5)"/>
      <polygon points="215,50 225,62 205,62" fill="rgba(255,255,255,0.5)"/>
    </svg>`,
  livik: `
    <svg class="pattern" viewBox="0 0 300 140" preserveAspectRatio="none">
      <ellipse cx="70" cy="128" rx="55" ry="14" fill="rgba(255,255,255,0.16)"/>
      <ellipse cx="210" cy="132" rx="70" ry="12" fill="rgba(255,255,255,0.14)"/>
      <path d="M60 128 Q65 90 90 78" stroke="rgba(255,255,255,0.4)" stroke-width="4" fill="none"/>
      <ellipse cx="92" cy="75" rx="18" ry="9" fill="rgba(255,255,255,0.3)"/>
      <path d="M215 132 Q222 95 248 82" stroke="rgba(255,255,255,0.4)" stroke-width="4" fill="none"/>
      <ellipse cx="250" cy="79" rx="16" ry="8" fill="rgba(255,255,255,0.3)"/>
    </svg>`,
};

function mapArt(map) {
  const key = (map || "erangel").toLowerCase();
  return MAP_ART[key] || MAP_ART.erangel;
}

function mapClass(map) {
  return `map-${(map || "erangel").toLowerCase()}`;
}

function slotsStatus(t) {
  const remaining = t.slotsTotal - t.slotsFilled;
  if (remaining <= 0) return "full";
  if (remaining / t.slotsTotal <= 0.2) return "almost";
  return "open";
}

function matchDate(t) {
  return new Date(`${t.date}T${t.time}:00`);
}

function formatDateTime(t) {
  const d = matchDate(t);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${dateStr}, ${t.time} ${t.timezone || ""}`.trim();
}

function timeUntil(t) {
  const diff = matchDate(t).getTime() - Date.now();
  if (diff <= 0) return "Live now";
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${remMins}m`;
  return `${remMins}m`;
}

/* ---------- Rendering ---------- */
function renderCard(t) {
  const status = slotsStatus(t);
  const remaining = Math.max(t.slotsTotal - t.slotsFilled, 0);
  const pct = Math.min((t.slotsFilled / t.slotsTotal) * 100, 100);
  const statusLabel = status === "full" ? "FULL" : status === "almost" ? "FILLING FAST" : "OPEN";

  const card = document.createElement("article");
  card.className = `card ${mapClass(t.map)}`;
  card.innerHTML = `
    <div class="card-banner">
      ${mapArt(t.map)}
      <span class="countdown-tag" data-countdown="${t.id}">${timeUntil(t)}</span>
      <span class="status-badge status-${status}">${statusLabel}</span>
      <span class="map-name">${t.map}</span>
    </div>
    <div class="card-body">
      <div class="card-top">
        <span class="mode-badge">${t.mode}</span>
        <span class="perspective-tag">${t.perspective || ""}</span>
      </div>
      <h3>${t.title}</h3>
      <div class="card-meta">
        <div>🗓 <strong>${formatDateTime(t)}</strong></div>
        <div>🏆 <strong>${t.currency}${t.prizePool}</strong> prize pool</div>
      </div>
      <div class="slots-row">
        <span>${t.slotsFilled}/${t.slotsTotal} slots filled</span>
        <span>${remaining} left</span>
      </div>
      <div class="slots-bar-track">
        <div class="slots-bar-fill ${status === "full" ? "full" : ""}" style="width:${pct}%"></div>
      </div>
      ${t.notes ? `<p class="notes">${t.notes}</p>` : ""}
      <div class="card-footer">
        <div class="fee"><span class="fee-label">Entry fee</span>${t.currency}${t.entryFee}</div>
        <button class="btn btn-primary register-btn">
          ${status === "full" ? "Join waitlist" : "Register"}
        </button>
      </div>
    </div>
  `;
  card.querySelector(".register-btn").addEventListener("click", () => openModal(t));
  attachTilt(card);
  return card;
}

function attachTilt(card) {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
}

function renderSkeleton(count = 6) {
  gridEl.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "card skeleton";
    gridEl.appendChild(el);
  }
}

function renderSpotlight() {
  const upcoming = tournaments
    .filter((t) => slotsStatus(t) !== "full" && matchDate(t).getTime() > Date.now())
    .sort((a, b) => matchDate(a) - matchDate(b))[0];

  if (!upcoming) {
    spotlightEl.hidden = true;
    return;
  }

  spotlightEl.hidden = false;
  spotlightEl.innerHTML = `
    <div class="spotlight-inner">
      <div>
        <p class="spotlight-label">⚡ NEXT DROP</p>
        <h3 class="spotlight-title">${upcoming.title}</h3>
        <p class="spotlight-meta">${upcoming.map} · ${upcoming.mode} · ${formatDateTime(upcoming)} · Entry ${upcoming.currency}${upcoming.entryFee}</p>
      </div>
      <div class="spotlight-countdown">
        <strong data-spotlight-countdown>${timeUntil(upcoming)}</strong>
        <span>until drop</span>
      </div>
      <button class="btn btn-primary" id="spotlight-register">Register now</button>
    </div>
  `;
  spotlightEl.querySelector("#spotlight-register").addEventListener("click", () => openModal(upcoming));
}

function tickCountdowns() {
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const t = tournaments.find((x) => x.id === el.dataset.countdown);
    if (t) el.textContent = timeUntil(t);
  });
  const spotlightCountdown = document.querySelector("[data-spotlight-countdown]");
  if (spotlightCountdown) {
    const upcoming = tournaments
      .filter((t) => slotsStatus(t) !== "full" && matchDate(t).getTime() > Date.now())
      .sort((a, b) => matchDate(a) - matchDate(b))[0];
    if (upcoming) spotlightCountdown.textContent = timeUntil(upcoming);
  }
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const mode = modeFilter.value;
  const filtered = tournaments.filter((t) => {
    const matchesQuery = !query || t.title.toLowerCase().includes(query) || t.map.toLowerCase().includes(query);
    const matchesMap = activeMap === "all" || t.map === activeMap;
    const matchesMode = mode === "all" || t.mode === mode;
    return matchesQuery && matchesMap && matchesMode;
  });

  gridEl.innerHTML = "";
  filtered.forEach((t) => gridEl.appendChild(renderCard(t)));
  emptyStateEl.hidden = filtered.length !== 0;
}

function renderMapPills() {
  const maps = [...new Set(tournaments.map((t) => t.map))];
  mapPillsEl.innerHTML = "";

  const allPill = document.createElement("button");
  allPill.className = "map-pill active";
  allPill.type = "button";
  allPill.textContent = "All maps";
  allPill.dataset.map = "all";
  mapPillsEl.appendChild(allPill);

  maps.forEach((m) => {
    const pill = document.createElement("button");
    pill.className = "map-pill";
    pill.type = "button";
    pill.textContent = m;
    pill.dataset.map = m;
    mapPillsEl.appendChild(pill);
  });

  mapPillsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".map-pill");
    if (!btn) return;
    activeMap = btn.dataset.map;
    mapPillsEl.querySelectorAll(".map-pill").forEach((p) => p.classList.toggle("active", p === btn));
    applyFilters();
  });
}

function populateModeFilter() {
  const modes = [...new Set(tournaments.map((t) => t.mode))];
  modes.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modeFilter.appendChild(opt);
  });
}

function animateCount(el, target, prefix = "", suffix = "") {
  const duration = 700;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateHeroStats() {
  const openMatches = tournaments.filter((t) => slotsStatus(t) !== "full").length;
  const totalPrize = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0);
  const totalSlotsLeft = tournaments.reduce((sum, t) => sum + Math.max(t.slotsTotal - t.slotsFilled, 0), 0);
  const currency = tournaments[0]?.currency || "₹";

  animateCount(document.getElementById("stat-live"), openMatches);
  animateCount(document.getElementById("stat-prize"), totalPrize, currency);
  animateCount(document.getElementById("stat-slots"), totalSlotsLeft);
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.hidden = true; }, 3200);
}

function openModal(t) {
  activeTournament = t;
  modalSubtitle.textContent = `${t.map} · ${t.title} · ${formatDateTime(t)} · Entry ${t.currency}${t.entryFee}`;
  modal.hidden = false;
  registerForm.reset();
}

function closeModal() {
  modal.hidden = true;
  activeTournament = null;
}

document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!activeTournament) return;

  const ign = document.getElementById("field-ign").value.trim();
  const phone = document.getElementById("field-phone").value.trim();
  const team = document.getElementById("field-team").value.trim();

  const t = activeTournament;
  const lines = [
    `Hi, I'd like to register for "${t.title}" (PUBG Mobile - ${t.map}).`,
    `IGN: ${ign}`,
    `My contact: ${phone}`,
    team ? `Team: ${team}` : null,
    `Match: ${formatDateTime(t)}`,
    `Mode: ${t.mode}`,
    `Entry fee: ${t.currency}${t.entryFee}`,
  ].filter(Boolean);

  const message = encodeURIComponent(lines.join("\n"));
  const organizerNumber = (t.organizerWhatsapp || siteConfig.organizerWhatsapp || "").replace(/\D/g, "");
  const waLink = `https://wa.me/${organizerNumber}?text=${message}`;

  window.open(waLink, "_blank", "noopener");
  closeModal();
  showToast("Opening WhatsApp to confirm your slot...");
});

searchInput.addEventListener("input", applyFilters);
modeFilter.addEventListener("change", applyFilters);

renderSkeleton();

fetch("data.json")
  .then((res) => res.json())
  .then((data) => {
    siteConfig = data.siteConfig || {};
    tournaments = data.tournaments || [];

    if (siteConfig.siteName) {
      document.getElementById("site-name").textContent = siteConfig.siteName;
      document.title = `${siteConfig.siteName} — Live Tournament Slots`;
    }
    if (siteConfig.tagline) {
      document.getElementById("site-tagline").textContent = siteConfig.tagline;
    }
    if (siteConfig.supportEmail) {
      const link = document.getElementById("support-link");
      link.href = `mailto:${siteConfig.supportEmail}`;
    }

    renderMapPills();
    populateModeFilter();
    updateHeroStats();
    renderSpotlight();
    applyFilters();

    countdownTimer = setInterval(tickCountdowns, 30000);
  })
  .catch((err) => {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = "Couldn't load tournaments right now. Please refresh.";
    gridEl.innerHTML = "";
    console.error(err);
  });
