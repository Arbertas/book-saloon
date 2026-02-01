import { showAlert } from './alerts.js';

const deleteBtn = document.querySelector('.btn-delete');

const deleteBook = async () => {
  if (!deleteBtn.classList.contains('btn-danger')) {
    deleteBtn.classList.add('btn-danger');
    deleteBtn.textContent = 'Are you sure?';
    return;
  }
  try {
    const id = deleteBtn.dataset.id;
    const res = await axios.delete('/api/v1/books/' + id);
    if (res.status === 204) showAlert('success', 'Book was removed successfully.');
    window.setTimeout(() => location.assign('/'), 1500);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

deleteBtn.addEventListener('click', deleteBook);
