import { showAlert } from './alerts.js';

const formEl = document.querySelector('.form-sign-up');

const signup = async data => {
  try {
    const res = await axios.post('http://127.0.0.1:3000/api/v1/users/signup', data);
    if (res.data.status === 'success') {
      showAlert('success', 'Signed in successfully.');
      window.setTimeout(() => location.assign('/'), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

formEl.addEventListener('submit', e => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const passwordConfirm = document.getElementById('passwordConfirm').value;
  const data = { username, email, password, passwordConfirm };
  signup(data);
});
