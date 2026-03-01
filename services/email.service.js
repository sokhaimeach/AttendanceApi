const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `Attendance Website`,
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return info.response;
};

module.exports = sendEmail;
