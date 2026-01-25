import mongoose from 'mongoose';
import Book from './bookModel.js';

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, "Review can't be empty"] },
    rating: {
      type: Number,
      min: [1, 'Rating must be greater or equal to 1'],
      max: [5, 'Rating must be less or equal to 5'],
    },
    createdAt: { type: Date, default: Date.now() },
    // Referencing book and user (as parents)
    book: { type: mongoose.Schema.ObjectId, ref: 'Book', required: [true, 'Review must belong to a book'] },
    user: { type: mongoose.Schema.ObjectId, ref: 'User', required: [true, 'Review must belong to a user'] },
  },
  { strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false },
);

// To prevent a user writing multiple reviews for the same book
reviewSchema.index({ book: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function () {
  this.populate({ path: 'user', select: 'username photo' });
});

// Adding static method to calculate avg rating for a book
reviewSchema.statics.calcAvgRatings = async function (bookId) {
  const stats = await this.aggregate([
    { $match: { book: bookId } },
    { $group: { _id: '$book', nRatings: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  ]);
  if (stats.length > 0) {
    const { avgRating, nRatings } = stats.at(0);
    await Book.findByIdAndUpdate(bookId, { ratingsAverage: avgRating, ratingsQuantity: nRatings });
  } else {
    await Book.findByIdAndUpdate(bookId, { ratingsAverage: 0, ratingsQuantity: 0 });
  }
};

// Call static method when posting new review
reviewSchema.post('save', function () {
  this.constructor.calcAvgRatings(this.book);
});

// Call static method when editing or deleting review
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) await doc.constructor.calcAvgRatings(doc.book);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
