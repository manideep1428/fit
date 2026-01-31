import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { type, to, data } = await request.json();

    if (!type || !to || !data) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check for SMTP configuration
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      console.error("SMTP configuration missing");
      return Response.json(
        { error: "Server configuration error: SMTP settings missing" },
        { status: 500 },
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let subject = "";
    let html = "";

    const commonStyles = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
      .header { text-align: center; margin-bottom: 32px; }
      .title { color: #1f2937; font-size: 24px; margin: 0; }
      .text { color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
      .footer { border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px; }
      .footer-text { color: #9ca3af; font-size: 12px; text-align: center; margin: 0; }
    `;

    switch (type) {
      case "invite":
        subject = `${data.trainerName} invited you to FitTrainer`;
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>${commonStyles}</style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">You're Invited! 💪</h1>
                </div>
                <p class="text">Hi <strong>${data.clientName}</strong>,</p>
                <p class="text"><strong>${data.trainerName}</strong> has invited you to join them on <strong>FitTrainer</strong>.</p>
                <p class="text">Download the app to get started with your fitness journey!</p>
                <div class="footer">
                  <p class="footer-text">Sent via FitTrainer</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "booking":
        subject = "Booking Confirmed ✅";
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>${commonStyles}</style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">Booking Confirmed!</h1>
                </div>
                <p class="text">Hi <strong>${data.clientName}</strong>,</p>
                <p class="text">Your session with <strong>${data.trainerName}</strong> has been confirmed.</p>
                <p class="text">
                  📅 <strong>Date:</strong> ${data.date}<br>
                  ⏰ <strong>Time:</strong> ${data.time}
                </p>
                <div class="footer">
                  <p class="footer-text">Sent via FitTrainer</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "cancelled":
        subject = "Booking Cancelled ❌";
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>${commonStyles}</style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <h1 class="title">Booking Cancelled</h1>
                </div>
                <p class="text">Hi <strong>${data.clientName}</strong>,</p>
                <p class="text">Your session with <strong>${data.trainerName}</strong> on <strong>${data.date}</strong> at <strong>${data.time}</strong> has been cancelled.</p>
                <div class="footer">
                  <p class="footer-text">Sent via FitTrainer</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return Response.json({ error: "Invalid email type" }, { status: 400 });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"FitTrainer" <noreply@fittrainer.com>',
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return Response.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return Response.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 },
    );
  }
}
