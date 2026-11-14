// Инициализация Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Константы
const MOD_CODE = '555'; // Секретный код модератора

// Локальное хранение данных
let sid = localStorage.getItem('ep_sid') || Date.now().toString();
let isMod = sessionStorage.getItem('ep_mod') === 'yes';
let myProfile = JSON.parse(localStorage.getItem('ep_profile') || 'null');

// Элементы страницы
const modGate = document.getElementById('modGate');
const appEl = document.getElementById('app');

// Функция для переключения между режимами пользователя и модератора
function applyMode() {
  if (isMod) {
    document.getElementById('userMenu').classList.add('hidden');
    document.getElementById('modMenu').classList.remove('hidden');
    document.getElementById('modBtn').classList.add('hidden');
    document.getElementById('exitBtn').classList.remove('hidden');
    document.getElementById('userBadge').textContent = 'Модератор';
  } else {
    document.getElementById('modMenu').classList.add('hidden');
    document.getElementById('userMenu').classList.remove('hidden');
    document.getElementById('exitBtn').classList.remove('hidden');
    document.getElementById('userBadge').textContent = myProfile ? myProfile.fio : 'Участник';
  }
}
applyMode();

// Обработчик событий навигации
document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    document.getElementById('view-' + btn.dataset.view).classList.remove('hidden');
  });
});
