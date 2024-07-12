import nodemailer from "nodemailer";

export async function getMailClient() {
  // Create a fictitious email server
  // It only shows that it works and show the email
  const account = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  return transporter;
}
