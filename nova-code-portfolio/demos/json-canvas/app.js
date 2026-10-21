const source = document.querySelector("#source");
const tree = document.querySelector("#tree");
const status = document.querySelector("#status");
const sample = {
  project: "NOVA CODE",
  release: { version: "2.4.0", ready: true, environment: "production" },
  services: [
    { name: "web", status: "online", latency: 84 },
    { name: "api", status: "online", latency: 127 },
    { name: "worker", status: "paused", latency: null }
  ],
  metrics: { projects: 20, uptime: 99.98, region: "EU" }
};
let parsed = null;
let selectedPath = "$";

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function countNodes(value) {
  if (value === null || typeof value !== "object") return 1;
  return 1 + Object.values(value).reduce((sum, item) => sum + countNodes(item), 0);
}

function maxDepth(value) {
  if (value === null || typeof value !== "object" || !Object.keys(value).length) return 1;
  return 1 + Math.max(...Object.values(value).map(maxDepth));
}

function primitive(value) {
  if (value === null) return '<span class="null">null</span>';
  const type = typeof value;
  if (type === "string") return `<span class="string">"${escapeHtml(value)}"</span>`;
  return `<span class="${type}">${escapeHtml(value)}</span>`;
}

function renderNode(key, value, path) {
  const isObject = value !== null && typeof value === "object";
  const keyText = key === null ? "root" : escapeHtml(key);
  if (!isObject) return `<div class="node" data-path="${escapeHtml(path)}"><div class="node-row"><span class="toggle"></span><span class="key">${keyText}</span><span class="meta">:</span>${primitive(value)}</div></div>`;
  const entries = Object.entries(value);
  const bracket = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  const children = entries.map(([childKey, childValue]) => {
    const childPath = Array.isArray(value) ? `${path}[${childKey}]` : `${path}.${childKey}`;
    return renderNode(childKey, childValue, childPath);
  }).join("");
  return `<div class="node" data-path="${escapeHtml(path)}"><div class="node-row"><span class="toggle">▾</span><span class="key">${keyText}</span><span class="meta">${bracket[0]} ${entries.length} ${bracket[1]}</span></div><div class="children">${children}</div></div>`;
}

function parseAndRender() {
  try {
    parsed = JSON.parse(source.value);
    tree.innerHTML = renderNode(null, parsed, "$");
    status.className = "status valid";
    status.querySelector("span").textContent = "Валидный JSON";
    document.querySelector("#nodeCount").textContent = countNodes(parsed);
    document.querySelector("#depthCount").textContent = maxDepth(parsed);
    document.querySelector("#byteCount").textContent = new Blob([source.value]).size;
    bindNodes();
  } catch (error) {
    parsed = null;
    tree.innerHTML = `<div class="empty"><div><b>{ ! }</b>${escapeHtml(error.message)}</div></div>`;
    status.className = "status error";
    status.querySelector("span").textContent = "Ошибка синтаксиса";
    ["nodeCount", "depthCount", "byteCount"].forEach((id) => document.querySelector(`#${id}`).textContent = "0");
  }
}

function bindNodes() {
  tree.querySelectorAll(".node-row").forEach((row) => row.addEventListener("click", (event) => {
    event.stopPropagation();
    const node = row.closest(".node");
    tree.querySelectorAll(".node-row").forEach((item) => item.classList.remove("selected"));
    row.classList.add("selected");
    selectedPath = node.dataset.path;
    document.querySelector("#selectedPath").textContent = selectedPath;
    if (node.querySelector(":scope > .children")) node.classList.toggle("collapsed");
  }));
}

function format(indent = 2) {
  if (!parsed) parseAndRender();
  if (parsed) { source.value = JSON.stringify(parsed, null, indent); parseAndRender(); }
}

document.querySelector("#formatButton").addEventListener("click", () => format(2));
document.querySelector("#minifyButton").addEventListener("click", () => format(0));
document.querySelector("#loadSample").addEventListener("click", () => { source.value = JSON.stringify(sample, null, 2); parseAndRender(); });
document.querySelector("#search").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase().trim();
  tree.querySelectorAll(".node").forEach((node) => node.classList.toggle("match", Boolean(query) && node.firstElementChild.textContent.toLowerCase().includes(query)));
});
document.querySelector("#copyPath").addEventListener("click", async () => {
  await navigator.clipboard.writeText(selectedPath);
  document.querySelector("#toast").classList.add("show");
  setTimeout(() => document.querySelector("#toast").classList.remove("show"), 1300);
});
document.querySelector("#downloadButton").addEventListener("click", () => {
  if (!parsed) return;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(parsed, null, 2)], { type: "application/json" }));
  link.download = "data.json";
  link.click();
  URL.revokeObjectURL(link.href);
});
source.addEventListener("input", parseAndRender);
source.addEventListener("keydown", (event) => { if (event.ctrlKey && event.key === "Enter") parseAndRender(); });
source.value = JSON.stringify(sample, null, 2);
parseAndRender();
