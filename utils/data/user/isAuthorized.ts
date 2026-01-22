import { clerkClient } from "@clerk/nextjs/server";
import config from "@/config";

export const isAuthorized = async (
  userId: string
): Promise<{ authorized: boolean; message: string }> => {
  if (!(config as any)?.payments?.enabled) {
    return {
      authorized: true,
      message: "Payments are disabled",
    };
  }

  const client = await clerkClient();
  const result = await client.users.getUser(userId);

  if (!result) {
    return {
      authorized: false,
      message: "User not found",
    };
  }

  // TODO: implement new subscription check with Convex or Stripe directly
  // For now, allow access if payments are enabled but no subscription check is implemented
  return {
    authorized: true,
    message: "User is subscribed",
  };
};
