/* =========================
   状態管理
========================= */

let currentDate = new Date();

const SITE_COLORS = {
  首都圏: "#336fcf",
  東海: "#9c1896",
  関西: "#0F9D58",
};

const cityColorMap = {};

let overloadedMap = {};
/* =========================
   初期化
========================= */

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  renderAll();

  const element = document.getElementById("today");

  console.log("scroll start");

  element.scrollIntoView({
    block: "start",
    inline: "start",
    behavior: "instant",
  });

  setTimeout(() => {
    console.log(window.scrollY);
  }, 100);
});

/* =========================
   全体描画
========================= */

function renderAll() {
  renderHeader();
  renderCalendar(tasks);
  applyFilters();
  applySiteColorsToCheckbox();
}

/* =========================
   ヘッダー（月切替）
========================= */

function renderHeader() {
  const cal = document.getElementById("calendar");

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  cal.innerHTML = `
        <div class="header">
            <button onclick="prevMonth()">◀</button>
            <h2>${y}年 ${m + 1}月</h2>
            <button onclick="nextMonth()">▶</button>
        </div>
        <div class="grid" id="grid"></div>
    `;
}

function prevMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderAll();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderAll();
}

/* =========================
   カレンダー描画
========================= */

function renderCalendar(tasks) {
  const grid = document.getElementById("grid");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  buildOverloadedMap(tasks, year, month);

  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();

  const lastDate = new Date(year, month + 1, 0).getDate();

  grid.innerHTML = "";

  ["日", "月", "火", "水", "木", "金", "土"].forEach((d) => {
    const div = document.createElement("div");
    div.className = "day-header";
    div.textContent = d;
    grid.appendChild(div);
  });

  for (let i = 0; i < startDay; i++) {
    grid.appendChild(createCell(""));
  }

  for (let d = 1; d <= lastDate; d++) {
    const cell = createCell(year, month + 1, d);
    const dateStr = formatDate(year, month + 1, d);

    const dayTasks = tasks.filter(
      (t) => t.start <= dateStr && t.end >= dateStr
    );

    dayTasks.forEach((t) => {
      const el = createTaskElement(t, dateStr);
      cell.appendChild(el);
    });

    grid.appendChild(cell);
  }
}

function createCell(year, month, day) {
  const div = document.createElement("div");
  div.className = "cell";

  if (day !== "") {
    const label = document.createElement("div");
    label.className = "date";
    if (isToday(year, month, day)) {
      label.id = "today";
    }
    label.textContent = day;
    div.appendChild(label);
  }

  return div;
}

function buildOverloadedMap(tasks, year, month) {
  overloadedMap = {};

  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = formatDate(year, month + 1, d);

    const dayTasks = tasks.filter(
      (t) => t.start <= dateStr && t.end >= dateStr
    );

    const countMap = {};

    dayTasks.forEach((t) => {
      countMap[t.owner] = (countMap[t.owner] || 0) + 1;
    });

    Object.entries(countMap).forEach(([owner, count]) => {
      if (count >= 2) {
        overloadedMap[dateStr + "_" + owner] = true;
      }
    });
  }
}

function isToday(year, month, day) {
  const today = new Date();

  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
}

/* =========================
   タスク表示
========================= */

function createTaskElement(t, dateStr) {
  const div = document.createElement("div");
  div.className = "task";

  div.dataset.site = t.site;
  div.dataset.type = t.type;
  div.dataset.owner = t.owner;
  div.dataset.city = t.city;

  // 背景色（自治体）
  const bgColor = getCityColor(t.city);
  div.style.backgroundColor = bgColor;
  div.style.color = "#222";

  // バッジ色（拠点）
  const badgeColor = getSiteColor(t.site);

  // 過負荷チェック
  const isOverloaded = overloadedMap[dateStr + "_" + t.owner];

  div.innerHTML = `
        <div class="line1">
            <span class="city">${t.city}</span>
            <div class="badge" style="background:${badgeColor}">${t.site}</div>
        </div>

        
        <span class="type">${t.type}</span>
        <div class="owner ${isOverloaded ? "overloaded" : ""}">${t.owner}</div>
    `;

  div.addEventListener("mouseenter", (e) => showTooltip(e, t));
  div.addEventListener("mouseleave", hideTooltip);

  return div;
}

function getSiteColor(site) {
  return SITE_COLORS[site] || "#999";
}

function getCityColor(city) {
  if (cityColorMap[city]) return cityColorMap[city];

  let hash = 0;
  for (let i = 0; i < city.length; i++) {
    hash = city.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;

  const color = `hsl(${hue}, 45%, 80%)`;

  cityColorMap[city] = color;

  return color;
}

let tooltip;

function showTooltip(e, t) {
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
        <div><b>通番：</b>${t.id}</div>
        <div><b>拠点：</b>${t.site}</div>
        <div><b>自治体：</b>${t.city}</div>
        <div><b>種類：</b>${t.type}</div>
        <div><b>担当：</b>${t.owner}</div>
        <div><b>期間：</b>${t.start} ～ ${t.end}</div>
    `;

  tooltip.style.display = "block";

  moveTooltip(e);
}

function hideTooltip() {
  if (tooltip) tooltip.style.display = "none";
}

function moveTooltip(e) {
  tooltip.style.left = e.pageX + 10 + "px";
  tooltip.style.top = e.pageY + 10 + "px";
}

// マウス追従
document.addEventListener("mousemove", (e) => {
  if (tooltip && tooltip.style.display === "block") {
    moveTooltip(e);
  }
});

/* =========================
   フィルター
========================= */

function setupFilters() {
  document.querySelectorAll(".individual").forEach((el) => {
    el.addEventListener("change", (event) => {
      updateLumpCheckBox(event);
      applyFilters();
    });
  });

  document.querySelectorAll(".lump").forEach((el) => {
    el.addEventListener("change", (event) => {
      updateIndividualCheckBox(event);
      applyFilters();
    });
  });

  document.querySelectorAll("#filter-city").forEach((el) => {
    el.addEventListener("change", applyFilters);
  });
}

function applyFilters() {
  const sites = getChecked("filter-site");
  const types = getChecked("filter-type");
  const owners = getChecked("filter-owner");
  const city = document.getElementById("filter-city").value;

  document.querySelectorAll(".task").forEach((t) => {
    let visible = true;

    if (!sites.length || !sites.includes(t.dataset.site)) visible = false;
    if (!types.length || !types.includes(t.dataset.type)) visible = false;
    if (!owners.length || !owners.includes(t.dataset.owner)) visible = false;
    if (city && t.dataset.city !== city) visible = false;

    t.classList.toggle("hidden", !visible);
  });
}

function getChecked(cls) {
  return [...document.querySelectorAll("." + cls + ".individual:checked")].map(
    (e) => e.value
  );
}

function updateLumpCheckBox(event) {
  const target = event.target;
  const filter = target.classList[0];
  const lump = document.querySelector("." + filter + ".lump");
  const individuals = document.querySelectorAll("." + filter + ".individual");
  const total = individuals.length;
  const checked = Array.from(individuals).filter((cb) => cb.checked).length;

  if (checked === 0) {
    lump.checked = false;
    lump.indeterminate = false;
  } else if (checked === total) {
    lump.checked = true;
    lump.indeterminate = false;
  } else {
    lump.checked = false;
    lump.indeterminate = true;
  }
}

function updateIndividualCheckBox(event) {
  const target = event.target;
  const filter = target.classList[0];
  const lump = document.querySelector("." + filter + ".lump");
  const individuals = document.querySelectorAll("." + filter + ".individual");

  individuals.forEach((cb) => {
    cb.checked = lump.checked;
  });
}

/* =========================
   チェックボックスを凡例化
========================= */

function applySiteColorsToCheckbox() {
  document.querySelectorAll(".filter-site").forEach((cb) => {
    const color = SITE_COLORS[cb.value];
    if (!color) return;

    // チェックボックス自体の色を変更
    cb.style.accentColor = color;
  });
}

/* =========================
   ユーティリティ
========================= */

function formatDate(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
