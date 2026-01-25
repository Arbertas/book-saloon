import { showAlert } from './alerts.js';

const formEl = document.querySelector('.form-login');

const login = async (email, password) => {
  try {
    const res = await axios.post('http://127.0.0.1:3000/api/v1/users/login', { email, password });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully.');
      window.setTimeout(() => location.assign('/'), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

formEl.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  login(email, password);
});
