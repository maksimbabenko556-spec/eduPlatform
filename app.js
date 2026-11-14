/* ==================== FIREBASE: ОБЩАЯ БАЗА ДЛЯ ВСЕХ УСТРОЙСТВ И БРАУЗЕРОВ ==================== */
const firebaseConfig = {
  apiKey: "ВСТАВЬ_СЮДА_apiKey",
  authDomain: "ВСТАВЬ_СЮДА_authDomain",
  databaseURL: "ВСТАВЬ_СЮДА_databaseURL",
  projectId: "ВСТАВЬ_СЮДА_projectId",
  appId: "ВСТАВЬ_СЮДА_appId"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const MOD_CODE = '5555'; // секретный код модератора, нигде не показывается
const roleNames = { author: 'Автор', moderator: 'Модератор' };
const userKey = email => email.replace(/[.#$/[\]]/g, '_');

let me = JSON.parse(sessionStorage.getItem('mr_me') || 'null');

/* ==================== РЕГИСТРАЦИЯ ==================== */
toLogin.onclick = e => { e.preventDefault(); regForm.parentElement.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regForm.parentElement.classList.remove('hidden'); };

document.querySelectorAll('input[name="role"]').forEach(r =>
  r.addEventListener('change', () =>
    document.getElementById('regCode').classList.toggle('hidden', r.value !== 'moderator')
  ));

regForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = regEmail.value.trim().toLowerCase();
  const phone = regPhone.value.trim();
  if (phone.length < 6) return alert('Введите корректный номер телефона');
  const role = document.querySelector('input[name="role"]:checked').value;
  if (role === 'moderator' && regCode.value !== MOD_CODE) return alert('Регистрация не выполнена');

  db.ref('users/' + userKey(email)).get().then(snap => {
    if (snap.exists()) return alert('Такая почта уже зарегистрирована');
    db.ref('users/' + userKey(email)).set({
      fio: regFio.value.trim(),
      phone,
      email,
      pass: regPass.value,
      role
    }).then(() => {
      sessionStorage.setItem('mr_me', JSON.stringify({ email, role }));
      location.reload(); // после регистрации сразу открывается главная
    });
  });
});

/* ==================== ВХОД ==================== */
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = logEmail.value.trim().toLowerCase();
  db.ref('users/' + userKey(email)).get().then(snap => {
    const u = snap.val();
    if (!u || u.pass !== logPass.value) return alert('Неверная почта или пароль');
    sessionStorage.setItem('mr_me', JSON.stringify({ email: u.email, role: u.role }));
    location.reload();
  });
});

exitBtn.onclick = () => { sessionStorage.removeItem('mr_me'); location.reload(); };

/* ==================== ЗАПУСК: после регистрации сразу главная ==================== */
if (me) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  db.ref('users/' + userKey(me.email)).get().then(snap => {
    const u = snap.val();
    if (u) userBadge.textContent = u.fio + ' · ' + u.phone + ' · ' + roleNames[u.role];
  });

  // Строгое разделение меню по ролям
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
    }));

  /* ==================== ЖИВАЯ БАЗА ЗАЯВОК ==================== */
  let allRequests = {};
  db.ref('requests').on('value', snap => {
    allRequests = snap.val() || {};
    render();
  });

  const asList = () => Object.entries(allRequests).map(([key, r]) => ({ key, ...r }));
  const myTracks = () => asList().filter(r => r.author === me.email);

  function render() {
    if (me.role === 'author') { renderHistory(); renderMine(); }
    else { renderAll(); renderVerified(); }
  }

  /* ==================== АВТОР: ЗАГРУЗКА ТРЕКА ==================== */
  trackForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = trackFile.files[0];
    if (!file) return alert('Выберите файл трека');
    if (file.size > 5 * 1024 * 1024) return alert('Файл больше 5 МБ — выбери запись поменьше, чтобы заявка точно дошла');

    const reader = new FileReader();
    reader.onload = () => {
      db.ref('requests').push({
        author: me.email,
        title: trackTitle.value.trim(),
        desc: trackDesc.value.trim(),
        file: reader.result,
        status: 'processing',
        reason: '',
        date: new Date().toLocaleDateString()
      }).then(() => {
        trackForm.reset();
        uploadMsg.textContent = '✅ Трек отправлен на модерацию! Модератор увидит заявку мгновенно.';
        uploadMsg.classList.remove('hidden');
        setTimeout(() => uploadMsg.classList.add('hidden'), 4000);
      });
    };
    reader.readAsDataURL(file);
  });

  /* ==================== АВТОР: ИСТОРИЯ ЗАЯВОК ==================== */
  function renderHistory() {
    const list = myTracks().reverse();
    historyList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>${escapeHtml(r.title)} <span class="status ${r.status}">${statusName(r.status)}</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Отправлено: ${r.date}</p>
        ${r.reason ? `<p><b>Причина модератора:</b> ${escapeHtml(r.reason)}</p>` : ''}
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Заявок пока нет — загрузи первый трек через «Загрузка треков».</p>';
  }

  /* ==================== АВТОР: МОИ ТРЕКИ (одобренные с комментариями) ==================== */
  function renderMine() {
    const approved = myTracks().filter(r => r.status === 'approved').reverse();
    myList.innerHTML = approved.length ? approved.map(r => `
      <div class="song-card">
        <h3>💿 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Одобрено: ${r.date}</p>
        ${r.reason ? `<div class="comment-box"><b>Комментарий модератора:</b> ${escapeHtml(r.reason)}</div>` : ''}
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Одобренных треков пока нет — они появятся здесь после верификации.</p>';
  }

  /* ==================== МОДЕРАТОР: ОБЩИЕ ЗАЯВКИ ==================== */
  function renderAll() {
    const list = asList().filter(r => r.status === 'processing').reverse();
    allList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎵 ${escapeHtml(r.title)} <span class="status processing">Обработка</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p class="muted">Автор скрыт — анонимная проверка</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="req-actions">
          <input type="text" id="reason-${r.key}" placeholder="Причина решения *" required>
          <button class="btn btn-sm ok" onclick="decide('${r.key}', true)">Одобрить</button>
          <button class="btn btn-sm no" onclick="decide('${r.key}', false)">Отклонить</button>
        </div>
      </div>`).join('') : '<p class="muted">Новых заявок нет ✨</p>';
  }

  /* ==================== МОДЕРАТОР: РЕШЕНИЕ С ОБЯЗАТЕЛЬНОЙ ПРИЧИНОЙ ==================== */
  window.decide = (key, ok) => {
    const reason = document.getElementById('reason-' + key).value.trim();
    if (!reason) return alert('Укажи причину решения — она обязательна'); // строгая логика: без причины нельзя
    db.ref('requests/' + key).update({
      status: ok ? 'approved' : 'declined',
      reason
    });
  };

  /* ==================== МОДЕРАТОР: ВЕРИФИЦИРОВАННЫЕ ЗАЯВКИ ==================== */
  function renderVerified() {
    const list = asList().filter(r => r.status === 'approved').reverse();
    verList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Одобрено: ${r.date}</p>
        <div class="comment-box"><b>Причина одобрения:</b> ${escapeHtml(r.reason)}</div>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Верифицированных заявок пока нет.</p>';
  }
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function statusName(s) { return { processing: 'Обработка', approved: 'Одобрено', declined: 'Отклонено' }[s]; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
