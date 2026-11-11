// База предметов и базовых решений
const SUBJECTS_DATA = [
  {
    name: "Алгебра",
    desc: "Квадратные уравнения, формулы сокращённого умножения и функции.",
    solutions: [
      { task: "Решение квадратного уравнения ax² + bx + c = 0", answer: "1. Найти дискриминант: D = b² - 4ac.\n2. Если D > 0, корни: x₁ = (-b + √D) / 2a, x₂ = (-b - √D) / 2a." },
      { task: "Формула разности квадратов", answer: "a² - b² = (a - b)(a + b)" }
    ]
  },
  {
    name: "Русский язык",
    desc: "Орфография, пунктуация в сложных предложениях и разбор слова.",
    solutions: [
      { task: "Правописание -тся и -ться в глаголах", answer: "Задайте вопрос к глаголу: если в вопросе есть «ь» (что делать? что сделать?), то пишется -ться. Если нет (что делает?) — пишется -тся." },
      { task: "Запятая перед союзом «и»", answer: "Ставится, если союз соединяет две разные грамматические основы (сложносочинённое предложение)." }
    ]
  },
  {
    name: "Физика",
    desc: "Механика, законы Ньютона, электричество и формулы расчёта.",
    solutions: [
      { task: "Второй закон Ньютона", answer: "F = m · a (Сила равна произведению массы тела на его ускорение)." },
      { task: "Закон Ома для участка цепи", answer: "I = U / R (Сила тока прямо пропорциональна напряжению и обратно пропорциональна сопротивлению)." }
    ]
  },
  {
    name: "История",
    desc: "Ключевые даты, реформы и хронология событий.",
    solutions: [
      { task: "Отмена крепостного права в России", answer: "19 февраля (3 марта) 1861 года — Манифест императора Александра II." },
      { task: "Основание Санкт-Петербурга", answer: "16 (27) мая 1703 года — закладка Петропавловской крепости Петром I." }
    ]
  },
  {
    name: "Информатика",
    desc: "Системы счисления, логические операции и основы алгоритмов.",
    solutions: [
      { task: "Перевод из десятичной системы в двоичную", answer: "Последовательно делите число на 2 с остатком, пока частное не станет равно 0. Запишите остатки в обратном порядке." },
      { task: "Таблица истинности логического И (AND)", answer: "Истина (1) получается только тогда, когда оба высказывания истинны (1 и 1 = 1)." }
    ]
  }
];

// БАЗА ДАННЫХ ЗАДАЧ И НОМЕРОВ ИЗ УЧЕБНИКА
const TASKS_DATABASE = [
  {
    subject: "Алгебра",
    keywords: ["105", "номер 105", "№105", "дискриминант", "x^2 - 5x + 6"],
    condition: "Учебник Алгебра, № 105: Решите квадратное уравнение x² - 5x + 6 = 0.",
    fullAnswer: "Дано: x² - 5x + 6 = 0\nКоэффициенты: a = 1, b = -5, c = 6.\n\nХод решения:\n1. Вычисляем дискриминант по формуле D = b² - 4ac:\nD = (-5)² - 4 · 1 · 6 = 25 - 24 = 1.\n2. Так как D > 0, уравнение имеет два корня:\nx₁ = (5 + √1) / (2 · 1) = (5 + 1) / 2 = 3.\nx₂ = (5 - √1) / (2 · 1) = (5 - 1) / 2 = 2.\n\nОкончательный ответ: x₁ = 3; x₂ = 2."
  },
  {
    subject: "Алгебра",
    keywords: ["24", "номер 24", "№24", "процент", "скидк"],
    condition: "Учебник Алгебра, № 24: Товар стоил 2000 рублей, затем цену снизили на 15%. Сколько стал стоить товар?",
    fullAnswer: "Дано: начальная цена = 2000 руб., скидка = 15%.\n\nХод решения:\n1. Найдём 1% от суммы: 2000 / 100 = 20 руб.\n2. Найдём размер скидки (15%): 20 · 15 = 300 руб.\n3. Вычтем скидку из начальной цены: 2000 - 300 = 1700 руб.\n\nОкончательный ответ: 1700 рублей."
  },
  {
    subject: "Русский язык",
    keywords: ["48", "номер 48", "№48", "упражнение 48", "корн", "чередован"],
    condition: "Учебник Русский язык, Упражнение № 48: Вставьте пропущенные буквы в словах с чередующимися гласными в корне (р..сти, заг..реть, соб..рать).",
    fullAnswer: "Полный разбор упражнения № 48:\n1. рАсти — в корне -раст-/-ращ-/-рос- перед «ст» пишется буква А.\n2. загОреть — в корне -гар-/-гор- без ударения пишется буква О.\n3. собИрать — в корне -бер-/-бир- пишется И, так как после корня стоит суффикс -а-.\n\nОкончательный ответ: расти, загореть, собирать."
  },
  {
    subject: "Физика",
    keywords: ["12", "номер 12", "№12", "плотност", "масс", "объем"],
    condition: "Учебник Физика, Задача № 12: Определите массу железного бруска объёмом 0,2 м³, если плотность железа равна 7800 кг/м³.",
    fullAnswer: "Дано:\nV = 0,2 м³\nρ = 7800 кг/м³\nНайти: m - ?\n\nХод решения:\n1. Запишем формулу связи массы, плотности и объёма: m = ρ · V.\n2. Подставим значения из условия: m = 7800 кг/м³ · 0,2 м³ = 1560 кг.\n\nОкончательный ответ: m = 1560 кг (или 1,56 т)."
  },
  {
    subject: "Информатика",
    keywords: ["15", "номер 15", "№15", "информац", "байт", "бит", "двоич"],
    condition: "Учебник Информатика, Задание № 15: Переведите число 25 из десятичной системы счисления в двоичную.",
    fullAnswer: "Дано: 25₁₀.\n\nХод решения (деление столбиком на 2):\n25 : 2 = 12 (остаток 1)\n12 : 2 = 6 (остаток 0)\n6 : 2 = 3 (остаток 0)\n3 : 2 = 1 (остаток 1)\n1 : 2 = 0 (остаток 1)\nЗаписываем остатки снизу вверх: 11001.\n\nОкончательный ответ: 25₁₀ = 11001₂."
  }
];

// Состояние приложения
let isLoginMode = false;
let currentUser = JSON.parse(localStorage.getItem("edu_current_user")) || null;
let users = JSON.parse(localStorage.getItem("edu_users")) || [];
let grades = JSON.parse(localStorage.getItem("edu_grades")) || [];
let docs = JSON.parse(localStorage.getItem("edu_docs")) || [];

// Элементы авторизации
const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authTitle = document.getElementById("auth-title");
const registerFields = document.getElementById("register-fields");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const switchText = document.getElementById("switch-text");
const switchModeBtn = document.getElementById("switch-mode-btn");
const authError = document.getElementById("auth-error");

// Переключение между Регистрацией и Входом
switchModeBtn.addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  authError.textContent = "";

  if (isLoginMode) {
    authTitle.textContent = "Вход в аккаунт";
    registerFields.classList.add("hidden");
    authSubmitBtn.textContent = "Войти";
    switchText.textContent = "Нет аккаунта?";
    switchModeBtn.textContent = "Зарегистрироваться";
  } else {
    authTitle.textContent = "Регистрация";
    registerFields.classList.remove("hidden");
    authSubmitBtn.textContent = "Зарегистрироваться";
    switchText.textContent = "Есть аккаунт?";
    switchModeBtn.textContent = "Войти";
  }
});

// Обработка формы Регистрации / Входа
document.getElementById("auth-form").addEventListener("submit", (e) => {
  e.preventDefault();
  authError.textContent = "";

  const login = document.getElementById("login-input").value.trim();
  const password = document.getElementById("password-input").value.trim();

  if (isLoginMode) {
    const found = users.find(u => u.login === login && u.password === password);
    if (!found) {
      authError.textContent = "Неверный логин или пароль.";
      return;
    }
    currentUser = found;
    localStorage.setItem("edu_current_user", JSON.stringify(currentUser));
    openPlatform();
  } else {
    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const role = document.getElementById("user-role").value;

    if (!firstName || !lastName) {
      authError.textContent = "Пожалуйста, введите имя и фамилию.";
      return;
    }

    if (users.some(u => u.login === login)) {
      authError.textContent = "Такой логин уже занят.";
      return;
    }

    const newUser = { firstName, lastName, role, login, password };
    users.push(newUser);
    localStorage.setItem("edu_users", JSON.stringify(users));

    currentUser = newUser;
    localStorage.setItem("edu_current_user", JSON.stringify(currentUser));
    openPlatform();
  }
});

// Выход из аккаунта
document.getElementById("logout-btn").addEventListener("click", () => {
  currentUser = null;
  localStorage.removeItem("edu_current_user");
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
});

// Запуск платформы в зависимости от роли
function openPlatform() {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  document.getElementById("user-fullname").textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById("user-badge").textContent = currentUser.role === "teacher" ? "Учитель" : "Ученик";

  if (currentUser.role === "teacher") {
    document.getElementById("student-view").classList.add("hidden");
    document.getElementById("teacher-view").classList.remove("hidden");
    renderTeacherJournal();
    renderTeacherDocs();
  } else {
    document.getElementById("teacher-view").classList.add("hidden");
    document.getElementById("student-view").classList.remove("hidden");
    renderSubjects();
    renderStudentDiary();
  }
}

// Переключение вкладок внутри кабинета
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const parent = btn.closest("main");
    parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    parent.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.target).classList.remove("hidden");
  });
});

// === ЛОГИКА УЧЕНИКА: ПРЕДМЕТЫ ===
function renderSubjects() {
  const grid = document.getElementById("subjects-grid");
  grid.innerHTML = "";

  SUBJECTS_DATA.forEach((subj, idx) => {
    const card = document.createElement("div");
    card.className = "card subject-card";
    card.innerHTML = `
      <h3>${subj.name}</h3>
      <p>${subj.desc}</p>
      <button class="btn-primary" onclick="openSubjectModal(${idx})">Открыть базовые решения</button>
    `;
    grid.appendChild(card);
  });
}
