import { v } from "convex/values";
import { action } from "./_generated/server";

/**
 * Send email invitation via Clerk
 * This action calls Clerk's Backend API to create and send an invitation email
 */
export const sendClerkInvitation = action({
  args: {
    email: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
    trainerId: v.string(),
    trainerName: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }

    try {
      // Call Clerk's Backend API to create an invitation
      const response = await fetch("https://api.clerk.com/v1/invitations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: args.email,
          public_metadata: {
            fullName: args.fullName,
            phoneNumber: args.phoneNumber,
            invitedByTrainerId: args.trainerId,
            invitedByTrainerName: args.trainerName,
            role: "client",
          },
          // Optional: redirect to your app's sign-up page
          // redirect_url: "https://yourapp.com/sign-up",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Clerk API error:", error);
        throw new Error(`Failed to send invitation: ${error.errors?.[0]?.message || "Unknown error"}`);
      }

      const invitation = await response.json();
      
      return {
        success: true,
        invitationId: invitation.id,
        email: invitation.email_address,
        createdAt: invitation.created_at,
        expiresAt: invitation.expires_at,
      };
    } catch (error: any) {
      console.error("Error sending Clerk invitation:", error);
      throw new Error(`Failed to send invitation: ${error.message}`);
    }
  },
});

/**
 * Revoke a Clerk invitation
 */
export const revokeClerkInvitation = action({
  args: {
    invitationId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }

    try {
      const response = await fetch(
        `https://api.clerk.com/v1/invitations/${args.invitationId}/revoke`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to revoke invitation: ${error.errors?.[0]?.message || "Unknown error"}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error revoking Clerk invitation:", error);
      throw new Error(`Failed to revoke invitation: ${error.message}`);
    }
  },
});
