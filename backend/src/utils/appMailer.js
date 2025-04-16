const nodemailer = require("nodemailer");

class AppMailer {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: parseInt(process.env.MAIL_PORT) == 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendMail(options) {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendVerificationEmail(email, verificationUrl) {
    const subject = "Verify your email";
    const html = `
      <h2>Verify your email</h2>
      <p>Please click <a href="${verificationUrl}">here</a> to verify your email.</p>
    `;

    return this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  async sendServiceReminder(user, vehicle, serviceDetails) {
    const subject = `Service Reminder: ${vehicle.make} ${vehicle.model}`;
    const html = `
            <h2>Service Reminder</h2>
            <p>Hello ${user.name},</p>
            <p>This is a reminder that your vehicle is due for service:</p>
            <ul>
                <li>Vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.year})</li>
                <li>Service Type: ${serviceDetails.type}</li>
                <li>Due Date: ${serviceDetails.dueDate}</li>
            </ul>
            <p>Please schedule your service appointment at your earliest convenience.</p>
        `;

    return this.sendMail({
      to: user.email,
      subject,
      html,
    });
  }
}

module.exports = new AppMailer();
