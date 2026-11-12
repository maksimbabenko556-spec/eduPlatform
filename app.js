/* ===== Хранилище ===== */
const getUsers = () => JSON.parse(localStorage.getItem('og_users') || '[]');
const saveUsers = u => localStorage.setItem('og_users', JSON.stringify(u));
const getGrades = () => JSON.parse(localStorage.getItem('og_grades') || '[]');
const saveGrades = g => localStorage.setItem('og_grades', JSON.stringify(g));
const getHW = () => JSON.parse(localStorage.getItem('og_hw') || '[]');

/* ===== Регистрация ===== */
const regForm = document.getElementById('regForm');
if (regForm) {
  // Поле кода появляется только при выборе "Администрация", без подсказок
  regForm.querySelectorAll('input[name="role"]').forEach(r =>
    r.addEventListener('change', () =>
      document.getElementById('regCode').classList.toggle('hidden', r.value !== 'admin' || !r.checked)
    )
  );

  regForm.addEventListener('submit', e => {
    e.preventDefault();
    const users = getUsers();
    const email = regEmail.value.trim().toLowerCase();
    if (users.some(u => u.email === email)) return alert('Такая почта уже зарегистрирована');

    const role = regForm.querySelector('input[name="role"]:checked').value;
    const user = {
      name: regName.value.trim(), surname: regSurname.value.trim(),
      email, pass: regPass.value, role
    };
    if (role === 'admin') {
      if (regCode.value !== '111') return alert('Регистрация не выполнена');
    }
    users.push(user);
    saveUsers(users);
    sessionStorage.setItem('og_session', email);
    redirectByRole(role);
  });
}

/* ===== Вход ===== */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const users = getUsers();
    const email = logEmail.value.trim().toLowerCase();
    const user = users.find(u => u.email === email && u.pass === logPass.value);
    if (!user) return alert('Неверная почта или пароль');
    if (user.role === 'admin' && logCode.value !== '111') return alert('Вход не выполнен');
    sessionStorage.setItem('og_session', email);
    redirectByRole(user.role);
  });

  // Если в поле ввода почты вписан адрес администрации — показываем поле кода
  logEmail.addEventListener('input', () => {
    const u = getUsers().find(x => x.email === logEmail.value.trim().toLowerCase());
    document.getElementById('logCode').classList.toggle('hidden', !u || u.role !== 'admin');
  });
}

function redirectByRole(role) {
  location.href = role === 'student' ? 'student.html'
                : role === 'teacher' ? 'teacher.html'
                : 'admin.html';
}

function logout() { sessionStorage.removeItem('og_session'); location.href = 'login.html'; }

/* ===== Защита страниц ===== */
const session = sessionStorage.getItem('og_session');
const pageRoles = { 'student.html': 'student', 'teacher.html': 'teacher', 'admin.html': 'admin' };
const pageName = location.pathname.split('/').pop();
const me = session ? getUsers().find(u => u.email === session) : null;

if (pageRoles[pageName]) {
  if (!me || me.role !== pageRoles[pageName]) location.href = 'login.html';
} else if (me) {
  redirectByRole(me.role); // авторизованного сразу переносим на главную его роли
}

const badge = document.getElementById('userBadge');
if (badge && me) badge.textContent = me.name + ' ' + me.surname;
const roleNames = { student: 'Ученик', teacher: 'Учитель', admin: 'Администрация' };

/* ===== Вкладки ===== */
document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(t.dataset.tab).classList.remove('hidden');
  })
);

/* ===== Данные ученика ===== */
const GRADES_LOG = [
  { subject: 'Математика', hw: 'Стр. 42, задачи 5–9', },
  { subject: 'Русский язык', hw: 'Упражнение 118' },
  { subject: 'Литература', hw: 'Прочитать главу 4' },
];

if (pageName === 'student.html' && me) {
  // Дневник
  const grades = getGrades().filter(g => g.studentEmail === me.email);
  diaryBody.innerHTML = GRADES_LOG.map(r => {
    const g = grades.find(x => x.subject === r.subject);
    return `<tr><td>${r.subject}</td><td>${r.hw}</td><td><b>${g ? g.value : '—'}</b></td></tr>`;
  }).join('');

  // Успеваемость
  if (grades.length) {
    const avg = (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(2);
    avgGrade.textContent = avg;
    gradesCount.textContent = grades.length;
    const finals = {};
    grades.forEach(g => finals[g.subject] = g.value);
    finalBody.innerHTML = Object.entries(finals)
      .map(([s, v]) => `<tr><td>${s}</td><td><b>${v}</b></td></tr>`).join('');
  } else {
    avgGrade.textContent = '—';
  }
}

/* ===== Курсы ученика ===== */
const COURSES = {
  math: { title: 'Математика — решение задач', task: 'Задача: В магазине было 45 яблок. Продали 18. Сколько осталось? Запишите решение и ответ.' },
  essay: { title: 'Русский — написать сочинение', task: 'Тема: «Моё любимое время года». Напишите сочинение из 5–7 предложений.' },
  eng: { title: 'Английский — грамматика', task: 'Составьте 5 предложений в Present Simple о своём обычном дне.' }
};

function openCourse(key) {
  courseWork.classList.remove('hidden');
  courseTitle.textContent = COURSES[key].title;
  courseTask.textContent = COURSES[key].task;
  courseResult.textContent = '';
  window._currentCourse = key;
}

function submitCourse() {
  const text = courseAnswer.value.trim();
  if (text.length < 10) return alert('Работа слишком короткая');
  const key = window._currentCourse;
  courseResult.textContent = '✅ Работа отправлена учителю на проверку. Результат появится в дневнике.';
  localStorage.setItem('og_course_' + me.email + '_' + key, JSON.stringify({ text, date: new Date().toLocaleDateString() }));
}

/* ===== Журнал учителя ===== */
if (pageName === 'teacher.html' && me) {
  const students = getUsers().filter(u => u.role === 'student');
  const fillSelect = () =>
    studentSelect.innerHTML = students.map(s =>
      `<option value="${s.email}">${s.name} ${s.surname}</option>`).join('') || '<option>Нет учеников</option>';
  fillSelect();

  window.addGrade = () => {
    const val = parseInt(gradeValue.value);
    if (!val || val < 2 || val > 5) return alert('Оценка от 2 до 5');
    const g = getGrades();
    g.push({ studentEmail: studentSelect.value, subject: subjectSelect.value, value: val, date: new Date().toLocaleDateString(), by: me.email });
    saveGrades(g);
    gradeValue.value = '';
    renderJournal();
  };

  function renderJournal() {
    const grades = getGrades();
    journalBody.innerHTML = grades.map(g => {
      const s = getUsers().find(u => u.email === g.studentEmail);
      return `<tr><td>${s ? s.name + ' ' + s.surname : '—'}</td><td>${g.subject}</td><td><b>${g.value}</b></td><td>${g.date}</td></tr>`;
    }).join('') || '<tr><td colspan="4">Пока нет оценок</td></tr>';

    // Отчёт
    const emails = [...new Set(grades.map(g => g.studentEmail))];
    reportBody.innerHTML = emails.map(e => {
      const list = grades.filter(g => g.studentEmail === e);
      const avg = (list.reduce((s, g) => s + g.value, 0) / list.length).toFixed(2);
      const u = getUsers().find(u => u.email === e);
      const status = avg >= 4.5 ? 'Отличник' : avg >= 3.5 ? 'Хорошист' : 'Требует внимания';
      return `<tr><td>${u ? u.name + ' ' + u.surname : '—'}</td><td>${avg}</td><td>${list.length}</td><td>${status}</td></tr>`;
    }).join('') || '<tr><td colspan="4">Данных нет</td></tr>';
  }
  renderJournal();
}

/* ===== Администрация ===== */
if (pageName === 'admin.html' && me) {
  function renderAdmin() {
    usersBody.innerHTML = getUsers().map((u, i) =>
      `<tr><td>${u.name} ${u.surname}</td><td>${u.email}</td><td>${roleNames[u.role]}</td>
       <td><button class="btn-exit" onclick="delUser(${i})">Удалить</button></td></tr>`).join('');
    stUsers.textContent = getUsers().length;
    stGrades.textContent = getGrades().length;
  }
  window.delUser = i => {
    const users = getUsers();
    if (users[i].email === me.email) return alert('Нельзя удалить себя');
    users.splice(i, 1);
    saveUsers(users);
    renderAdmin();
  };
  renderAdmin();
}
