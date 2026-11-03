import { createContextClient, verifyAuth } from "@supabase/server/core";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { Database } from "./types";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    const url = process.env["SUPABASE_URL"];
    const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !publishableKey) {
      throw new Error(
        "Supabase server configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
      );
    }

    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: Only Bearer tokens are supported");
    }

    const { data: auth, error } = await verifyAuth(request, { auth: "user" });
    if (error || !auth.token || !auth.userClaims?.id) {
      throw new Error("Unauthorized: Invalid token");
    }

    const supabase = createContextClient<Database>({
      auth: { token: auth.token },
      env: {
        url,
        publishableKeys: { default: publishableKey },
        secretKeys: process.env["SUPABASE_SECRET_KEY"]
          ? { default: process.env["SUPABASE_SECRET_KEY"] }
          : {},
        ...(process.env["SUPABASE_JWKS_URL"] && {
          jwks: new URL(process.env["SUPABASE_JWKS_URL"]),
        }),
      },
    });

    return next({
      context: {
        supabase,
        userId: auth.userClaims.id,
        claims: auth.jwtClaims,
      },
    });
  },
);
