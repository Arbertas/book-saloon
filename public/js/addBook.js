import { showAlert } from './alerts.js';

const formEl = document.querySelector('.form-add-book');
const firstField = document.getElementById('firstName');

firstField.focus();

const addNewBook = async data => {
  try {
    const res = await axios.post('/api/v1/books', data);
    if (res.data.status === 'success') {
      showAlert('success', 'New book was added successfully.');
      formEl.reset();
      firstField.focus();
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

formEl.addEventListener('submit', e => {
  e.preventDefault();
  const form = new FormData();
  form.append('firstName', document.getElementById('firstName').value);
  form.append('lastName', document.getElementById('lastName').value);
  form.append('title', document.getElementById('title').value);
  form.append('year', document.getElementById('year').value);
  form.append('publisher', document.getElementById('publisher').value);
  form.append('published', document.getElementById('published').value);
  form.append('pages', document.getElementById('pages').value);
  form.append('language', document.getElementById('language').value);
  form.append('format', document.getElementById('format').value);
  if (document.getElementById('isbn').value) {
    form.append('isbn', document.getElementById('isbn').value);
  }
  form.append('cover', document.getElementById('cover').files[0]);
  addNewBook(form);
});
