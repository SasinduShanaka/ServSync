import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from 'dotenv';
dotenv.config();

// Configure nodemailer with Gmail SMTP (for demo/testing)
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS ? '***set***' : '***missing***');
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// 1. Request password reset (user enters NIC)
export const requestPasswordReset = async (req, res) => {
  const { nicOrPassport } = req.body;
  try {
    const user = await User.findOne({ nicOrPassport });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate code/token
    const code = crypto.randomInt(100000, 999999).toString();
    user.resetCode = code;
    user.resetCodeExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await user.save();

    // Send the OTP code to the user's email
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: user.email,
        subject: "Your OTP Code for Password Reset",
        text: `Your OTP code is: ${code}`
      });
      res.json({ message: "Reset code sent to your email." });
    } catch (mailErr) {
      console.error("Error sending OTP code email:", mailErr);
      res.status(500).json({ message: "Failed to send OTP code email.", error: mailErr && mailErr.message ? mailErr.message : mailErr });
    }
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: err.message || "Error generating code" });
  }
};

// 2. Verify code and reset password
export const resetPassword = async (req, res) => {
  const { nicOrPassport, code, newPassword } = req.body;
  const user = await User.findOne({ nicOrPassport });
  if (!user || user.resetCode !== code || Date.now() > user.resetCodeExpires) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  user.password = newPassword;
  user.resetCode = undefined;
  user.resetCodeExpires = undefined;
  await user.save();
  res.json({ message: "Password reset successful" });
};
