import nodemailer from "nodemailer";
// import {
//   WELCOME_EMAIL_TEMPLATE,
//   NEWS_SUMMARY_EMAIL_TEMPLATE,
// } from "@/lib/nodemailer/templates";
import { WELCOME_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

const { NODEMAILER_EMAIL, NODEMAILER_PASSWORD } = process.env;
if (!NODEMAILER_EMAIL || !NODEMAILER_PASSWORD) {
  throw new Error("NODEMAILER_EMAIL and NODEMAILER_PASSWORD must be set");
}
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: NODEMAILER_EMAIL, pass: NODEMAILER_PASSWORD },
  // Remove insecure TLS override; Gmail provides valid certs.
  // tls: {
  //   rejectUnauthorized: false,
  // },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c]!)
    );

  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace(
    "{{name}}",
    escape(name)
  ).replace("{{intro}}", escape(intro));

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

// export const sendNewsSummaryEmail = async ({
//   email,
//   date,
//   newsContent,
// }: {
//   email: string;
//   date: string;
//   newsContent: string;
// }): Promise<void> => {
//   const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
//     "{{date}}",
//     date
//   ).replace("{{newsContent}}", newsContent);

//   const mailOptions = {
//     from: `"Signalist News" <honeyzrich1705@gmail.com>`,
//     to: email,
//     subject: `📈 Market News Summary Today - ${date}`,
//     text: `Today's market news summary from Signalist`,
//     html: htmlTemplate,
//   };

//   await transporter.sendMail(mailOptions);
// };
