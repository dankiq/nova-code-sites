const form = document.querySelector('#briefForm');
const fields = [...form.elements].filter((field) => field.name);
const storageKey = 'briefly:v1';

function data() {
  return Object.fromEntries(fields.map((field) => [field.name, field.value.trim()]));
}

function render() {
  const value = data();
  const completed = fields.filter((field) => field.value.trim()).length;
  const score = Math.round((completed / fields.length) * 100);
  document.querySelector('#scoreValue').textContent = `${score}%`;
  document.querySelector('#scoreRing').style.background = `conic-gradient(var(--accent) ${score * 3.6}deg,#24302b 0)`;
  document.querySelector('#metaType').textContent = value.type || '—';
  document.querySelector('#metaDeadline').textContent = value.deadline ? new Date(`${value.deadline}T00:00:00`).toLocaleDateString('ru-RU') : '—';
  document.querySelector('#metaBudget').textContent = value.budget || '—';
  const title = value.name || 'Заполните первые поля';
  const summary = value.goal || 'Здесь появится сжатое описание задачи, которое удобно отправить команде.';
  document.querySelector('#summaryCopy').innerHTML = `<small>КРАТКОЕ РЕЗЮМЕ</small><h2>${escapeHtml(title)}</h2><p>${escapeHtml(summary)}</p>`;
  localStorage.setItem(storageKey, JSON.stringify(value));
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function markdown(value) {
  return `# ${value.name || 'Новый проект'}\n\n- **Формат:** ${value.type || 'не определён'}\n- **Желаемый запуск:** ${value.deadline || 'не определён'}\n- **Бюджет:** ${value.budget || 'не определён'}\n- **Контакт:** ${value.contact || 'не указан'}\n\n## Цель\n${value.goal || '—'}\n\n## Ключевые функции\n${value.features || '—'}\n`;
}

fields.forEach((field) => field.addEventListener('input', render));
document.querySelector('#downloadButton').addEventListener('click', () => {
  const blob = new Blob([markdown(data())], {type: 'text/markdown;charset=utf-8'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'project-brief.md';
  link.click();
  URL.revokeObjectURL(link.href);
});
document.querySelector('#resetButton').addEventListener('click', () => {
  if (!confirm('Очистить текущий бриф?')) return;
  form.reset();
  localStorage.removeItem(storageKey);
  render();
});

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  fields.forEach((field) => { if (saved[field.name]) field.value = saved[field.name]; });
} catch {}
render();
