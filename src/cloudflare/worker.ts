import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { handle } from "@astrojs/cloudflare/handler";
// export * from '@/features/websocket/ChatRoom';

export function createExports(manifest: SSRManifest) {
	const app = new App(manifest);
	return {
		default: {
			async fetch(request, env, ctx) {
				return handle(manifest, app, request as any, env as Cloudflare.Env as any, ctx);
			},
			async queue(batch, _env) {
				let messages = JSON.stringify(batch.messages);
				console.log(`consumed from our queue: ${messages}`);
			},
		} satisfies ExportedHandler<Cloudflare.Env>,
	};
}
