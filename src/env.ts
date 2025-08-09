import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { config } from "dotenv";

export type EnvOptions = {
	path?: string;
	environment?: string;
	local?: boolean;
};

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
	if (fs.existsSync(envPath)) {
		config({ path: envPath, quiet: true, debug: false });
	}

	// Load the .env.local file if it exists
	if (local) {
		const localEnvPath = path.resolve(currentWorkingDirectory, ".env.local");
		if (fs.existsSync(localEnvPath)) {
			config({
				path: localEnvPath,
				override: true,
				quiet: true,
				debug: false,
			});
		}
	}

	// Load the environment specific .env file
	const environment = options?.environment ?? process.env.NODE_ENV;

	if (environment) {
		const envSpecificPath = path.resolve(
			currentWorkingDirectory,
			`.env.${environment}`,
		);
		if (fs.existsSync(envSpecificPath)) {
			config({
				path: envSpecificPath,
				override: true,
				quiet: true,
				debug: false,
			});
		}

		// Load the environment specific .env.local file if it exists
		if (local) {
			const envLocalPath = path.resolve(
				currentWorkingDirectory,
				`.env.${environment}.local`,
			);
			if (fs.existsSync(envLocalPath)) {
				config({
					path: envLocalPath,
					override: true,
					quiet: true,
					debug: false,
				});
			}
		}
	}
}

export const loadEnv = env; // Alias for backward compatibility
export type LoadEnvOptions = EnvOptions; // Alias for backward compatibility
