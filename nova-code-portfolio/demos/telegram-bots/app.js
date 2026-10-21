const scenarios = {
  leadpilot: {
    name: "LeadPilot", user: "@leadpilot_demo_bot", initials: "LP", kind: "LEAD QUALIFICATION",
    title: "Заявка становится структурированным лидом.",
    description: "Ответы сохраняются в базе и могут сразу уходить менеджеру отдельной карточкой.",
    intro: "Здравствуйте! За 60 секунд уточню задачу, бюджет и срок. Начнём?",
    steps: [
      ["Что Вам нужно?", ["Сайт под ключ", "Telegram-бот", "Автоматизация"]],
      ["Какой бюджет рассматриваете?", ["До 50 000 ₽", "50–150 000 ₽", "От 150 000 ₽"]],
      ["Когда нужен первый рабочий результат?", ["До двух недель", "В течение месяца", "Срок обсуждается"]],
      ["Отправьте телефон, @username или email для связи.", []],
    ],
    done: "Готово. Заявка сохранена, менеджер получил структурированный бриф.",
  },
  slotmate: {
    name: "SlotMate", user: "@slotmate_demo_bot", initials: "SM", kind: "CLIENT BOOKING",
    title: "Запись оформляется без звонка администратору.",
    description: "Свободные окна, подтверждение, перенос и напоминания собираются в одном диалоге.",
    intro: "Помогу выбрать услугу и свободное время. Весь процесс займёт меньше минуты.",
    steps: [
      ["На какую услугу хотите записаться?", ["Консультация", "Диагностика", "Повторный визит"]],
      ["Выберите удобный день.", ["Сегодня", "Завтра", "Послезавтра"]],
      ["Остались три свободных окна.", ["11:30", "15:00", "18:30"]],
      ["Как к Вам обращаться?", []],
    ],
    done: "Запись сохранена. Администратор получил услугу, время и имя клиента.",
  },
  orderflow: {
    name: "OrderFlow", user: "@orderflow_demo_bot", initials: "OF", kind: "TELEGRAM COMMERCE",
    title: "Заказ проходит от каталога до базы внутри Telegram.",
    description: "Корзина, способ получения и контакт сохраняются, а менеджер видит готовый заказ.",
    intro: "Помогу выбрать товар, собрать корзину и оформить получение. Что Вас интересует?",
    steps: [
      ["Что хотите заказать?", ["Готовый набор", "Один товар", "Нужна помощь"]],
      ["Выберите количество.", ["1 штука", "2 штуки", "3 штуки"]],
      ["Как удобнее получить заказ?", ["Курьер", "Пункт выдачи", "Самовывоз"]],
      ["Отправьте телефон или @username для подтверждения.", []],
    ],
    done: "Заказ создан. Менеджер получил корзину и контакт для подтверждения.",
  },
  supportdesk: {
    name: "SupportDesk", user: "@supportdesk_demo_bot", initials: "SD", kind: "SUPPORT TICKETS",
    title: "Сообщение пользователя становится понятным тикетом.",
    description: "Тема, приоритет, описание и контакт сохраняются в SQLite и уходят ответственному сотруднику.",
    intro: "Уточню тему и срочность проблемы, чтобы поддержка получила всё нужное с первого сообщения.",
    steps: [
      ["С чем нужна помощь?", ["Вопрос по заказу", "Проблема с оплатой", "Не работает функция"]],
      ["Насколько срочно нужна помощь?", ["Обычный вопрос", "Нужно сегодня", "Работа остановилась"]],
      ["Коротко опишите ситуацию и ожидаемый результат.", []],
      ["Оставьте телефон, email или @username для ответа.", []],
    ],
    done: "Тикет создан. Поддержка получила тему, приоритет, описание и контакт.",
  },
};

const list = document.querySelector("#scenario-list");
const chat = document.querySelector("#chat");
const composer = document.querySelector("#composer");
const input = document.querySelector("#message-input");
const send = document.querySelector("#send-button");
const restart = document.querySelector("#restart");
let activeKey = new URLSearchParams(location.search).get("bot") || "leadpilot";
if (!scenarios[activeKey]) activeKey = "leadpilot";
let stepIndex = -1;

function now() { return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
function scrollChat() { chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }); }
function setComposerEnabled(enabled) { input.disabled = !enabled; send.disabled = !enabled; }
function bubble(text, user = false, strong = "") {
  const node = document.createElement("div"); node.className = `message${user ? " user" : ""}`;
  node.innerHTML = `${strong ? `<strong>${strong}</strong>` : ""}${text}<time>${now()}</time>`;
  chat.append(node); scrollChat();
}
function options(items) {
  document.querySelector(".options")?.remove();
  if (!items.length) { setComposerEnabled(true); input.focus(); return; }
  setComposerEnabled(false);
  const node = document.createElement("div"); node.className = "options";
  items.forEach(label => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.onclick = () => answer(label); node.append(button); });
  chat.append(node); scrollChat();
}
function showStep() {
  const scenario = scenarios[activeKey];
  if (stepIndex >= scenario.steps.length) { bubble(scenario.done, false, "Готово · #1042"); setComposerEnabled(false); document.querySelector("#progress").textContent = "4 / 4"; return; }
  const [prompt, choices] = scenario.steps[stepIndex];
  setTimeout(() => { bubble(prompt, false, scenario.name); options(choices); document.querySelector("#progress").textContent = `${stepIndex} / ${scenario.steps.length}`; }, 260);
}
function answer(value) {
  document.querySelector(".options")?.remove(); setComposerEnabled(false); bubble(value, true); stepIndex += 1; showStep();
}
function reset() {
  const scenario = scenarios[activeKey]; stepIndex = -1; chat.innerHTML = '<div class="date-chip">сегодня</div>';
  document.querySelector("#bot-name").textContent = scenario.name;
  document.querySelector("#bot-user").textContent = scenario.user;
  document.querySelector("#avatar").textContent = scenario.initials;
  document.querySelector("#scenario-kind").textContent = scenario.kind;
  document.querySelector("#scenario-title").textContent = scenario.title;
  document.querySelector("#scenario-description").textContent = scenario.description;
  document.querySelector("#progress").textContent = `0 / ${scenario.steps.length}`;
  [...list.children].forEach(button => button.classList.toggle("is-active", button.dataset.key === activeKey));
  bubble(scenario.intro, false, scenario.name);
  const start = document.createElement("div"); start.className = "options";
  const button = document.createElement("button"); button.type = "button"; button.textContent = "Начать"; button.onclick = () => { start.remove(); answer("Начать"); };
  start.append(button); chat.append(start); setComposerEnabled(false); scrollChat();
  history.replaceState(null, "", `?bot=${activeKey}`);
}
Object.entries(scenarios).forEach(([key, scenario], index) => {
  const button = document.createElement("button"); button.type = "button"; button.className = "scenario-button"; button.dataset.key = key;
  button.innerHTML = `<span>0${index + 1}</span><strong>${scenario.name}</strong><em>${scenario.kind}</em>`;
  button.onclick = () => { activeKey = key; reset(); }; list.append(button);
});
composer.addEventListener("submit", event => { event.preventDefault(); const value = input.value.trim(); if (!value || input.disabled) return; input.value = ""; answer(value); });
restart.addEventListener("click", reset);
reset();
