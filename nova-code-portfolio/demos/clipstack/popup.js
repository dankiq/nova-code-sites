const seed = [
  { id: 1, title: "Ответ новому клиенту", tag: "Работа", text: "Здравствуйте! Спасибо за обращение. Расскажите, пожалуйста, подробнее о задаче, сроках и желаемом результате." },
  { id: 2, title: "Команда сборки", tag: "Код", text: "npm run check && npm run build" },
  { id: 3, title: "Описание релиза", tag: "Работа", text: "Обновление опубликовано. Проверили основные сценарии, адаптивную версию и загрузку файлов." },
  { id: 4, title: "Структура API-ответа", tag: "Код", text: "{ success: true, data: result, error: null }" },
  { id: 5, title: "Контакты NOVA CODE", tag: "Личное", text: "Telegram: @twincode_dev\nEmail: ezmifik123@mail.ru" }
];
const storage = {
  async get() {
    if (globalThis.chrome?.storage?.local) return (await chrome.storage.local.get("clipstackItems")).clipstackItems || seed;
    return JSON.parse(localStorage.getItem("clipstackItems")) || seed;
  },
  async set(items) {
    if (globalThis.chrome?.storage?.local) return chrome.storage.local.set({ clipstackItems: items });
    localStorage.setItem("clipstackItems", JSON.stringify(items));
  }
};
let items = [];
let activeTag = "Все";
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function toast(message = "Скопировано") {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 1200);
}

function renderFilters() {
  const tags = ["Все", ...new Set(items.map((item) => item.tag))];
  $("#filters").innerHTML = tags.map((tag) => `<button class="${tag === activeTag ? "active" : ""}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("");
  $("#filters").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { activeTag = button.dataset.tag; render(); }));
}

function render() {
  renderFilters();
  const query = $("#search").value.toLowerCase();
  const filtered = items.filter((item) => (activeTag === "Все" || item.tag === activeTag) && `${item.title} ${item.text}`.toLowerCase().includes(query));
  $("#count").textContent = items.length;
  $("#list").innerHTML = filtered.length ? filtered.map((item) => `<article class="card" data-id="${item.id}"><div class="card-top"><span class="tag">${escapeHtml(item.tag)}</span><b>${escapeHtml(item.title)}</b><div class="card-actions"><button data-action="edit" title="Изменить">✎</button><button data-action="delete" title="Удалить">×</button></div></div><p>${escapeHtml(item.text)}</p></article>`).join("") : '<div class="empty"><b>⌕</b>Ничего не найдено</div>';
  $("#list").querySelectorAll(".card").forEach((card) => card.addEventListener("click", async (event) => {
    const item = items.find((entry) => entry.id === Number(card.dataset.id));
    const action = event.target.dataset.action;
    if (action === "edit") return openEditor(item);
    if (action === "delete") { items = items.filter((entry) => entry.id !== item.id); await storage.set(items); render(); return; }
    await navigator.clipboard.writeText(item.text);
    toast();
  }));
}

function openEditor(item = null) {
  $("#dialogTitle").textContent = item ? "Изменить сниппет" : "Новый сниппет";
  $("#editingId").value = item?.id || "";
  $("#titleInput").value = item?.title || "";
  $("#tagInput").value = item?.tag || "Работа";
  $("#textInput").value = item?.text || "";
  $("#editorDialog").showModal();
}

$("#newButton").addEventListener("click", () => openEditor());
$("#search").addEventListener("input", render);
$("#editorForm").addEventListener("submit", async (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const id = Number($("#editingId").value) || Date.now();
  const next = { id, title: $("#titleInput").value.trim(), tag: $("#tagInput").value.trim(), text: $("#textInput").value.trim() };
  items = items.some((item) => item.id === id) ? items.map((item) => item.id === id ? next : item) : [next, ...items];
  await storage.set(items);
  $("#editorDialog").close();
  render();
  toast("Сохранено");
});
$("#exportButton").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }));
  link.download = "clipstack-backup.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

storage.get().then((saved) => { items = saved; render(); });
