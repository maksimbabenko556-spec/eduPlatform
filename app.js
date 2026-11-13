/* ==================== DATA STORE (localStorage) ==================== */
const getUsers = () => JSON.parse(localStorage.getItem('ms_users') || '[]');
const saveUsers = u => localStorage.setItem('ms_users', JSON.stringify(u));
const getRequests = () => JSON.parse(localStorage.getItem('ms_requests') || '[]');
const saveRequests = r => localStorage.setItem('ms_requests', JSON.stringify(r));
const roleNames = { author: 'Автор', moderator: 'Модератор' };
const MOD_CODE = '2222'; // секретный код модерации, нигде не выводится

const me = (() => {
  const email = sessionStorage.getItem('ms_session');
  return email ? getUsers().find(u => u.email === email) : null;
})();

/* ==================== БЛОКИРОВКА ==================== */
// Если пользователь забанен — при любом заходе по ссылке прерываем доступ
if (me && me.banned) {
  document.getElementById('blockedScreen').classList.remove('hidden');
  document.getElementById('authWrap').classList.add('hidden');
  throw new Error('ACCESS_DENIED'); // полный останов скрипта — программа недоступна
}

/* ==================== ПЕРЕКЛЮЧЕНИЕ РЕГИСТРАЦИЯ/ВХОД ==================== */
toLogin.onclick = e => { e.preventDefault(); regBlock.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regBlock.classList.remove('hidden'); };

// Поле кода появляется только при выборе роли "Модерация" — без подсказок
document.querySelectorAll('input[name="role"]').forEach(r =>
  r.addEventListener('change', () =>
    document.getElementById('regCode').classList.toggle('hidden', r.value !== 'moderator')
  ));

/* ==================== РЕГИСТРАЦИЯ ==================== */
regForm.addEventListener('submit', e => {
  e.preventDefault();
  const users = getUsers();
  const email = regEmail.value.trim().toLowerCase();
  if (users.some(u => u.email === email)) return alert('Такая почта уже зарегистрирована');

  const role = document.querySelector('input[name="role"]:checked').value;
  if (role === 'moderator' && regCode.value !== MOD_CODE) return alert('Регистрация не выполнена');

  users.push({ name: regName.value.trim(), surname: regSurname.value.trim(), email, pass: regPass.value, role, banned: false });
  saveUsers(users);
  sessionStorage.setItem('ms_session', email);
  location.reload();
});

/* ==================== ВХОД ==================== */
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const u = getUsers().find(x => x.email === logEmail.value.trim().toLowerCase() && x.pass === logPass.value);
  if (!u) return alert('Неверная почта или пароль');
  if (u.banned) {
    // Доступ прерван: показываем экран блокировки вместо входа
    document.getElementById('blockedScreen').classList.remove('hidden');
    document.getElementById('authWrap').classList.add('hidden');
    return;
  }
  sessionStorage.setItem('ms_session', u.email);
  location.reload();
});

/* ==================== ВЫХОД ==================== */
exitBtn.onclick = () => { sessionStorage.removeItem('ms_session'); location.reload(); };

/* ==================== ЗАПУСК ПРИЛОЖЕНИЯ ==================== */
if (me && !me.banned) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  userBadge.textContent = me.name + ' ' + me.surname + ' · ' + roleNames[me.role];

  if (me.role === 'moderator') authorMenu.classList.add('hidden');
  else modMenu.classList.add('hidden');

  // Навигация по меню
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
      render();
    }));

  function render() {
    if (me.role === 'author') { renderStats(); renderHistory(); }
    else { renderModeration(); renderBans(); }
  }
  render();

  /* ==================== АВТОР: СТАТИСТИКА ==================== */
  function myRequests() { return getRequests().filter(r => r.author === me.email); }

  function renderStats() {
    const list = myRequests();
    stTotal.textContent = list.length;
    stWait.textContent = list.filter(r => r.status === 'processing').length;
    stOk.textContent = list.filter(r => r.status === 'approved').length;
  }

  /* ==================== АВТОР: ЗАГРУЗКА ПЕСНИ ==================== */
  songForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = songFile.files[0];
    if (!file) return alert('Выберите файл с песней');
    if (!songClean.checked) return alert('Подтвердите, что файл чистый: голос без шума');

    const reader = new FileReader();
    reader.onload = () => {
      const reqs = getRequests();
      reqs.push({
        id: Date.now(),
        author: me.email,          // хранится в базе, модератору не показывается
        title: songTitle.value.trim(),
        desc: songDesc.value.trim(),
        file: reader.result,
        status: 'processing',      // сразу статус "обработка"
        reason: '',
        date: new Date().toLocaleDateString()
      });
      saveRequests(reqs);
      songForm.reset();
      uploadMsg.textContent = '✅ Заявка отправлена. Статус: обработка. Отслеживайте её в разделе «История заявок».';
      uploadMsg.classList.remove('hidden');
      setTimeout(() => uploadMsg.classList.add('hidden'), 4000);
      render();
    };
    reader.readAsDataURL(file);
  });

  /* ==================== АВТОР: ИСТОРИЯ ЗАЯВОК ==================== */
  function renderHistory() {
    const list = myRequests().slice().reverse();
    historyList.innerHTML = list.length ? list.map(r => `
      <div class="req-card">
        <h3>${escapeHtml(r.title)} <span class="status ${r.status}">${statusName(r.status)}</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Отправлено: ${r.date}</p>
        ${r.status === 'declined' ? `<p style="color:#f87171"><b>Причина отклонения:</b> ${escapeHtml(r.reason || 'не указана')}</p>` : ''}
        ${r.status === 'approved' ? `<p style="color:#4ade80"><b>Причина одобрения:</b> ${escapeHtml(r.reason || 'соответствует требованиям')}</p>` : ''}
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Заявок пока нет — нажмите «➕ Загрузить песню».</p>';
  }

  /* ==================== МОДЕРАТОР: ЗАЯВКИ АНОНИМНО ==================== */
  function renderModeration() {
    const list = getRequests().filter(r => r.status === 'processing').slice().reverse();
    modList.innerHTML = list.length ? list.map(r => `
      <div class="req-card">
        <h3>🎵 ${escapeHtml(r.title)} <span class="status processing">Обработка</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Автор: скрыт (анонимная проверка)</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="req-actions">
          <input type="text" id="reason-${r.id}" placeholder="Причина (необязательно)">
          <button class="btn btn-sm" onclick="decide(${r.id}, true)">Одобрить</button>
          <button class="btn btn-sm danger" onclick="decide(${r.id}, false)">Отклонить</button>
        </div>
      </div>`).join('') : '<p class="muted">Новых заявок нет — всё проверено ✨</p>';
  }

  window.decide = (id, ok) => {
    const reqs = getRequests();
    const r = reqs.find(x => x.id === id);
    if (!r) return;
    r.status = ok ? 'approved' : 'declined';
    r.reason = document.getElementById('reason-' + id).value.trim();
    saveRequests(reqs);
    render();
  };

  /* ==================== МОДЕРАТОР: БЛОКИРОВКА ==================== */
  function renderBans() {
    banList.innerHTML = getUsers().map(u => `
      <div class="req-card">
        <h3>${escapeHtml(u.name)} ${escapeHtml(u.surname)} <span class="status ${u.banned ? 'banned' : 'approved'}">${u.banned ? 'Заблокирован' : 'Активен'}</span></h3>
        <p>${escapeHtml(u.email)} · ${roleNames[u.role]}</p>
      </div>`).join('') || '<p class="muted">Пользователей пока нет.</p>';
  }

  window.banUser = () => {
    const email = banEmail.value.trim().toLowerCase();
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return alert('Пользователь не найден');
    if (u.email === me.email) return alert('Нельзя заблокировать себя');
    u.banned = true;
    saveUsers(users);
    banEmail.value = '';
    renderBans();
  };

  window.unbanUser = () => {
    const email = banEmail.value.trim().toLowerCase();
    const users = getUsers();
    const u = users.find(x => x.email === email);
    if (!u) return alert('Пользователь не найден');
    u.banned = false;
    saveUsers(users);
    banEmail.value = '';
    renderBans();
  };
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function statusName(s) {
  return { processing: 'Обработка', approved: 'Одобрено', declined: 'Отклонено' }[s];
}
function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t || '';
  return d.innerHTML;
}

// Функция для одобрения/отклонения заявок
window.decide = (id, ok) => {
  const reqs = getRequests();
  const r = reqs.find(x => x.id === id);
  if (!r) return;
  r.status = ok ? 'approved' : 'declined';
  r.reason = document.getElementById('reason-' + id).value.trim();
  saveRequests(reqs);
  render();
};

// Функция рендеринга заявок для модератора
function renderModeration() {
  const reqs = getRequests();
  modList.innerHTML = reqs.map(r => `
    <div class="req-card">
      <h3>🎵 ${escapeHtml(r.title)} <span class="status processing">Обработка</span></h3>
      <p>${escapeHtml(r.desc)}</p>
      <div class="req-actions">
        <input type="text" id="reason-${r.id}" placeholder="Причина решения">
        <button onclick="window.decide('${r.id}', true)">Одобрить</button>
        <button onclick="window.decide('${r.id}', false)">Отклонить</button>
      </div>
    </div>
  `).join('');
}

function render() {
  // ... код рендеринга
  if (me.role === 'moderator') {
    renderModeration();
    renderBans();
    if (typeof renderApproved === 'function') renderApproved();
  }
}

/* ===== ОБНОВЛЕНИЕ: журнал одобренных заявок ===== */
if (me && me.role === 'moderator') {
  function renderApproved() {
    const list = getRequests().filter(r => r.status === 'approved').slice().reverse();
    approvedList.innerHTML = list.length ? list.map(r => `
      <div class="req-card">
        <h3>🎵 ${escapeHtml(r.title)} <span class="status approved">Одобрено</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p style="color:#4ade80"><b>Причина одобрения:</b> ${escapeHtml(r.reason || 'соответствует требованиям')}</p>
        <p>Обработано: ${r.date}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Одобренных заявок пока нет.</p>';
  }
  renderApproved();
}
