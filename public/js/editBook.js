import { showAlert } from './alerts.js';

const formEl = document.querySelector('.form-edit-book');
const languageEl = document.getElementById('language');
const formatEl = document.getElementById('format');
const languageData = languageEl.dataset.language;
const formatData = formatEl.dataset.format;

languageEl.value = languageData;
formatEl.value = formatData;

const updateBook = async (id, data) => {
  try {
    const res = await axios.patch('/api/v1/books/' + id, data);
    if (res.data.status === 'success') {
      showAlert('success', 'Book was updated successfully.');
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

formEl.addEventListener('submit', e => {
  e.preventDefault();
  const id = formEl.dataset.id;
  const cover = document.getElementById('cover').dataset.cover;
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
  form.append('originalCover', cover);
  updateBook(id, form);
});
