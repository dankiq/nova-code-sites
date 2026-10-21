const hasChromeApi = Boolean(globalThis.chrome?.tabs?.query);
const groupColors = ["#c6ff42", "#65d7ff", "#ffbd59", "#bb8cff", "#ff7f85", "#72e6b1"];

const demoTabs = [
  { id: 1, title: "Dashboard · Figma", url: "https://figma.com/design/dashboard" },
  { id: 2, title: "UI Kit · Figma", url: "https://figma.com/community/ui-kit" },
  { id: 3, title: "Deployments · Cloudflare", url: "https://dash.cloudflare.com/pages" },
  { id: 4, title: "Analytics · Cloudflare", url: "https://dash.cloudflare.com/analytics" },
  { id: 5, title: "NOVA CODE · GitHub", url: "https://github.com/twincode/project" },
  { id: 6, title: "Issues · GitHub", url: "https://github.com/twincode/project/issues" },
  { id: 7, title: "Documentation · MDN", url: "https://developer.mozilla.org/docs" },
  { id: 8, title: "Dashboard · Figma", url: "https://figma.com/design/dashboard" },
  { id: 9, title: "Почта", url: "https://mail.ru/inbox" },
];

let tabs = [];
const el = (id) => document.getElementById(id);

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return "system"; }
}

function domainGroups(items) {
  return items.reduce((groups, tab) => {
    const key = hostname(tab.url || "");
    (groups[key] ||= []).push(tab);
    return groups;
  }, {});
}

function duplicateTabs(items) {
  const seen = new Set();
  return items.filter((tab) => {
    if (!tab.url || seen.has(tab.url)) return Boolean(tab.url);
    seen.add(tab.url);
    return false;
  });
}

function render() {
  const groups = domainGroups(tabs);
  const duplicates = duplicateTabs(tabs);
  const groupEntries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const score = Math.max(18, Math.round(100 - Math.max(0, tabs.length - 8) * 3 - duplicates.length * 12));

  el("tabCount").textContent = tabs.length;
  el("score").textContent = score;
  el("summary").textContent = duplicates.length
    ? `Нашли ${duplicates.length} повторов. Можно освободить место в один клик.`
    : "Повторов нет. Рабочее пространство выглядит аккуратно.";
  el("duplicateLabel").textContent = duplicates.length ? `${duplicates.length} можно закрыть` : "дубликатов нет";
  el("groupCount").textContent = `${groupEntries.length} доменов`;
  el("groups").innerHTML = groupEntries.length ? "" : '<div class="empty">Открытых вкладок не найдено</div>';

  groupEntries.slice(0, 5).forEach(([domain, items], index) => {
    const node = document.createElement("div");
    node.className = "group";
    node.style.setProperty("--group-color", groupColors[index % groupColors.length]);
    node.innerHTML = `<span class="group__icon">${domain.slice(0, 2)}</span><div><strong>${domain}</strong><small>${items[0]?.title || "Без названия"}</small></div><span class="group__count">${items.length}</span>`;
    el("groups").append(node);
  });
}

function setStatus(message) {
  el("status").textContent = message;
  window.setTimeout(() => { el("status").textContent = "Готово к работе"; }, 2600);
}

async function refresh() {
  tabs = hasChromeApi ? await chrome.tabs.query({ currentWindow: true }) : demoTabs;
  render();
}

async function groupTabs() {
  if (!hasChromeApi) { setStatus("Демо: вкладки распределены по доменам"); return; }
  const entries = Object.entries(domainGroups(tabs)).filter(([, items]) => items.length > 1);
  for (const [domain, items] of entries) {
    const groupId = await chrome.tabs.group({ tabIds: items.map((tab) => tab.id) });
    await chrome.tabGroups.update(groupId, { title: domain, color: "green", collapsed: false });
  }
  setStatus(`Создано групп: ${entries.length}`);
  await refresh();
}

async function removeDuplicates() {
  const duplicates = duplicateTabs(tabs);
  if (!duplicates.length) { setStatus("Повторов не найдено"); return; }
  if (hasChromeApi) await chrome.tabs.remove(duplicates.map((tab) => tab.id));
  else tabs = tabs.filter((tab) => !duplicates.includes(tab));
  setStatus(`Закрыто повторов: ${duplicates.length}`);
  render();
}

async function saveSession() {
  const session = tabs.filter((tab) => tab.url?.startsWith("http")).map(({ title, url, pinned }) => ({ title, url, pinned }));
  if (hasChromeApi) await chrome.storage.local.set({ lastSession: session, savedAt: Date.now() });
  else localStorage.setItem("tabtamer.demo.session", JSON.stringify(session));
  setStatus(`Сохранено вкладок: ${session.length}`);
}

async function restoreSession() {
  let session;
  if (hasChromeApi) ({ lastSession: session } = await chrome.storage.local.get("lastSession"));
  else session = JSON.parse(localStorage.getItem("tabtamer.demo.session") || "null");
  if (!session?.length) { setStatus("Сначала сохраните сессию"); return; }
  if (hasChromeApi) await Promise.all(session.map((tab) => chrome.tabs.create({ url: tab.url, pinned: tab.pinned, active: false })));
  setStatus(`Восстановлено вкладок: ${session.length}`);
}

el("modeBadge").textContent = hasChromeApi ? "LIVE" : "DEMO";
el("groupButton").addEventListener("click", groupTabs);
el("duplicateButton").addEventListener("click", removeDuplicates);
el("saveButton").addEventListener("click", saveSession);
el("restoreButton").addEventListener("click", restoreSession);
el("refreshButton").addEventListener("click", refresh);
refresh();
