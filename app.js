/* ==================== FIREBASE: ОБЩАЯ БАЗА ДЛЯ ВСЕХ УСТРОЙСТВ ==================== */
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
const roleNames = { artist: 'Артист', moderator: 'Модератор' };
const userKey = email => email.replace(/[.#$/[\]]/g, '_');

// Сессия хранится локально, данные — в облаке
let me = JSON.parse(sessionStorage.getItem('mm_me') || 'null');

/* ==================== РЕГИСТРАЦИЯ / ВХОД ==================== */
toLogin.onclick = e => { e.preventDefault(); regBlock.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regBlock.classList.remove('hidden'); };

document.querySelectorAll('input[name="role"]').forEach(r =>
  r.addEventListener('change', () =>
    document.getElementById('regCode').classList.toggle('hidden', r.value !== 'moderator')
  ));

regForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = regEmail.value.trim().toLowerCase();
  const role = document.querySelector('input[name="role"]:checked').value;
  if (role === 'moderator' && regCode.value !== MOD_CODE) return alert('Регистрация не выполнена');

  db.ref('users/' + userKey(email)).get().then(snap => {
    if (snap.exists()) return alert('Такая почта уже зарегистрирована');
    db.ref('users/' + userKey(email)).set({
      name: regName.value.trim(),
      surname: regSurname.value.trim(),
      email, pass: regPass.value, role
    }).then(() => {
      sessionStorage.setItem('mm_me', JSON.stringify({ email, role }));
      location.reload();
    });
  });
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = logEmail.value.trim().toLowerCase();
  db.ref('users/' + userKey(email)).get().then(snap => {
    const u = snap.val();
    if (!u || u.pass !== logPass.value) return alert('Неверная почта или пароль');
    sessionStorage.setItem('mm_me', JSON.stringify({ email: u.email, role: u.role }));
    location.reload();
  });
});

exitBtn.onclick = () => { sessionStorage.removeItem('mm_me'); location.reload(); };

/* ==================== ЗАПУСК ==================== */
if (me) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  db.ref('users/' + userKey(me.email)).get().then(snap => {
    const u = snap.val();
    if (u) userBadge.textContent = u.name + ' ' + u.surname + ' · ' + roleNames[u.role];
  });

  if (me.role === 'moderator') {
    artistMenu.classList.add('hidden');
    modMenu.classList.remove('hidden');
  } else {
    modMenu.classList.add('hidden');
    artistMenu.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
    }));

  /* ==================== ЖИВАЯ БАЗА: заявки приходят мгновенно с любого устройства ==================== */
  let allRequests = {};
  db.ref('requests').on('value', snap => {
    allRequests = snap.val() || {};
    render();
  });

  const asList = () => Object.entries(allRequests).map(([key, r]) => ({ key, ...r }));
  const myTracks = () => asList().filter(r => r.artist === me.email);

  function render() {
    if (me.role === 'artist') { renderHome(); renderHistory(); }
    else { renderCheck(); renderVerified(); }
  }

  /* ==================== АРТИСТ ==================== */

  // Главная: верифицированные треки с плеером и «Поделиться где угодно»
  function renderHome() {
    const approved = myTracks().filter(r => r.status === 'approved').reverse();
    homeList.innerHTML = approved.length ? approved.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="share-row">
          <input type="text" id="link-${r.key}" value="${r.publicUrl || ''}" readonly>
          <button class="share-btn tg" onclick="shareTrack('${r.key}','tg')">Telegram</button>
          <button class="share-btn wa" onclick="shareTrack('${r.key}','wa')">WhatsApp</button>
          <button class="share-btn any" onclick="shareTrack('${r.key}','any')">Поделиться где угодно</button>
          <button class="share-btn copy" onclick="shareTrack('${r.key}','copy')">Скопировать</button>
        </div>
      </div>`).join('') : '<p class="muted">Верифицированных треков пока нет — загрузи первый через меню слева!</p>';
  }

  // Табличка загрузки: название, о треке, файл
  trackForm.addEventListener('submit', e => {
    e.preventDefault();
    const file = trackFile.files[0];
    if (!file) return alert('Выберите файл данного трека');
    if (file.size > 5 * 1024 * 1024) return alert('Файл больше 5 МБ — выбери запись поменьше, чтобы заявка точно дошла');
    if (!trackClean.checked) return alert('Подтверди чистоту записи: голос без шума, частота 10–40 кГц');

    const reader = new FileReader();
    reader.onload = () => {
      const ref = db.ref('requests').push();
      const trackId = ref.key;
      const publicUrl = location.origin + location.pathname + '#track-' + trackId;
      ref.set({
        artist: me.email,
        trackId,
        title: trackTitle.value.trim(),
        desc: trackDesc.value.trim(),
        file: reader.result,
        status: 'processing',
        reason: '',
        publicUrl,
        date: new Date().toLocaleDateString()
      }).then(() => {
        trackForm.reset();
        uploadLink.value = publicUrl;
        uploadLinkBox.classList.remove('hidden');
        uploadMsg.textContent = '✅ Заявка отправлена! Ссылка на трек уже готова ниже.';
        uploadMsg.classList.remove('hidden');
        lastLink = publicUrl;
      });
    };
    reader.readAsDataURL(file);
  });

  let lastLink = '';

  // Поделиться после загрузки
  window.shareLink = where => doShare(lastLink, where, 'Мой трек на портале «Моя музыка»!');

  // Поделиться с главной
  window.shareTrack = (key, where) => {
    const r = asList().find(x => x.key === key);
    if (r) doShare(r.publicUrl, where, 'Послушай трек «' + r.title + '» на портале «Моя музыка»!');
  };

  function doShare(url, where, text) {
    const full = text + ' ' + url;
    if (where === 'tg') window.open('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank');
    else if (where === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(full), '_blank');
    else if (where === 'copy') copyText(url);
    else {
      if (navigator.share) navigator.share({ title: 'Моя музыка', text, url }).catch(() => {});
      else copyText(full);
    }
  }

  function copyText(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => alert('Скопировано ✅')).catch(() => fallbackCopy(t));
    else fallbackCopy(t);
  }
  function fallbackCopy(t) {
    const ta = document.createElement('textarea');
    ta.value = t; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    alert('Скопировано ✅');
  }

  // История заявок
  function renderHistory() {
    const list = myTracks().reverse();
    historyList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>${escapeHtml(r.title)} <span class="status ${r.status}">${statusName(r.status)}</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Отправлено: ${r.date} · Ссылка: ${r.publicUrl || '—'}</p>
        ${r.reason ? `<p><b>Мотивация модерации:</b> ${escapeHtml(r.reason)}</p>` : ''}
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Заявок пока нет.</p>';
  }

  /* ==================== МОДЕРАТОР ==================== */
  function renderCheck() {
    const list = asList().filter(r => r.status === 'processing').reverse();
    checkList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎵 ${escapeHtml(r.title)} <span class="status processing">Обработка</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p class="muted">Артист: скрыт</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
        <div class="req-actions">
          <input type="text" id="reason-${r.key}" placeholder="Мотивация решения (необязательно)">
          <button class="btn btn-sm ok" onclick="decide('${r.key}', true)">Одобрить</button>
          <button class="btn btn-sm no" onclick="decide('${r.key}', false)">Отклонить</button>
        </div>
      </div>`).join('') : '<p class="muted">Новых заявок нет ✨</p>';
  }

  window.decide = (key, ok) => {
    db.ref('requests/' + key).update({
      status: ok ? 'approved' : 'declined',
      reason: document.getElementById('reason-' + key).value.trim()
    });
  };

  function renderVerified() {
    const list = asList().filter(r => r.status === 'approved').reverse();
    verifiedList.innerHTML = list.length ? list.map(r => `
      <div class="song-card">
        <h3>🎶 ${escapeHtml(r.title)} <span class="badge-verified">✔ Верифицировано</span></h3>
        <p>${escapeHtml(r.desc)}</p>
        <p>Дата: ${r.date}</p>
        ${r.file ? `<audio controls src="${r.file}"></audio>` : ''}
      </div>`).join('') : '<p class="muted">Верифицированных заявок пока нет.</p>';
  }
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function statusName(s) { return { processing: 'Обработка', approved: 'Одобрено', declined: 'Отклонено' }[s]; }
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
