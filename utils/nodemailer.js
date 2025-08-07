import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // or 'STARTTLS'
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-password',
  },
});

const sendVerificationEmail = async (user) => {
  const verificationLink = `http://localhost:3000/verify-email?token=${user.verificationToken}`;
  const mailOptions = {
    from: 'your-email@gmail.com',
    to: user.email,
    subject: 'Verify your email address',
    text: `Please click on this link to verify your email address: ${verificationLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(error);
  }
};