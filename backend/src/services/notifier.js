// src/services/notifier.js
const nodemailer = require('nodemailer');
// const twilio = require('twilio')(...);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

exports.notifyEmail = async (to, subject, text) => {
  if (!to) return;
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text });
};
