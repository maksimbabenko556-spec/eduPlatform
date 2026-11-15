/* ==================== ДАННЫЕ ==================== */
const DB = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

const MOD_CODE = '555'; // секретный код модератора, нигде не показывается
const roleNames = { student: 'Ученик', teacher: 'Учитель', moderator: 'Модератор' };

const getUsers = () => DB.get('edu_users', []);
const getGrades = () => DB.get('edu_grades', []);
const getTemplates = () => DB.get('edu_templates', []);
const getHomework = () => DB.get('edu_homework', []);
const getApps = () => DB.get('edu_apps', []);

let me = null;
const sessionEmail = sessionStorage.getItem('edu_session');
if (sessionEmail) me = getUsers().find(u => u.email === sessionEmail) || null;

/* ==================== РЕГИСТРАЦИЯ / ВХОД ==================== */
toLogin.onclick = e => { e.preventDefault(); regForm.classList.add('hidden'); loginBlock.classList.remove('hidden'); };
toReg.onclick = e => { e.preventDefault(); loginBlock.classList.add('hidden'); regForm.classList.remove('hidden'); };

// Поле кода появляется внизу формы только у роли «Модератор» — без подсказок
document.querySelectorAll('input[name="role"]').forEach(r =>
  r.addEventListener('change', () =>
    document.getElementById('regCode').classList.toggle('hidden', r.value !== 'moderator')));

regForm.addEventListener('submit', e => {
  e.preventDefault();
  const users = getUsers();
  const email = regEmail.value.trim().toLowerCase();
  if (users.some(u => u.email === email)) return alert('Такая почта уже зарегистрирована');
  const role = document.querySelector('input[name="role"]:checked').value;
  if (role === 'moderator' && regCode.value !== MOD_CODE) return alert('Регистрация не выполнена');
  users.push({ fio: regFio.value.trim(), email, phone: regPhone.value.trim(), pass: regPass.value, role });
  DB.set('edu_users', users);
  sessionStorage.setItem('edu_session', email);
  location.reload();
});

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const u = getUsers().find(x =>
    x.email === logEmail.value.trim().toLowerCase() && x.pass === logPass.value);
  if (!u) return alert('Неверная почта или пароль');
  sessionStorage.setItem('edu_session', u.email);
  location.reload();
});

exitBtn.onclick = () => { sessionStorage.removeItem('edu_session'); location.reload(); };

/* ==================== ЗАПУСК ==================== */
if (me) {
  authWrap.classList.add('hidden');
  app.classList.remove('hidden');
  userBadge.innerHTML = escapeHtml(me.fio) + '<br>' + escapeHtml(me.phone) + ' · ' + roleNames[me.role];

  const menus = { student: studentMenu, teacher: teacherMenu, moderator: modMenu };
  Object.entries(menus).forEach(([role, menu]) => menu.classList.toggle('hidden', role !== me.role));

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
      render();
    }));

  const students = () => getUsers().filter(u => u.role === 'student');
  const gradesOf = email => getGrades().filter(g => g.student === email);

  function render() {
    if (me.role === 'student') { renderDiary(); renderAnalytics(); renderHomework(); }
    if (me.role === 'teacher') { fillStudentSelects(); renderJournal(); renderTemplateList(); }
    if (me.role === 'moderator') { renderInbox(); renderDecided(); }
  }
  render();

  /* ==================== УЧЕНИК: ДНЕВНИК ==================== */
  function renderDiary() {
    const list = gradesOf(me.email).slice().reverse();
    diaryList.innerHTML = list.length ? list.map(g => `
      <div class="card">
        <h3><span class="grade-badge g${g.grade}">${g.grade}</span> ${escapeHtml(g.subject)}</h3>
        <p>Учитель: ${escapeHtml(g.teacherFio)}</p>
        ${g.comment ? `<p>💬 ${escapeHtml(g.comment)}</p>` : ''}
        <p>${g.date}</p>
      </div>`).join('') : '<p class="muted">Оценок пока нет — учителя выставят их в журнале.</p>';
  }

  /* ==================== УЧЕНИК: АНАЛИТИКА ==================== */
  function renderAnalytics() {
    const list = gradesOf(me.email);
    if (!list.length) {
      analyticsBox.innerHTML = '<p class="muted">Данных пока нет — как только появятся оценки, здесь будет аналитика.</p>';
      return;
    }
    const avg = (list.reduce((s, g) => s + g.grade, 0) / list.length).toFixed(2);
    const count = n => list.filter(g => g.grade === n).length;
    const bySubject = {};
    list.forEach(g => { (bySubject[g.subject] = bySubject[g.subject] || []).push(g.grade); });

    analyticsBox.innerHTML = `
      <div class="stat-cards">
        <div class="stat"><span>${avg}</span><small>Средний балл</small></div>
        <div class="stat"><span>${list.length}</span><small>Всего оценок</small></div>
        <div class="stat"><span>${count(5)}</span><small>Пятёрок</small></div>
        <div class="stat"><span>${count(2)}</span><small>Двоек</small></div>
      </div>
      ${Object.entries(bySubject).map(([subj, grades]) => {
        const sAvg = (grades.reduce((s, g) => s + g, 0) / grades.length).toFixed(2);
        return `<div class="card"><h3>${escapeHtml(subj)}</h3><p>Средний балл: <b>${sAvg}</b> · Оценок: ${grades.length} · Лучшее: ${Math.max(...grades)}</p></div>`;
      }).join('')}`;
  }

  /* ==================== УЧЕНИК: ДОМАШКА ==================== */
  function renderHomework() {
    const list = getHomework().filter(h => h.student === me.email).reverse();
    homeworkList.innerHTML = list.length ? list.map(h => `
      <div class="card">
        <h3>📚 ${escapeHtml(h.subject)} ${h.done ? '<span class="status approved">Сдано</span>' : '<span class="status processing">Ожидает</span>'}</h3>
        <p>${escapeHtml(h.text)}</p>
        <p>Сдать до: ${h.due}</p>
        <label class="done-toggle">
          <input type="checkbox" ${h.done ? 'checked' : ''} onchange="toggleHomework(${h.id})">
          Отметить как сдано
        </label>
      </div>`).join('') : '<p class="muted">Домашних заданий пока нет.</p>';
  }

  window.toggleHomework = id => {
    const hw = getHomework();
    const h = hw.find(x => x.id === id);
    if (h) { h.done = !h.done; DB.set('edu_homework', hw); renderHomework(); }
  };

  /* ==================== УЧИТЕЛЬ: ЖУРНАЛ ==================== */
  function fillStudentSelects() {
    const opts = '<option value="">— выбери ученика —</option>' +
      students().map(s => `<option value="${s.email}">${escapeHtml(s.fio)}</option>`).join('');
    grStudent.innerHTML = opts;
    repStudent.innerHTML = opts;
    pickStudent.innerHTML = opts;
  }

  gradeForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!grStudent.value) return alert('Выбери ученика');
    const grades = getGrades();
    grades.push({
      id: Date.now(),
      student: grStudent.value,
      teacher: me.email,
      teacherFio: me.fio,
      subject: grSubject.value.trim(),
      grade: +grGrade.value,
      comment: grComment.value.trim(),
      date: new Date().toLocaleDateString()
    });
    DB.set('edu_grades', grades);
    gradeForm.reset();
    renderJournal();
  });

  function renderJournal() {
    const list = getGrades().filter(g => g.teacher === me.email).reverse();
    journalList.innerHTML = list.length ? list.map(g => {
      const s = getUsers().find(u => u.email === g.student);
      return `<div class="card">
        <h3><span class="grade-badge g${g.grade}">${g.grade}</span> ${escapeHtml(g.subject)} — ${escapeHtml(s ? s.fio : g.student)}</h3>
        ${g.comment ? `<p>💬 ${escapeHtml(g.comment)}</p>` : ''}
        <p>${g.date}</p>
      </div>`;
    }).join('') : '<p class="muted">Записей пока нет — выставь первую оценку выше.</p>';
  }

  /* ==================== УЧИТЕЛЬ: ОТЧЁТЫ ==================== */
  window.buildReport = () => {
    const email = repStudent.value;
    if (!email) return alert('Выбери ученика');
    const s = users_().find(u => u.email === email);
    const list = gradesOf(email);
    if (!list.length) { reportBox.innerHTML = '<p class="muted">У этого ученика пока нет оценок.</p>'; return; }
    const avg = (list.reduce((sum, g) => sum + g.grade, 0) / list.length).toFixed(2);
    const dist = [5, 4, 3, 2].map(n => `${n}: ${list.filter(g => g.grade === n).length}`).join(' · ');
    const bySubject = {};
    list.forEach(g => (bySubject[g.subject] = bySubject[g.subject] || []).push(g.grade));
    const best = Object.entries(bySubject).sort((a, b) =>
      (b[1].reduce((x, y) => x + y) / b[1].length) - (a[1].reduce((x, y) => x + y) / a[1].length))[0];

    reportBox.innerHTML = `
      <div class="card">
        <h3>📈 Отчёт: ${escapeHtml(s ? s.fio : email)}</h3>
        <p>Средний балл: <b>${avg}</b></p>
        <p>Распределение оценок: ${dist}</p>
        <p>Сильнейший предмет: <b>${escapeHtml(best[0])}</b></p>
        <p>Оценок всего: ${list.length}</p>
      </div>`;
  };

  function users_() { return getUsers(); }

  /* ==================== УЧИТЕЛЬ: ШАБЛОНЫ ==================== */
  templateForm.addEventListener('submit', e => {
    e.preventDefault();
    const tp = getTemplates();
    tp.push({ id: Date.now(), subject: tpSubject.value.trim(), text: tpText.value.trim(), due: tpDue.value });
    DB.set('edu_templates', tp);
    templateForm.reset();
    renderTemplateList();
  });

  function renderTemplateList() {
    const tp = getTemplates().reverse();
    pickTemplate.innerHTML = '<option value="">— выбери шаблон —</option>' +
      tp.map(t => `<option value="${t.id}">${escapeHtml(t.subject)} — ${escapeHtml(t.text.slice(0, 40))}…</option>`).join('');
    templateList.innerHTML = tp.length ? tp.map(t => `
      <div class="card">
        <h3>🗂 ${escapeHtml(t.subject)} <span class="status approved">сдать до ${t.due}</span></h3>
        <p>${escapeHtml(t.text)}</p>
      </div>`).join('') : '<p class="muted">Шаблонов пока нет — создай первый выше.</p>';
  }

  window.assignHomework = () => {
    const tid = +pickTemplate.value;
    if (!tid) return alert('Выбери шаблон');
    if (!pickStudent.value) return alert('Выбери ученика');
    const t = getTemplates().find(x => x.id === tid);
    const hw = getHomework();
    hw.push({ id: Date.now(), student: pickStudent.value, teacher: me.email, subject: t.subject, text: t.text, due: t.due, done: false });
    DB.set('edu_homework', hw);
    alert('Домашка выдана! Ученик увидит её в своём разделе.');
  };

  /* ==================== УЧИТЕЛЬ: ЗАЯВКА МОДЕРАТОРУ ==================== */
  applyForm.addEventListener('submit', e => {
    e.preventDefault();
    const apps = getApps();
    apps.push({
      id: Date.now(),
      teacher: me.email,
      teacherFio: me.fio,
      title: apTitle.value.trim(),
      text: apText.value.trim(),
      status: 'processing',
      reason: '',
      date: new Date().toLocaleDateString()
    });
    DB.set('edu_apps', apps);
    applyForm.reset();
    applyMsg.textContent = '✅ Заявка отправлена модератору.';
    applyMsg.classList.remove('hidden');
    setTimeout(() => applyMsg.classList.add('hidden'), 4000);
  });

  /* ==================== МОДЕРАТОР: ЗАЯВКИ ==================== */
  function renderInbox() {
    const list = getApps().filter(a => a.status === 'processing').reverse();
    inboxList.innerHTML = list.length ? list.map(a => `
      <div class="card">
        <h3>📤 ${escapeHtml(a.title)} <span class="status processing">На рассмотрении</span></h3>
        <p>${escapeHtml(a.text)}</p>
        <p>От учителя: ${escapeHtml(a.teacherFio)} · ${a.date}</p>
        <div class="req-actions">
          <input type="text" id="reason-${a.id}" placeholder="Причина решения *">
          <button class="btn btn-sm ok" onclick="decide(${a.id}, true)">Одобрить</button>
          <button class="btn btn-sm no" onclick="decide(${a.id}, false)">Отклонить</button>
        </div>
      </div>`).join('') : '<p class="muted">Новых заявок нет ✨</p>';
  }

  window.decide = (id, ok) => {
    const apps = getApps();
    const a = apps.find(x => x.id === id);
    if (!a) return;
    const reason = document.getElementById('reason-' + id).value.trim();
    if (!reason) return alert('Причина решения обязательна — без неё заявку обработать нельзя');
    a.status = ok ? 'approved' : 'declined';
    a.reason = reason;
    DB.set('edu_apps', apps);
    renderInbox();
    renderDecided();
  };

  function renderDecided() {
    const list = getApps().filter(a => a.status !== 'processing').reverse();
    decidedList.innerHTML = list.length ? list.map(a => `
      <div class="card">
        <h3>${escapeHtml(a.title)} <span class="status ${a.status}">${a.status === 'approved' ? 'Одобрено' : 'Отклонено'}</span></h3>
        <p>${escapeHtml(a.text)}</p>
        <p>От учителя: ${escapeHtml(a.teacherFio)} · ${a.date}</p>
        <div class="reason-box"><b>Причина решения:</b> ${escapeHtml(a.reason)}</div>
      </div>`).join('') : '<p class="muted">Обработанных заявок пока нет.</p>';
  }
}

/* ==================== ВСПОМОГАТЕЛЬНОЕ ==================== */
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }
