import mongoose from 'mongoose';
import slugify from 'slugify';
import validator from 'validator';

const bookSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String, required: [true, "Book must have author's last name"] },
    title: { type: String, required: [true, 'Book must have a title'] },
    year: { type: Number, required: [true, 'Book must have original publication year'] },
    publisher: { type: String, required: [true, 'Book must have a publisher'] },
    published: { type: Number, required: [true, 'Book must have publication year'] },
    pages: { type: Number, required: [true, 'Book must have a page count'] },
    language: { type: String, enum: ['Lithuanian', 'English', 'Other'], required: [true, 'Book must have a language'] },
    format: { type: String, enum: ['Hardcover', 'Paperback'], required: [true, 'Book must have a format'] },
    isbn: { type: String, trim: true, validate: [validator.isISBN, 'Invalid ISBN code'] },
    cover: { type: String, default: 'default-cover.jpg' },
    ratingsAverage: { type: Number, set: value => value.toFixed(2) },
    ratingsQuantity: { type: Number },
    slug: { type: String, unique: true },
    hidden: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now() },
    librarian: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  { strictQuery: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false },
);

// Indexes (for faster query returns, less document scanning)
bookSchema.index({ lastName: 1, year: 1 });

// Virtual properties:
bookSchema.virtual('author').get(function () {
  if (!this.firstName) return this.lastName;
  return this.firstName + ' ' + this.lastName;
});

// Virtual populate: book reviews
bookSchema.virtual('reviews', { ref: 'Review', foreignField: 'book', localField: '_id' });

// DOCUMENT middleware:
bookSchema.pre('save', function () {
  this.slug = slugify(`${this.title} ${Date.now()}`, { lower: true });
});

// QUERY middleware:
bookSchema.pre(/^find/, function () {
  this.find({ hidden: { $ne: true } });
});
bookSchema.pre(/^find/, function () {
  this.populate({ path: 'librarian', select: 'username photo' });
});

// AGGREGATION middleware:
bookSchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { hidden: { $ne: true } } });
});

const Book = mongoose.model('Book', bookSchema);

export default Book;
