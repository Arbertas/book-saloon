import express from 'express';
import {
  getBooks,
  getBook,
  addBook,
  editBook,
  getLogin,
  getSignUp,
  getAccount,
  updateUser,
} from '../controllers/viewController.js';
import { protect, isLoggedIn } from '../controllers/authController.js';

const router = express.Router();

router.get('/', isLoggedIn, getBooks);
router.get('/book/:slug', isLoggedIn, getBook);
router.get('/add-book', protect, addBook);
router.get('/edit-book/:slug', protect, editBook);
router.get('/login', isLoggedIn, getLogin);
router.get('/sign-up', isLoggedIn, getSignUp);
router.get('/account', protect, getAccount);
router.post('/update-user-details', protect, updateUser);

export default router;
