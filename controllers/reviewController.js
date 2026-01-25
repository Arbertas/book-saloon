import Review from '../models/reviewModel.js';
import { getAll, getOne, addNewOne, updateOne, deleteOne } from './handlerFactory.js';

const setNewReviewIds = (req, res, next) => {
  // For getting data from nested route automatically
  if (!req.body.book) req.body.book = req.params.bookId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const getAllReviews = getAll(Review);
const getOneReview = getOne(Review);
const addNewReview = addNewOne(Review);
const updateReview = updateOne(Review);
const deleteReview = deleteOne(Review);

export { getAllReviews, getOneReview, setNewReviewIds, addNewReview, updateReview, deleteReview };
