import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseEnv } from "node:util";

export type EnvOptions = {
	path?: string;
	environment?: string;
	local?: boolean;
};

function loadEnvFile(filePath: string, override: boolean): void {
	try {
		const content = fs.readFileSync(filePath, "utf8");
		const parsed = parseEnv(content);
		for (const [key, value] of Object.entries(parsed)) {
			if (override || process.env[key] === undefined) {
				process.env[key] = value;
			}
		}
	} catch {
		// File doesn't exist or can't be read, skip silently
	}
}

/**
 * @description Helper function to load your environment variables based on your default .env file
 * and the current environment.
 * @param {EnvOptions} [options] - Options to customize the loading of environment variables.
 * @returns {void}
 * @example
 * import { env } from '@hyphen/sdk';
 * env();
 */
export function env(options?: EnvOptions): void {
	const local = options?.local ?? true;

	// Set the current working directory if provided
	const currentWorkingDirectory = options?.path ?? process.cwd();

	// Load the default .env file
	const envPath = path.resolve(currentWorkingDirectory, ".env");
	loadEnvFile(envPath, false);

	// Load the .env.local file if it exists
	if (local) {
		const localEnvPath = path.resolve(currentWorkingDirectory, ".env.local");
		loadEnvFile(localEnvPath, true);
	}

	// Load the environment specific .env file
	const environment = options?.environment ?? process.env.NODE_ENV;

	/* v8 ignore next -- @preserve */
	if (environment) {
		const envSpecificPath = path.resolve(
			currentWorkingDirectory,
			`.env.${environment}`,
		);
		loadEnvFile(envSpecificPath, true);

		// Load the environment specific .env.local file if it exists
		if (local) {
			const envLocalPath = path.resolve(
				currentWorkingDirectory,
				`.env.${environment}.local`,
			);
			loadEnvFile(envLocalPath, true);
		}
	}
}

export const loadEnv = env; // Alias for backward compatibility
export type LoadEnvOptions = EnvOptions; // Alias for backward compatibility
