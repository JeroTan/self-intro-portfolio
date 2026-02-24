import { Middleware } from "@/lib/middleware/main";
import { sequence, defineMiddleware } from "astro/middleware";
import { CheckIfLive, CheckIfMaintenance } from "./callbacks/maintenance";

/*|------------------------------------------------------------------------------------------|*/
/*|               Entry Point                                                                |*/
/*|------------------------------------------------------------------------------------------|*/
export const onRequest = sequence(Main());
function Main() {
	return defineMiddleware(async (context, next) => {
		// Middleware logic goes here

		// Skip if it is an action
		if (context.url.pathname.startsWith("/_actions")) {
			return next();
		}
		//If it is a server island loader
		if (context.url.pathname.startsWith("/_server-island")) {
			return next();
		}

		// Middleware Utility
		const mid = new Middleware(context, next);

		// Grouping Example

		// 1st Group Middleware
		await mid.group(async (mid) => {
			//Check if maintenance
			await mid.path().except(["/memo/maintenance"], "startend").do(CheckIfMaintenance);
			await mid.path().select(["/memo/maintenance"], "startend").do(CheckIfLive);

			return mid.fin(); // to end the group
		});

		return await mid.result();
	});
}
