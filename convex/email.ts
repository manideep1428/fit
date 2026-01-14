"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from "resend";
import { api } from "./_generated/api";

// Send invitation email to client
export const sendClientInviteEmail = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
  },
  handler: async (_, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return { success: false, error: "Email not configured" };
    }

    const resend = new Resend(resendApiKey);
    const appDownloadLink = "https://your-app-link.com";

    try {
      const { data, error } = await resend.emails.send({
        from: "FitTrainer <onboarding@resend.dev>",
        to: [args.clientEmail],
        subject: `${args.trainerName} has invited you to FitTrainer!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">💪</span>
                  </div>
                  <h1 style="color: #1f2937; font-size: 24px; margin: 0;">You're Invited!</h1>
                </div>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Hi <strong>${args.clientName}</strong>,
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  <strong>${args.trainerName}</strong> has invited you to join them on <strong>FitTrainer</strong> - your personal fitness companion app.
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                  With FitTrainer, you can:
                </p>
                <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 32px; padding-left: 20px;">
                  <li>📅 Book training sessions easily</li>
                  <li>📊 Track your fitness progress</li>
                  <li>🎯 Set and achieve your goals</li>
                  <li>💬 Stay connected with your trainer</li>
                </ul>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${appDownloadLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Download the App
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                  Once you download the app, sign in with this email address (<strong>${args.clientEmail}</strong>) to connect with your trainer.
                </p>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    This email was sent because ${args.trainerName} added you as a client on FitTrainer.
                    <br>If you didn't expect this email, you can safely ignore it.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
      }

      console.log("Email sent successfully:", data);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  },
});

// Resend invitation email to pending client
export const resendClientInviteEmail = action({
  args: {
    clientEmail: v.string(),
    clientName: v.string(),
    trainerName: v.string(),
  },
  handler: async (_, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return { success: false, error: "Email not configured" };
    }

    const resend = new Resend(resendApiKey);
    const appDownloadLink = "https://your-app-link.com";

    try {
      const { data, error } = await resend.emails.send({
        from: "FitTrainer <onboarding@resend.dev>",
        to: [args.clientEmail],
        subject: `Reminder: ${args.trainerName} is waiting for you on FitTrainer!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 32px;">💪</span>
                  </div>
                  <h1 style="color: #1f2937; font-size: 24px; margin: 0;">Friendly Reminder!</h1>
                </div>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  Hi <strong>${args.clientName}</strong>,
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                  <strong>${args.trainerName}</strong> is waiting for you to join them on <strong>FitTrainer</strong>! Don't miss out on your personalized fitness journey.
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                  With FitTrainer, you can:
                </p>
                <ul style="color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 32px; padding-left: 20px;">
                  <li>📅 Book training sessions easily</li>
                  <li>📊 Track your fitness progress</li>
                  <li>🎯 Set and achieve your goals</li>
                  <li>💬 Stay connected with your trainer</li>
                </ul>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${appDownloadLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Download the App Now
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
                  Sign in with this email address (<strong>${args.clientEmail}</strong>) to connect with your trainer.
                </p>
                <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                    This is a reminder email from ${args.trainerName} via FitTrainer.
                    <br>If you didn't expect this email, you can safely ignore it.
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
      }

      console.log("Resend email sent successfully:", data);
      return { success: true, messageId: data?.id };
    } catch (error: any) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  },
});

// Helper function to send invite email
async function sendInviteEmailInternal(
  clientEmail: string,
  clientName: string,
  trainerName: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log("Attempting to send email to:", clientEmail);
  console.log("API Key exists:", !!resendApiKey);

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is not set in environment");
    return { success: false, error: "Email not configured" };
  }

  const resend = new Resend(resendApiKey);
  const appDownloadLink = "https://your-app-link.com";

  try {
    console.log("Sending email via Resend...");
    const { data, error } = await resend.emails.send({
      from: "FitTrainer <onboarding@resend.dev>",
      to: [clientEmail],
      subject: `${trainerName} has invited you to FitTrainer!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #1f2937; font-size: 24px; margin: 0;">You're Invited! 💪</h1>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Hi <strong>${clientName}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                <strong>${trainerName}</strong> has invited you to join them on <strong>FitTrainer</strong>.
              </p>
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${appDownloadLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Download the App
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Sign in with <strong>${clientEmail}</strong> to connect with your trainer.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend API error:", JSON.stringify(error));
      return { success: false, error: error.message };
    }
    
    console.log("Email sent successfully! ID:", data?.id);
    return { success: true };
  } catch (error: any) {
    console.error("Exception sending email:", error.message, error.stack);
    return { success: false, error: error.message };
  }
}

// Action to invite client and send email
export const inviteClientWithEmail = action({
  args: {
    trainerId: v.string(),
    trainerName: v.string(),
    email: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args): Promise<{ status: string; userId: any; clientId: string }> => {
    const result: { status: string; userId: any; clientId: string } = await ctx.runMutation(api.users.inviteClientByEmail, {
      trainerId: args.trainerId,
      email: args.email,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
    });

    if (result.status === "invited") {
      try {
        await sendInviteEmailInternal(args.email, args.fullName, args.trainerName);
      } catch (emailError) {
        console.error("Failed to send invite email:", emailError);
      }
    }

    return result;
  },
});
