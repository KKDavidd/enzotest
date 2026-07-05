document.getElementById('policy-reopen-consent').addEventListener('click', () => {
  localStorage.removeItem('enzo-cookie-consent');
  location.reload();
});
