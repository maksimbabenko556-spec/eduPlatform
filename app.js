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

// === ЛОГИКА УЧЕНИКА ===
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

window.openSubjectModal = function(idx) {
  const subj = SUBJECTS_DATA[idx];
  document.getElementById("modal-subject-title").textContent = `${subj.name} — базовые решения`;
  const body = document.getElementById("modal-subject-body");
  body.innerHTML = subj.solutions.map(s => `
    <div class="solution-item">
      <strong>${s.task}</strong>
      <p style="margin-top:6px; white-space: pre-line;">${s.answer}</p>
    </div>
  `).join("");
  document.getElementById("subject-modal").classList.remove("hidden");
};

document.getElementById("close-modal-btn").addEventListener("click", () => {
  document.getElementById("subject-modal").classList.add("hidden");
});

function renderStudentDiary() {
  const tbody = document.getElementById("student-grades-body");
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`.toLowerCase();
  const myGrades = grades.filter(g => g.student.toLowerCase() === fullName);
  if (myGrades.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Оценок пока нет.</td></tr>`;
    return;
  }

  tbody.innerHTML = myGrades.map(g => `
    <tr>
      <td>${g.date}</td>
      <td>${g.subject}</td>
      <td>${g.topic}</td>
      <td><span class="grade-pill">${g.grade}</span></td>
    </tr>
  `).join("");
}

document.getElementById("request-grade-btn").addEventListener("click", () => {
  const fullName = `${currentUser.firstName} ${currentUser.lastName}`;
  grades.unshift({
    date: new Date().toLocaleDateString("ru-RU"),
    student: fullName,
    subject: "Алгебра",
    topic: "Запрос на проверку работы",
    grade: "Ожидает оценки"
  });
  localStorage.setItem("edu_grades", JSON.stringify(grades));
  renderStudentDiary();
  document.getElementById("request-status").textContent = "Заявка отправлена! Учитель увидит её в своём журнале.";
});

// === ЛОГИКА УЧИТЕЛЯ ===
document.getElementById("add-grade-btn").addEventListener("click", () => {
  const student = document.getElementById("grade-student-name").value.trim();
  const subject = document.getElementById("grade-subject").value;
  const topic = document.getElementById("grade-topic").value.trim() || "Работа на уроке";
  const grade = document.getElementById("grade-value").value;

  if (!student) return;

  grades.unshift({
    date: new Date().toLocaleDateString("ru-RU"),
    student,
    subject,
    topic,
    grade
  });
  localStorage.setItem("edu_grades", JSON.stringify(grades));
  document.getElementById("grade-student-name").value = "";
  document.getElementById("grade-topic").value = "";
  renderTeacherJournal();
});