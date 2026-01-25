import crypto from 'crypto';
import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: [true, 'Tell us your name'] },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, 'Provide your email'],
      validate: [validator.isEmail, 'Provide a valid email address'],
    },
    photo: { type: String, default: 'default-user.jpg' },
    role: { type: String, enum: ['user', 'librarian', 'admin'], default: 'user' },
    password: { type: String, minlength: 8, required: [true, 'Provide a password'], select: false },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirm your password'],
      validate: {
        // Only works on SAVE() & CREATE(), won't work for findByIdAndUpdate(), etc
        validator: function (value) {
          return value === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    passwordChangedAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    active: { type: Boolean, default: true, select: false },
  },
  { strictQuery: true },
);

// Pre save hook (for signup password hashing)
userSchema.pre('save', async function () {
  // Only run if password was modified
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, Number(process.env.HASH_SALT));
  this.passwordConfirm = undefined;
});

// Pre hook to save passwordChangedAt date
userSchema.pre('save', async function () {
  if (!this.isModified('password') || this.isNew) return;
  this.passwordChangedAt = Date.now() - 1000;
});

// Pre hook to hide inactive users
userSchema.pre(/^find/, function () {
  this.find({ active: { $ne: false } });
});

// Instance method (for login password comparison)
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after the token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestampMs = this.passwordChangedAt.getTime();
    const changedTimestamp = parseInt(changedTimestampMs / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  // FALSE is for NOT changed
  return false;
};

// Instance method to generate password reset token
userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
