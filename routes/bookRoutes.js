import express from 'express';
import {
  getAllBooks,
  getOneBook,
  addNewBook,
  updateBook,
  deleteBook,
  aliasTop10,
  getBookStats,
  getBooksByMonth,
  uploadBookImgs,
  resizeBookImgs,
} from '../controllers/bookController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import reviewRouter from '../routes/reviewRoutes.js';

const router = express.Router();

// Nested route for posting review on book
router.use('/:bookId/reviews', reviewRouter);

// Param Middleware
router.param('id', (req, res, next, value) => {
  console.log(`Book ID is: ${value}`);
  next();
});

// Aliasing
router.route('/top-10-books').get(aliasTop10, getAllBooks);
router.route('/book-stats').get(getBookStats);
router.route('/books-by-month/:year').get(getBooksByMonth);

// Main Routes
router
  .route('/')
  .get(getAllBooks)
  .post(protect, restrictTo('admin', 'librarian'), uploadBookImgs, resizeBookImgs, addNewBook);
router
  .route('/:id')
  .get(getOneBook)
  .patch(protect, restrictTo('admin', 'librarian'), uploadBookImgs, resizeBookImgs, updateBook)
  .delete(protect, restrictTo('admin', 'librarian'), deleteBook);

export default router;
