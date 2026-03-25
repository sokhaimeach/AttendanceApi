const dns = require("node:dns");
const nodemailer = require("nodemailer");

dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

const sendEmail = async (to, subject, html) => {
  await transporter.verify();

  const mailOptions = {
    from: `"Attendance Website" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info.response;
};

module.exports = sendEmail;