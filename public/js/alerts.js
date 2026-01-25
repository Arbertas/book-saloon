const hideAlert = () => {
  const alertEl = document.querySelector('.alert');
  alertEl && alertEl.parentElement.removeChild(alertEl);
};

const showAlert = (type, msg) => {
  hideAlert();
  const html = `<div class="alert alert-${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', html);
  window.setTimeout(hideAlert, 3000);
};

export { showAlert };
