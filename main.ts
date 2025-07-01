import { parseArgs } from "@std/cli/parse-args";
import {
	getAppVersionNumber
} from "./helpers.ts";
import { FileTokenStorage } from "./file_token_storage.ts";

const args = parseArgs(Deno.args, {
	alias: {
		"mk": "make",
		"help": "h",
		"version": "v",
		"set-token": "st"
	},
	unknown: (_arg, key, value) => {
		console.warn(`Invalid argument`);
		console.log(`
			usage: mj --mk <github-repo-url>
			-h, --help    Show Help
			-st, --set-token <token> Set GitHub token for authentication
			-mk, --make  Make clone string from github repo url
			-v, --version Show Version
		`);
		return true; // Return true to keep the unknown argument
	}
});

if (args?.help) {
	console.log(`
		usage: mj --mk <github-repo-url>
		-h, --help    Show Help
		-st, --set-token <token> Set GitHub token for authentication
		-mk, --make  Make clone string from github repo url
		-v, --version Show Version
	`);
	Deno.exit(0);
}

if(args?.["set-token"]) {
	const token: string = args["set-token"];
	if(  token.startsWith("ghp_") === false && token.startsWith("gho_") === false) {
		console.error("❌ Invalid token format. GitHub tokens should start with 'ghp_' or 'gho_'.");
		Deno.exit(1);
	}
	const storage = new FileTokenStorage();
	await storage.store("github_token", token);
	console.log(`✅ Token set successfully: ${token}`);
	Deno.exit(0);
}

if(args?.["make"]) {
	const repoUrl: string = args["make"];

	if( repoUrl.includes("github.com") === false) {
		console.error("❌ Invalid GitHub repository URL. Please provide a valid URL.");
		Deno.exit(1);
	}

	const storage = new FileTokenStorage();
	const token = await storage.retrieve("github_token");

	if( !token) {
		console.error("❌ No GitHub token found. Please set a token using --set-token.");
		Deno.exit(1);
	}

	const finalUrl = repoUrl.replace("github.com", `${token}@github.com`);

	const cloneString = `git clone ${finalUrl}`;
	console.log(cloneString);
}

if( args?.version) {
	console.log(`mj version: ${await getAppVersionNumber()}`);
	Deno.exit(0);
}