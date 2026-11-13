/* ===== Хранилище ===== */
const getUsers = () => JSON.parse(localStorage.getItem('mo_users') || '[]');
const saveUsers = u => localStorage.setItem('mo_users', JSON.stringify(u));
const roleNames = { student: 'Ученик', teacher: 'Учитель' };

const me = (() => {
  const email = sessionStorage.getItem('mo_session');
  return email ? getUsers().find(u => u.email === email) : null;
})();

/* ===== Главная страница ===== */
const BOOKS = {
  'Математика 5 класс': 'Учебник содержит натуральные числа, дроби, задачи на движение. 240 страниц.',
  'Математика 6 класс': 'Проценты, пропорции, координатная плоскость, начала геометрии.',
  'Русский язык': 'Правила орфографии, пунктуации, разборы слов и текстов.',
  'Литература': 'Программные произведения с кратким содержанием и анализом.',
  'Английский язык': 'Грамматика, лексика по темам, диалоги и тексты для чтения.',
  'Окружающий мир': 'Природа, история, общество — раздел за разделом.'
};

function openBook(title) {
  const box = document.getElementById('bookInfo');
  box.classList.remove('hidden');
  box.innerHTML = `<h3>${title}</h3><p style="color:var(--muted);margin-top:.4rem">${BOOKS[title]}</p>`;
}

/* ===== Личный кабинет ===== */
if (document.getElementById('regForm')) {
  // Переключение между регистрацией и входом
  showLogin.onclick = e => { e.preventDefault(); authCard.classList.add('hidden'); loginCard.classList.remove('hidden'); };
  showReg.onclick = e => { e.preventDefault(); loginCard.classList.add('hidden'); authCard.classList.remove('hidden'); };

  // Регистрация
  document.getElementById('regForm').addEventListener('submit', e => {
    e.preventDefault();
    const users = getUsers();
    const email = regEmail.value.trim().toLowerCase();
    if (users.some(u => u.email === email)) return alert('Такая почта уже зарегистрирована');
    const role = document.querySelector('input[name="role"]:checked').value;
    users.push({
      name: regName.value.trim(),
      surname: regSurname.value.trim(),
      email, pass: regPass.value, role
    });
    saveUsers(users);
    sessionStorage.setItem('mo_session', email);
    location.reload();
  });

  // Вход
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = getUsers().find(x =>
      x.email === logEmail.value.trim().toLowerCase() && x.pass === logPass.value);
    if (!u) return alert('Неверная почта или пароль');
    sessionStorage.setItem('mo_session', u.email);
    location.reload();
  });
}

// Выход
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.onclick = () => { sessionStorage.removeItem('mo_session'); location.href = 'index.html'; };

// Если кабинет открыт и пользователь не вошёл — показываем регистрацию; вошёл — профиль
if (document.getElementById('profile')) {
  if (me) {
    authCard.classList.add('hidden');
    loginCard.classList.add('hidden');
    profile.classList.remove('hidden');
    document.getElementById('userBadge').textContent = me.name + ' ' + me.surname;

    profName.textContent = me.name + ' ' + me.surname;
    profRole.textContent = roleNames[me.role];
    profEmail.textContent = me.email;
    const savedAvatar = localStorage.getItem('mo_avatar_' + me.email);
    if (savedAvatar) avatar.src = savedAvatar;
    notes.value = localStorage.getItem('mo_notes_' + me.email) || '';

    window.saveAvatar = () => {
      const file = avatarInput.files[0];
      if (!file) return alert('Выберите файл с фото');
      const reader = new FileReader();
      reader.onload = () => {
        localStorage.setItem('mo_avatar_' + me.email, reader.result);
        avatar.src = reader.result;
      };
      reader.readAsDataURL(file);
    };

    window.saveNotes = () => {
      localStorage.setItem('mo_notes_' + me.email, notes.value);
      saveMsg.textContent = '✅ Сохранено';
      setTimeout(() => saveMsg.textContent = '', 2000);
    };
  }
}

// Если пользователь уже вошёл и открыл главную — карандаш превращается в «Мой ЛК»
const lkLink = document.getElementById('lkLink');
if (lkLink && me) lkLink.innerHTML = '<span class="pencil">👤</span><small>Мой ЛК</small>';
