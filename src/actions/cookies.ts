import { defineAction } from "astro:actions";
import { z } from "zod";

export const cookies = {
	toggle: defineAction({
		input: z.boolean().default(true),
		async handler(allow, context) {
			if (allow) {
				context.cookies.set("X_ALLOW_COOKIES", "true", {
					httpOnly: true,
					secure: true,
					sameSite: "none",
					path: "/",
					domain: context.url.hostname,
				});
			} else {
				context.cookies.set("X_ALLOW_COOKIES", "false", {
					httpOnly: true,
					secure: true,
					sameSite: "none",
					path: "/",
					domain: context.url.hostname,
				});
			}
		},
	}),
};
