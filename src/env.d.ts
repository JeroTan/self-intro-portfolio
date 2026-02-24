/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly SECRET_ENVIRONMENT_STATUS: "live" | "maintenance";
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Cloudflare.Env>;

declare namespace App {
	interface Locals extends Runtime {}
}
