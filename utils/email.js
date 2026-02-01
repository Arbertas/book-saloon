import nodemailer from 'nodemailer';
import pug from 'pug';
import { convert } from 'html-to-text';

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.username.split(' ').at(0);
    this.url = url;
    this.from = `Eraam X <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // use hosting email service
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USERNAME, pass: process.env.EMAIL_PASSWORD },
    });
  }

  async send(template, subject) {
    // 1. Render HTML based on pug
    const html = pug.renderFile(`${import.meta.dirname}/../views/emails/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });
    // 2. Define options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    // 3. Create transport and send
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Book Saloon.');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Password reset token (valid for 10 minutes)');
  }
}

export default Email;
