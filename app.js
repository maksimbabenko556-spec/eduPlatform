/* ==================== DATA STORE ==================== */
const getUsers = () => JSON.parse(localStorage.getItem('mh_users') || '[]');
const saveUsers = u => localStorage.setItem('mh_users', JSON.stringify(u));
const getRequests = () => JSON.parse(localStorage.getItem('mh_requests') || '[]');
const saveRequests = r => localStorage.setItem('mh_requests', JSON.stringify(r));
const roleNames = { author: 'Автор-исполнитель', moderator: 'Модератор' };
const MOD_CODE = '5555'; // секретный код модератора, нигде не показывается

const me = (() => {
  const email = sessionStorage.getItem('mh_session');
  return email ? getUsers().find(u => u.email === email) : null;
})();

/* ==================== РЕГИСТРАЦИЯ / ВХОД ==================== */
toLogin.onclick = e => { e.preventDefault(); regBlock.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regBlock.classList.remove('hidden'); };

document.querySelectorAll('input[name="role"]').forEach(r =>
  r.addEventListener('change', () =>
    document.getElementById('regCode').classList.toggle('hidden', r.value !== 'moderator')
  ));

regForm.addEventListener('submit', e => {
  e.preventDefault();
  const users = getUsers();
  const email = regEmail.value.trim().toLowerCase();
  if (users.some(u => u.email === email)) return alert('Такая почта уже зарегистрирована');
  const role = document.querySelector('input[name="role"]:checked').value;
  if (role === 'moderator' && regCode.value !== MOD_CODE) return alert('Регистрация не выполнена');
  users.push({ name: regName.value.trim(), surname: regSurname.value.trim(), email, pass: regPass.value, role });
  saveUsers(users);
  sessionStorage.setItem('mh_session', email);
  location.reload();
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const u = getUsers().find(x => x.email === logEmail.value.trim().toLowerCase() && x.pass === logPass.value);
  if (!u) return alert('Неверная почта или пароль');
  sessionStorage.setItem('mh_session', u.email);
  location.reload();
});

exitBtn.onclick = () => { sessionStorage.removeItem('mh_session'); location.reload(); };

/* ==================== ЗАПУСК ==================== */
if (me) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  userBadge.textContent = me.name + ' ' + me.surname + ' · ' + roleNames[me.role];

  // Обе меню показываются корректно — ошибка прошлой версии исправлена
  if (me.role === 'moderator') {
    authorMenu.classList.add('hidden');
    modMenu.classList.remove('hidden');
  } else {
    modMenu.classList.add('hidden');
    authorMenu.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
      render();
    }));

  function render() {
    if (me.role === 'author') { renderHome(); renderHistory(); }
    else { renderModRequests(); renderModApproved(); }
  }
  render();

  /* ==================== АВТОР ==================== */
  const myRequests = () => getRequests().filter(r => r.author === me.email);

  // Главная: верифицированные релизы
  function renderHome() {
    const approved = myRequests().filter(r => r.status === 'approved').reverse();
    verifiedHome.innerHTML = approved.length ? approved.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Верифицированных релизов пока нет — подай заявку через меню слева!</p>';
  }

  // Загрузка заявки
  songForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = songFile.files[0];
    if (!file) return alert('Выберите файл с песней');
    const reader = new FileReader();
    reader.onload = () => {
      const reqs = getRequests();
      reqs.push({
        id: Date.now(),
        author: me.email,
        title: songTitle.value.trim(),
        desc: songDesc.value.trim(),
        file: reader.result,
        status: 'processing',
        reason: '',
        date: new Date().toLocaleDateString()
      });
      saveRequests(reqs);
      songForm.reset();
      uploadMsg.textContent = '✅ Заявка отправлена! Статус: обработка — отслеживай в «Истории заявок».';
      uploadMsg.classList.remove('hidden');
      setTimeout(() => uploadMsg.classList.add('hidden'), 4000);
      render();
    };
    reader.readAsDataURL(file);
  });

  function renderHistory() {
    const list = myRequests().slice().reverse();
    historyList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>${escapeHtml(r.title)} <span class="status ${r.status}">${statusName(r.status)}</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Отправлено: ${r.date}</p>
        ${r.reason ? `<p><b>Мотивация модерации:</b> ${escapeHtml(r.reason)}</p>` : ''}
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Заявок пока нет.</p>';
  }

  /* ==================== МОДЕРАТОР ==================== */
  function renderModRequests() {
    const list = getRequests().filter(r => r.status === 'processing').reverse();
    modList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎵 ${escapeHtml(r.title)} <span class="status processing">Обработка</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p class="muted">Автор: скрыт</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="req-actions">
          <input type="text" id="reason-${r.id}" placeholder="Мотивация решения (необязательно)">
          <button class="btn btn-sm ok" onclick="decide(${r.id}, true)">Одобрить</button>
          <button class="btn btn-sm no" onclick="decide(${r.id}, false)">Отклонить</button>
        </div>
      </div>`).join('') : '<p class="muted">Новых заявок нет ✨</p>';
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

  function renderModApproved() {
    const list = getRequests().filter(r => r.status === 'approved').reverse();
    modApproved.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Дата: ${r.date}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Верифицированных релизов пока нет.</p>';
  }

  /* ==================== АВТООБНОВЛЕНИЕ ==================== */
  window.addEventListener('storage', e => {
    if (['mh_requests', 'mh_users'].includes(e.key)) render();
  });
  setInterval(() => {
    const snapshot = localStorage.getItem('mh_requests');
    if (window._lastReqs !== undefined && window._lastReqs !== snapshot) render();
    window._lastReqs = snapshot;
  }, 3000);
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function statusName(s) { return { processing: 'Обработка', approved: 'Одобрено', declined: 'Отклонено' }[s]; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
