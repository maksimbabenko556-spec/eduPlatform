document.getElementById('uploadForm').addEventListener('submit', function (e) {
  e.preventDefault();
  alert('Заявка отправлена на модерацию! Скоро появится на главной.');
  this.reset();
});

document.getElementById('uploadBtn').addEventListener('click', () => {
  window.scrollTo({ top: document.getElementById('cabinet').offsetTop, behavior: 'smooth' });
});
