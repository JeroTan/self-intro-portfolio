// @ts-check
import { defineConfig, envField } from "astro/config";
import { loadEnv } from "vite";

import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

const env = loadEnv("", process.cwd(), "");

// https://astro.build/config
export default defineConfig({
    adapter: cloudflare({
        imageService: "compile",
        workerEntryPoint: {
            path: "src/cloudflare/worker.ts",
            namedExports: ["ChatRoom"],
        },
    }),
    image: {
        // Allow processing all images from remote. This allow modifying the images size depending on the device.
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.placehold.co",
            },
            {
                protocol: "https",
                hostname: "**.imagedelivery.net",
            },
        ],
    },
    devToolbar: {
        enabled: false,
    },
    output: "server",
    prefetch: {
        defaultStrategy: "viewport",
    },
    env: {
        schema: {
            SECRET_ENVIRONMENT_STATUS: envField.string({ context: "server", access: "public", default: "live" }),
        },
    },
    vite: {
        ssr: {
            external: ["node:buffer"],
        },
        plugins: [tailwindcss()],
         resolve: {
            //@ts-ignore
            alias: import.meta.env.PROD &&  {
                "react-dom/server": "react-dom/server.edge",
            }
        },
        build: {
            minify: false,
            reportCompressedSize: false,
        },
    },
    server: {
        port: 3001,
        host: true,
    },
    i18n: {
        defaultLocale: "en",
        locales: ["en", "ph"],
        routing: {
            prefixDefaultLocale: false,
        },
    },
    integrations: [sitemap({
        filter: (page) => page !== "/500" && page !== "/404",
        i18n: {
            defaultLocale: "en",
            locales: {
                en: "en-PH",
                ph: "ph-PH",
            },
        },
		}), react()],
    site: "https://__YOUR_DOMAIN__.com/",
});