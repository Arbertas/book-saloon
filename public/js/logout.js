import { showAlert } from './alerts.js';

const logoutBtn = document.querySelector('.btn-logout');

const logout = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/v1/users/logout');
    res.data.status === 'success' && location.assign('/');
  } catch (err) {
    showAlert('error', 'Error logging out, try again.');
  }
};

logoutBtn?.addEventListener('click', e => {
  e.preventDefault();
  logout();
});
