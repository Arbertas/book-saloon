import { showAlert } from './alerts.js';

const formEl = document.querySelector('.form-details');
const formPswEl = document.querySelector('.form-password');
const userImgEl = document.querySelector('.details-photo');
const userImgInputEl = document.querySelector('#avatar');

const updateDetails = async data => {
  try {
    const res = await axios.patch('http://127.0.0.1:3000/api/v1/users/updateMe', data);
    if (res.data.status === 'success') {
      showAlert('success', 'Details updated successfully.');
      window.setTimeout(() => location.reload(), 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const updatePassword = async (passwordCurrent, password, passwordConfirm) => {
  try {
    const data = { passwordCurrent, password, passwordConfirm };
    const res = await axios.patch('http://127.0.0.1:3000/api/v1/users/updateMyPassword', data);
    if (res.data.status === 'success') showAlert('success', 'Password updated successfully.');
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const handleDisplayUserPhoto = e => {
  const imgFile = e.target.files?.[0];
  if (!imgFile?.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => userImgEl.setAttribute('src', reader.result));
  reader.readAsDataURL(imgFile);
};

formEl.addEventListener('submit', e => {
  e.preventDefault();
  // before avatar uploading
  // const username = document.getElementById('username').value;
  // const email = document.getElementById('email').value;
  // updateDetails(username, email);
  const form = new FormData();
  form.append('username', document.getElementById('username').value);
  form.append('email', document.getElementById('email').value);
  form.append('photo', document.getElementById('avatar').files[0]);
  updateDetails(form);
});

formPswEl.addEventListener('submit', async e => {
  e.preventDefault();
  document.querySelector('.btn-save-password').textContent = 'Updating...';
  const passwordCurrent = document.getElementById('password-current').value;
  const password = document.getElementById('password-new').value;
  const passwordConfirm = document.getElementById('password-repeat').value;
  await updatePassword(passwordCurrent, password, passwordConfirm);
  document.querySelector('.btn-save-password').textContent = 'Save';
  document.getElementById('password-current').value = '';
  document.getElementById('password-new').value = '';
  document.getElementById('password-repeat').value = '';
});

userImgInputEl.addEventListener('change', handleDisplayUserPhoto);
