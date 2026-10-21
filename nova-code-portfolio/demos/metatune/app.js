const $ = (selector) => document.querySelector(selector);
const fields = ["siteName", "pageUrl", "pageTitle", "pageDescription", "imageUrl"];
const defaults = Object.fromEntries(fields.map((id) => [id, $(`#${id}`).value]));

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function buildCode(data) {
  return `<title>${escapeHtml(data.pageTitle)}</title>\n<meta name="description" content="${escapeHtml(data.pageDescription)}">\n<meta property="og:title" content="${escapeHtml(data.pageTitle)}">\n<meta property="og:description" content="${escapeHtml(data.pageDescription)}">\n<meta property="og:url" content="${escapeHtml(data.pageUrl)}">\n<meta property="og:image" content="${escapeHtml(data.imageUrl)}">`;
}

function render() {
  const data = Object.fromEntries(fields.map((id) => [id, $(`#${id}`).value.trim()]));
  let host = data.pageUrl;
  try { host = new URL(data.pageUrl).hostname; } catch {}
  $("#googleSite").textContent = data.siteName || host;
  $("#googleUrl").textContent = data.pageUrl;
  $("#googleTitle").textContent = data.pageTitle || "Заголовок страницы";
  $("#googleDescription").textContent = data.pageDescription || "Описание страницы появится здесь.";
  $("#ogHost").textContent = host.toUpperCase();
  $("#ogTitle").textContent = data.pageTitle;
  $("#ogDescription").textContent = data.pageDescription;
  $("#codePreview").textContent = buildCode(data);

  const titleLength = data.pageTitle.length;
  const descriptionLength = data.pageDescription.length;
  $("#titleCount").textContent = `${titleLength} / 60 символов`;
  $("#descriptionCount").textContent = `${descriptionLength} / 160 символов`;
  $("#titleMeter").style.width = `${Math.min(titleLength / 60 * 100, 100)}%`;
  $("#descriptionMeter").style.width = `${Math.min(descriptionLength / 160 * 100, 100)}%`;

  const checks = [
    [titleLength >= 30 && titleLength <= 60, "Title укладывается в рекомендуемую длину"],
    [descriptionLength >= 70 && descriptionLength <= 160, "Description достаточно информативный"],
    [/^https:\/\//.test(data.pageUrl), "Страница использует HTTPS"],
    [Boolean(data.imageUrl), "Изображение для Open Graph задано"],
  ];
  $("#checks").innerHTML = checks.map(([ok, text]) => `<div class="check ${ok ? "" : "warn"}">${text}</div>`).join("");
  const score = checks.filter(([ok]) => ok).length * 23 + (data.siteName ? 8 : 0);
  $("#score").textContent = `${score} / 100`;
  localStorage.setItem("metatune-draft", JSON.stringify(data));
}

function toast() {
  $("#toast").classList.add("show");
  setTimeout(() => $("#toast").classList.remove("show"), 1400);
}

async function copyCode() {
  await navigator.clipboard.writeText($("#codePreview").textContent);
  toast();
}

document.querySelectorAll(".tab").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === button));
  $("#searchView").classList.toggle("hidden", button.dataset.view !== "search");
  $("#socialView").classList.toggle("hidden", button.dataset.view !== "social");
}));

fields.forEach((id) => $(`#${id}`).addEventListener("input", render));
$("#copyButton").addEventListener("click", copyCode);
$("#codeCopy").addEventListener("click", copyCode);
$("#resetButton").addEventListener("click", () => {
  fields.forEach((id) => { $(`#${id}`).value = defaults[id]; });
  localStorage.removeItem("metatune-draft");
  render();
});

try {
  const draft = JSON.parse(localStorage.getItem("metatune-draft"));
  if (draft) fields.forEach((id) => { if (draft[id]) $(`#${id}`).value = draft[id]; });
} catch {}
render();
