import { Buffer } from "node:buffer";
import { createDecipheriv, createHash } from "node:crypto";
import process from "node:process";
import { parseEnv, TextDecoder } from "node:util";
import { BaseService, type BaseServiceOptions } from "./base-service.js";

const defaultEnvHorizonUri = "https://toggle.hyphen.cloud";
const defaultEnvKeyStoreUri = "https://vinz.hyphen.ai";

export type EnvKey = {
	secretKeyId: number;
	secretKey: string;
};

export type EnvLoadOptions = {
	includeDefault?: boolean;
	override?: boolean;
};

export type EnvServiceOptions = {
	apiKey?: string;
	organizationId?: string;
	projectId?: string;
	applicationId?: string;
	decryptionKey?: EnvKey;
	horizonUri?: string;
	keyStoreUri?: string;
} & BaseServiceOptions;

const environmentNamePattern = /^[a-z0-9_-]+$/;
const base64UrlPattern = /^[A-Za-z0-9_-]+={0,2}$/;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

class SafeEnvError extends Error {}

export class Env extends BaseService {
	private _apiKey: string | undefined;
	private readonly _organizationId: string | undefined;
	private readonly _projectId: string | undefined;
	private readonly _applicationId: string | undefined;
	private readonly _decryptionKey: EnvKey | undefined;
	private readonly _horizonUri: string;
	private readonly _keyStoreUri: string;

	constructor(options?: EnvServiceOptions) {
		super(options);
		this._organizationId =
			options?.organizationId ?? process.env.HYPHEN_ORGANIZATION_ID;
		this._projectId =
			options?.projectId ??
			process.env.HYPHEN_PROJECT_ID ??
			process.env.HYPHEN_PROJECT_NAME;
		this._applicationId =
			options?.applicationId ??
			process.env.HYPHEN_APPLICATION_ID ??
			process.env.HYPHEN_APP_ID ??
			process.env.HYPHEN_APP_NAME;
		this._decryptionKey = options?.decryptionKey;
		this._horizonUri = stripTrailingSlash(
			options?.horizonUri ?? defaultEnvHorizonUri,
		);
		this._keyStoreUri = stripTrailingSlash(
			options?.keyStoreUri ?? defaultEnvKeyStoreUri,
		);
		this.apiKey = options?.apiKey ?? process.env.HYPHEN_API_KEY;
	}

	public get apiKey(): string | undefined {
		return this._apiKey;
	}

	public set apiKey(value: string | undefined) {
		this._apiKey = value;
	}

	public async load(
		environment?: string,
		options?: EnvLoadOptions,
	): Promise<Record<string, string>> {
		const environmentName = normalizeEnvironmentName(
			environment ?? process.env.HYPHEN_APP_ENVIRONMENT ?? "default",
		);
		this.validateConfiguration();

		const key = await this.getDecryptionKey();
		const includeDefault = options?.includeDefault ?? true;
		const environmentNames =
			environmentName !== "default" && includeDefault
				? ["default", environmentName]
				: [environmentName];
		const layers = await Promise.all(
			environmentNames.map((name) => this.loadEnvironment(name, key)),
		);
		const variables = Object.assign({}, ...layers) as Record<string, string>;
		const entries = Object.entries(variables);
		if (
			entries.some(
				([name, value]) => name.includes("\0") || value.includes("\0"),
			)
		) {
			throw new Error(
				"Hyphen ENV contains a variable that cannot be added to process.env.",
			);
		}

		for (const [name, value] of entries) {
			if ((options?.override ?? true) || process.env[name] === undefined) {
				process.env[name] = value;
			}
		}

		return variables;
	}

	private validateConfiguration(): void {
		if (!this._apiKey) {
			throw new Error("An API key is required to load Hyphen ENV data.");
		}
		if (this._apiKey.startsWith("public_")) {
			throw new Error("A public API key cannot load Hyphen ENV data.");
		}
		if (!this._organizationId) {
			throw new Error(
				"An organization ID is required to load Hyphen ENV data.",
			);
		}
		if (!this._applicationId) {
			throw new Error("An application ID is required to load Hyphen ENV data.");
		}
		if (!this._decryptionKey && !this._projectId) {
			throw new Error(
				"A project ID or decryption key is required to load Hyphen ENV data.",
			);
		}
	}

	private async getDecryptionKey(): Promise<EnvKey> {
		if (this._decryptionKey) {
			return validateKey(this._decryptionKey);
		}

		try {
			const url = `${this._keyStoreUri}/${encodeURIComponent(this._organizationId as string)}/${encodeURIComponent(this._projectId as string)}/key`;
			const response = await this.get<unknown>(url, {
				caching: false,
				headers: this.createHeaders(this._apiKey),
			});
			if (response.status !== 200) {
				throw new SafeEnvError(`HTTP ${response.status}`);
			}
			return readKeyResponse(response.data);
		} catch (error) {
			throw contextualError("Failed to fetch the Hyphen ENV key", error);
		}
	}

	private async loadEnvironment(
		environment: string,
		key: EnvKey,
	): Promise<Record<string, string>> {
		let encryptedData: string;
		try {
			const url = `${this._horizonUri}/api/organizations/${encodeURIComponent(this._organizationId as string)}/apps/${encodeURIComponent(this._applicationId as string)}/dot-env/`;
			const params: Record<string, number | string> = {
				secretKeyId: key.secretKeyId,
			};
			if (environment !== "default") {
				params.environmentId = environment;
			}

			const response = await this.get<unknown>(url, {
				caching: false,
				headers: this.createHeaders(this._apiKey),
				params,
			});
			if (response.status !== 200) {
				throw new SafeEnvError(`HTTP ${response.status}`);
			}
			encryptedData = readEnvironmentResponse(response.data);
		} catch (error) {
			throw contextualError(
				`Failed to fetch Hyphen ENV "${environment}"`,
				error,
			);
		}

		try {
			return parseEnv(decrypt(encryptedData, key.secretKey));
		} catch {
			throw new Error(
				`Failed to decrypt or parse Hyphen ENV "${environment}".`,
			);
		}
	}
}

function normalizeEnvironmentName(environment: string): string {
	const name = environment === "" ? "default" : environment.toLowerCase();
	if (!environmentNamePattern.test(name)) {
		throw new Error(
			"Environment must contain only lowercase letters, numbers, hyphens, and underscores.",
		);
	}
	return name;
}

function validateKey(key: {
	secretKeyId: unknown;
	secretKey: unknown;
}): EnvKey {
	if (
		typeof key.secretKeyId !== "number" ||
		!Number.isSafeInteger(key.secretKeyId) ||
		key.secretKeyId < 1 ||
		typeof key.secretKey !== "string" ||
		key.secretKey.length === 0
	) {
		throw new SafeEnvError("The Hyphen ENV key is invalid.");
	}
	return {
		secretKeyId: key.secretKeyId,
		secretKey: key.secretKey,
	};
}

function readKeyResponse(value: unknown): EnvKey {
	if (!isRecord(value) || !isRecord(value.key)) {
		throw new SafeEnvError("The key-store response is invalid.");
	}
	return validateKey({
		secretKeyId: value.key.secret_key_id,
		secretKey: value.key.secret_key,
	});
}

function readEnvironmentResponse(value: unknown): string {
	if (!isRecord(value) || typeof value.data !== "string") {
		throw new SafeEnvError("The response did not contain encrypted ENV data.");
	}
	return value.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function decrypt(encryptedData: string, secretKey: string): string {
	const ciphertext = decodeBase64Url(encryptedData);
	if (ciphertext.length < 16) {
		throw new Error(
			"Encrypted ENV data is shorter than its initialization vector.",
		);
	}

	const keyHash = createHash("sha256").update(secretKey).digest("hex");
	const key = Buffer.from(keyHash.slice(0, 32), "utf8");
	const decipher = createDecipheriv(
		"aes-256-cfb",
		key,
		ciphertext.subarray(0, 16),
	);
	const plaintext = Buffer.concat([
		decipher.update(ciphertext.subarray(16)),
		decipher.final(),
	]);
	return utf8Decoder.decode(plaintext);
}

function decodeBase64Url(value: string): Buffer {
	if (!base64UrlPattern.test(value) || value.length % 4 === 1) {
		throw new Error("Encrypted ENV data is not valid base64url.");
	}

	const unpadded = value.replace(/=+$/, "");
	const padding = value.length - unpadded.length;
	const requiredPadding = (4 - (unpadded.length % 4)) % 4;
	if (
		padding !== requiredPadding ||
		Buffer.from(unpadded, "base64url").toString("base64url") !== unpadded
	) {
		throw new Error("Encrypted ENV data is not valid base64url.");
	}
	return Buffer.from(unpadded, "base64url");
}

function stripTrailingSlash(uri: string): string {
	let end = uri.length;
	while (end > 0 && uri[end - 1] === "/") {
		end -= 1;
	}
	return uri.slice(0, end);
}

function contextualError(message: string, error: unknown): Error {
	const detail =
		error instanceof SafeEnvError ? error.message : "Request failed.";
	return new Error(`${message}: ${detail}`);
}
