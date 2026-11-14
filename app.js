/* ==================== DATA STORE (localStorage) ==================== */
const getUsers = () => JSON.parse(localStorage.getItem('mm_users') || '[]');
const saveUsers = u => localStorage.setItem('mm_users', JSON.stringify(u));
const getRequests = () => JSON.parse(localStorage.getItem('mm_requests') || '[]');
const saveRequests = r => localStorage.setItem('mm_requests', JSON.stringify(r));
const roleNames = { author: 'Автор-исполнитель', moderator: 'Модератор' };
const MOD_CODE = '5555'; // секретный код, нигде не показывается

const me = (() => {
  const email = sessionStorage.getItem('mm_session');
  return email ? getUsers().find(u => u.email === email) : null;
})();

/* ==================== РЕГИСТРАЦИЯ / ВХОД ==================== */
toLogin.onclick = e => { e.preventDefault(); regBlock.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regBlock.classList.remove('hidden'); };

// Поле кода появляется только при выборе роли "Модератор" — без подсказок
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
  sessionStorage.setItem('mm_session', email);
  location.reload();
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const u = getUsers().find(x => x.email === logEmail.value.trim().toLowerCase() && x.pass === logPass.value);
  if (!u) return alert('Неверная почта или пароль');
  sessionStorage.setItem('mm_session', u.email);
  location.reload();
});

exitBtn.onclick = () => { sessionStorage.removeItem('mm_session'); location.reload(); };

/* ==================== ЗАПУСК ПРИЛОЖЕНИЯ ==================== */
if (me) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  userBadge.textContent = me.name + ' ' + me.surname + ' · ' + roleNames[me.role];

  if (me.role === 'moderator') {
    authorMenu.classList.add('hidden');
    modMenu.classList.remove('hidden');
  } else {
    modMenu.classList.add('hidden');
    authorMenu.classList.remove('hidden');
  }

  // Навигация
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

  // Главная: одобренные песни с кнопкой "Поделиться"
  function renderHome() {
    const approved = myRequests().filter(r => r.status === 'approved').reverse();
    approvedHome.innerHTML = approved.length ? approved.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="status approved">Одобрено</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="share-row">
          <input type="text" id="link-${r.id}" value="${location.origin + location.pathname + '#song-' + r.id}" readonly>
          <button class="share-btn tg" onclick="shareTelegram(${r.id})">Telegram</button>
          <button class="share-btn max" onclick="shareMax(${r.id})">MAX</button>
        </div>
      </div>`).join('') : '<p class="muted">Одобренных песен пока нет — загрузи свой первый релиз!</p>';
  }

  // Поделиться: Telegram — прямая ссылка, MAX — через системное окно или копирование
  window.shareTelegram = id => {
    const r = myRequests().find(x => x.id === id);
    const text = 'Послушай мою песню «' + r.title + '» на портале «Моя музыка»!';
    const url = document.getElementById('link-' + id).value;
    window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank');
  };

  window.shareMax = async id => {
    const r = myRequests().find(x => x.id === id);
    const url = document.getElementById('link-' + id).value;
    const text = 'Послушай мою песню «' + r.title + '» на портале «Моя музыка»! ' + url;
    if (navigator.share) {
      try { await navigator.share({ title: r.title, text }); } catch (e) { /* отменено пользователем */ }
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      alert('Ссылка скопирована — вставь её в MAX или Telegram');
    }
  };

  // Загрузка песни
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
      uploadMsg.textContent = '✅ Заявка отправлена! Статус: обработка. Смотри «История заявок».';
      uploadMsg.classList.remove('hidden');
      setTimeout(() => uploadMsg.classList.add('hidden'), 4000);
      render();
    };
    reader.readAsDataURL(file);
  });

  // История заявок
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
        <h3>🎶 ${escapeHtml(r.title)} <span class="status approved">Одобрено</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Дата: ${r.date}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Одобренных релизов пока нет.</p>';
  }
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function statusName(s) { return { processing: 'Обработка', approved: 'Одобрено', declined: 'Отклонено' }[s]; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
