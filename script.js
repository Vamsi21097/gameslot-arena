let siteConfig = {};
let tournaments = [];
let activeTournament = null;

const gridEl = document.getElementById("tournament-grid");
const emptyStateEl = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const mapFilter = document.getElementById("map-filter");
const modeFilter = document.getElementById("mode-filter");
const modal = document.getElementById("register-modal");
const modalSubtitle = document.getElementById("modal-subtitle");
const registerForm = document.getElementById("register-form");

const BANNER_PATTERN = `
  <svg class="pattern" viewBox="0 0 300 108" preserveAspectRatio="none">
    <path d="M0 90 Q40 60 80 85 T160 80 T240 90 T300 75" fill="none" stroke="white" stroke-width="1.5" opacity="0.5"/>
    <path d="M0 100 Q50 75 100 98 T200 95 T300 88" fill="none" stroke="white" stroke-width="1" opacity="0.35"/>
    <circle cx="255" cy="28" r="18" fill="none" stroke="white" stroke-width="1.2" opacity="0.4"/>
    <circle cx="255" cy="28" r="8" fill="none" stroke="white" stroke-width="1.2" opacity="0.55"/>
  </svg>
`;

function mapClass(map) {
  return `map-${(map || "erangel").toLowerCase()}`;
}

function slotsStatus(t) {
  const remaining = t.slotsTotal - t.slotsFilled;
  if (remaining <= 0) return "full";
  if (remaining / t.slotsTotal <= 0.2) return "almost";
  return "open";
}

function formatDateTime(t) {
  const d = new Date(`${t.date}T${t.time}:00`);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${dateStr}, ${t.time} ${t.timezone || ""}`.trim();
}

function renderCard(t) {
  const status = slotsStatus(t);
  const remaining = Math.max(t.slotsTotal - t.slotsFilled, 0);
  const pct = Math.min((t.slotsFilled / t.slotsTotal) * 100, 100);
  const statusLabel = status === "full" ? "FULL" : status === "almost" ? "FILLING FAST" : "OPEN";

  const card = document.createElement("article");
  card.className = `card ${mapClass(t.map)}`;
  card.innerHTML = `
    <div class="card-banner">
      ${BANNER_PATTERN}
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
  return card;
}

function applyFilters() {
  const query = searchInput.value.trim().toLowerCase();
  const map = mapFilter.value;
  const mode = modeFilter.value;
  const filtered = tournaments.filter((t) => {
    const matchesQuery = !query || t.title.toLowerCase().includes(query) || t.map.toLowerCase().includes(query);
    const matchesMap = map === "all" || t.map === map;
    const matchesMode = mode === "all" || t.mode === mode;
    return matchesQuery && matchesMap && matchesMode;
  });

  gridEl.innerHTML = "";
  filtered.forEach((t) => gridEl.appendChild(renderCard(t)));
  emptyStateEl.hidden = filtered.length !== 0;
}

function populateFilters() {
  const maps = [...new Set(tournaments.map((t) => t.map))];
  maps.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    mapFilter.appendChild(opt);
  });

  const modes = [...new Set(tournaments.map((t) => t.mode))];
  modes.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    modeFilter.appendChild(opt);
  });
}

function updateHeroStats() {
  const openMatches = tournaments.filter((t) => slotsStatus(t) !== "full").length;
  const totalPrize = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0);
  const totalSlotsLeft = tournaments.reduce((sum, t) => sum + Math.max(t.slotsTotal - t.slotsFilled, 0), 0);
  const currency = tournaments[0]?.currency || "₹";

  document.getElementById("stat-live").textContent = openMatches;
  document.getElementById("stat-prize").textContent = `${currency}${totalPrize.toLocaleString()}`;
  document.getElementById("stat-slots").textContent = totalSlotsLeft;
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
});

searchInput.addEventListener("input", applyFilters);
mapFilter.addEventListener("change", applyFilters);
modeFilter.addEventListener("change", applyFilters);

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

    populateFilters();
    updateHeroStats();
    applyFilters();
  })
  .catch((err) => {
    emptyStateEl.hidden = false;
    emptyStateEl.textContent = "Couldn't load tournaments right now. Please refresh.";
    console.error(err);
  });
