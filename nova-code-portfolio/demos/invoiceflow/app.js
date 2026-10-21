const storageKey = "twincode.invoiceflow.v1";

const fields = [
  "invoiceNumber", "invoiceDate", "currency", "paymentDays", "sellerName",
  "sellerDetails", "clientName", "clientDetails", "discount", "tax", "note",
];

const state = {
  items: [
    { name: "Дизайн и разработка лендинга", qty: 1, price: 65000 },
    { name: "Подключение аналитики", qty: 1, price: 8000 },
  ],
};

const el = (id) => document.getElementById(id);
const number = (value) => Number.parseFloat(value) || 0;

function formatMoney(value) {
  const currency = el("currency").value;
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + Math.max(0, number(days)));
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function save() {
  const values = Object.fromEntries(fields.map((id) => [id, el(id).value]));
  localStorage.setItem(storageKey, JSON.stringify({ values, items: state.items }));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return;
    fields.forEach((id) => {
      if (saved.values?.[id] !== undefined) el(id).value = saved.values[id];
    });
    if (Array.isArray(saved.items) && saved.items.length) state.items = saved.items;
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function renderItems() {
  const root = el("items");
  root.innerHTML = "";
  state.items.forEach((item, index) => {
    const row = el("itemTemplate").content.firstElementChild.cloneNode(true);
    const nameInput = row.querySelector(".item-name");
    const qtyInput = row.querySelector(".item-qty");
    const priceInput = row.querySelector(".item-price");
    nameInput.value = item.name;
    qtyInput.value = item.qty;
    priceInput.value = item.price;
    row.querySelector(".item-total").textContent = formatMoney(number(item.qty) * number(item.price));

    const updateItem = () => {
      state.items[index] = { name: nameInput.value, qty: number(qtyInput.value), price: number(priceInput.value) };
      update();
    };
    [nameInput, qtyInput, priceInput].forEach((input) => input.addEventListener("input", updateItem));
    row.querySelector(".remove-item").addEventListener("click", () => {
      state.items.splice(index, 1);
      if (!state.items.length) state.items.push({ name: "Новая позиция", qty: 1, price: 0 });
      renderItems();
      update();
    });
    root.append(row);
  });
}

function updatePreview() {
  el("previewSeller").textContent = el("sellerName").value || "Исполнитель";
  el("previewSellerDetails").textContent = el("sellerDetails").value;
  el("previewClient").textContent = el("clientName").value || "Заказчик";
  el("previewClientDetails").textContent = el("clientDetails").value;
  el("previewNumber").textContent = el("invoiceNumber").value || "Без номера";
  const date = el("invoiceDate").value;
  el("previewDate").textContent = date ? new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU") : "";
  el("dueDate").textContent = date ? `Оплатить до ${addDays(date, el("paymentDays").value)}` : "";
}

function updateTotals() {
  const subtotal = state.items.reduce((sum, item) => sum + number(item.qty) * number(item.price), 0);
  const discountAmount = subtotal * number(el("discount").value) / 100;
  const taxedBase = subtotal - discountAmount;
  const taxAmount = taxedBase * number(el("tax").value) / 100;
  el("subtotal").textContent = formatMoney(subtotal);
  el("discountTotal").textContent = `− ${formatMoney(discountAmount)}`;
  el("taxTotal").textContent = `+ ${formatMoney(taxAmount)}`;
  el("grandTotal").textContent = formatMoney(taxedBase + taxAmount);
  el("discountRow").hidden = discountAmount === 0;
  el("taxRow").hidden = taxAmount === 0;
}

function update() {
  updatePreview();
  updateTotals();
  document.querySelectorAll(".item-row").forEach((row, index) => {
    row.querySelector(".item-total").textContent = formatMoney(number(state.items[index].qty) * number(state.items[index].price));
  });
  save();
}

function exportJson() {
  const payload = {
    invoice: Object.fromEntries(fields.map((id) => [id, el(id).value])),
    items: state.items,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `invoice-${el("invoiceNumber").value || "draft"}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

el("invoiceDate").value ||= new Date().toISOString().slice(0, 10);
load();
renderItems();
fields.forEach((id) => el(id).addEventListener("input", update));
el("addItemButton").addEventListener("click", () => {
  state.items.push({ name: "Новая позиция", qty: 1, price: 0 });
  renderItems();
  update();
});
el("printButton").addEventListener("click", () => window.print());
el("exportButton").addEventListener("click", exportJson);
update();
