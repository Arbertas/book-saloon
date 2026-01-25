import express from 'express';
import {
  getAllReviews,
  getOneReview,
  setNewReviewIds,
  addNewReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../controllers/authController.js';

// Merge Params to get bookId from bookRoutes
const router = express.Router({ mergeParams: true });

router.route('/').get(getAllReviews).post(protect, restrictTo('user'), setNewReviewIds, addNewReview);
router
  .route('/:id')
  .get(getOneReview)
  .patch(protect, restrictTo('user', 'admin'), updateReview)
  .delete(protect, restrictTo('user', 'admin'), deleteReview);

export default router;
