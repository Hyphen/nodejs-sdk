import { Buffer } from "node:buffer";
import { createCipheriv, createHash } from "node:crypto";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { HttpResponse } from "../src/base-service.js";
import {
	Env,
	type EnvKey,
	type EnvServiceOptions,
} from "../src/env-service.js";

const apiKey = "private-test-api-key";
const organizationId = "org_test";
const projectId = "proj_test";
const applicationId = "app_test";
const productionEnvironment = "production";
const defaultEnvHorizonUri = "https://toggle.hyphen.cloud";
const defaultEnvKeyStoreUri = "https://vinz.hyphen.ai";
const testVariableNames = [
	"CUSTOM_URI",
	"DEFAULT_ONLY",
	"DEFAULT_VALUE",
	"DEPLOY_FALLBACK",
	"DIRECT_KEY",
	"EXPLICIT",
	"FROM_ENV",
	"ID_PRECEDENCE",
	"LEGACY_APP_ID",
	"NAMED_ONLY",
	"NEW_VALUE",
	"ONLY_NAMED",
	"QUOTED",
	"SETTER_KEY",
	"SHARED",
	"UNCHANGED",
];

const decryptionKey: EnvKey = {
	secretKeyId: 1_725_000_000,
	secretKey: "dGVzdC1zZWNyZXQ=",
};

const authHeaders = {
	accept: "application/json",
	"content-type": "application/json",
	"x-api-key": apiKey,
};

const keyStoreUrl = `${defaultEnvKeyStoreUri}/${organizationId}/${projectId}/key`;
const horizonUrl = `${defaultEnvHorizonUri}/api/organizations/${organizationId}/apps/${applicationId}/dot-env/`;

function response<T>(
	data: T,
	status = 200,
	statusText = status === 200 ? "OK" : "Request failed",
): HttpResponse<T> {
	return {
		data,
		status,
		statusText,
		headers: {},
		config: {},
	};
}

function padBase64(value: string): string {
	return value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
}

/**
 * Produces the wire format used by hx: SHA-256 hex characters as the AES key,
 * followed by AES-256-CFB with the IV prefixed to padded base64url ciphertext.
 */
function encryptBytesLikeHx(
	plaintext: Uint8Array,
	secretKey = decryptionKey.secretKey,
	ivByte = 1,
): string {
	const hash = createHash("sha256").update(secretKey).digest("hex");
	const key = Buffer.from(hash.slice(0, 32), "utf8");
	const iv = Buffer.alloc(16, ivByte);
	const cipher = createCipheriv("aes-256-cfb", key, iv);
	const encrypted = Buffer.concat([
		iv,
		cipher.update(plaintext),
		cipher.final(),
	]);

	return padBase64(encrypted.toString("base64url"));
}

function encryptLikeHx(
	plaintext: string,
	secretKey = decryptionKey.secretKey,
	ivByte = 1,
): string {
	return encryptBytesLikeHx(Buffer.from(plaintext), secretKey, ivByte);
}

function createService(overrides: EnvServiceOptions = {}): Env {
	return new Env({
		apiKey,
		organizationId,
		projectId,
		applicationId,
		...overrides,
	});
}

function mockKeyResponse(key = decryptionKey): HttpResponse<unknown> {
	return response({
		key: {
			secret_key_id: key.secretKeyId,
			secret_key: key.secretKey,
		},
	});
}

function mockEnvResponse(plaintext: string, ivByte = 1): HttpResponse<unknown> {
	return response({
		data: encryptLikeHx(plaintext, decryptionKey.secretKey, ivByte),
	});
}

let originalEnvironment: NodeJS.ProcessEnv;

beforeEach(() => {
	originalEnvironment = { ...process.env };
	delete process.env.HYPHEN_API_KEY;
	delete process.env.HYPHEN_ORGANIZATION_ID;
	delete process.env.HYPHEN_PROJECT_ID;
	delete process.env.HYPHEN_PROJECT_NAME;
	delete process.env.HYPHEN_APPLICATION_ID;
	delete process.env.HYPHEN_APP_ID;
	delete process.env.HYPHEN_APP_NAME;
	delete process.env.HYPHEN_APP_ENVIRONMENT;
	for (const name of testVariableNames) {
		delete process.env[name];
	}
});

afterEach(() => {
	for (const key of Object.keys(process.env)) {
		delete process.env[key];
	}
	Object.assign(process.env, originalEnvironment);
	vi.restoreAllMocks();
});

describe("Env", () => {
	test("uses the production ENV service endpoints", () => {
		expect(defaultEnvHorizonUri).toBe("https://toggle.hyphen.cloud");
		expect(defaultEnvKeyStoreUri).toBe("https://vinz.hyphen.ai");
	});

	test("decrypts a fixed ciphertext produced by the Go hx algorithm", async () => {
		const service = createService({
			decryptionKey: {
				secretKeyId: 1,
				secretKey: "c2VjcmV0LWtleQ==",
			},
		});
		const getSpy = vi.spyOn(service, "get").mockResolvedValue(
			response({
				data: "AAECAwQFBgcICQoLDA0OD3bIZNW5zB1r27HjMfDRJ2Xghuc=",
			}),
		);

		const variables = await service.load("default");

		expect(variables).toEqual({ FOO: "bar", NESTED: "a=b" });
		expect(process.env.FOO).toBe("bar");
		expect(process.env.NESTED).toBe("a=b");
		expect(getSpy).toHaveBeenCalledOnce();
	});

	test("fetches the key, merges default and named ENV, and applies named values last", async () => {
		const service = createService();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(
				mockEnvResponse(
					'DEFAULT_ONLY=base\nSHARED=default\nQUOTED="hello world"\n',
					2,
				),
			)
			.mockResolvedValueOnce(
				mockEnvResponse("SHARED=named\nNAMED_ONLY=value=with=equals\n", 3),
			);

		const variables = await service.load(productionEnvironment);

		expect(variables).toEqual({
			DEFAULT_ONLY: "base",
			NAMED_ONLY: "value=with=equals",
			QUOTED: "hello world",
			SHARED: "named",
		});
		expect(process.env.DEFAULT_ONLY).toBe("base");
		expect(process.env.NAMED_ONLY).toBe("value=with=equals");
		expect(process.env.QUOTED).toBe("hello world");
		expect(process.env.SHARED).toBe("named");

		expect(getSpy).toHaveBeenNthCalledWith(1, keyStoreUrl, {
			caching: false,
			headers: authHeaders,
		});
		expect(getSpy).toHaveBeenNthCalledWith(2, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
		expect(getSpy).toHaveBeenNthCalledWith(3, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: {
				environmentId: productionEnvironment,
				secretKeyId: decryptionKey.secretKeyId,
			},
		});
	});

	test("fetches only the named ENV when includeDefault is false", async () => {
		const service = createService();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("ONLY_NAMED=yes\n"));

		await expect(
			service.load(productionEnvironment, { includeDefault: false }),
		).resolves.toEqual({ ONLY_NAMED: "yes" });

		expect(getSpy).toHaveBeenCalledTimes(2);
		expect(getSpy).toHaveBeenLastCalledWith(horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: {
				environmentId: productionEnvironment,
				secretKeyId: decryptionKey.secretKeyId,
			},
		});
	});

	test("loads the default ENV only once", async () => {
		const service = createService();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("DEFAULT_VALUE=yes\n"));

		await expect(service.load()).resolves.toEqual({ DEFAULT_VALUE: "yes" });

		expect(getSpy).toHaveBeenCalledTimes(2);
		expect(getSpy).toHaveBeenLastCalledWith(horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
	});

	test("returns remote values but preserves existing process values when override is false", async () => {
		process.env.SHARED = "existing";
		const service = createService({ decryptionKey });
		vi.spyOn(service, "get").mockResolvedValue(
			mockEnvResponse("SHARED=remote\nNEW_VALUE=added\n"),
		);

		await expect(service.load("default", { override: false })).resolves.toEqual(
			{ NEW_VALUE: "added", SHARED: "remote" },
		);

		expect(process.env.SHARED).toBe("existing");
		expect(process.env.NEW_VALUE).toBe("added");
	});

	test("overwrites existing process values by default", async () => {
		process.env.SHARED = "existing";
		const service = createService({ decryptionKey });
		vi.spyOn(service, "get").mockResolvedValue(
			mockEnvResponse("SHARED=remote\n"),
		);

		await service.load();

		expect(process.env.SHARED).toBe("remote");
	});

	test("uses an explicit key without requiring a project or requesting the key store", async () => {
		const service = new Env({
			apiKey,
			organizationId,
			applicationId,
			decryptionKey,
		});
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValue(mockEnvResponse("DIRECT_KEY=yes\n"));

		await expect(
			service.load(productionEnvironment, { includeDefault: false }),
		).resolves.toEqual({ DIRECT_KEY: "yes" });

		expect(getSpy).toHaveBeenCalledOnce();
		expect(getSpy).toHaveBeenCalledWith(horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: {
				environmentId: productionEnvironment,
				secretKeyId: decryptionKey.secretKeyId,
			},
		});
	});

	test("falls back to the documented environment variables", async () => {
		process.env.HYPHEN_API_KEY = apiKey;
		process.env.HYPHEN_ORGANIZATION_ID = organizationId;
		process.env.HYPHEN_PROJECT_ID = projectId;
		process.env.HYPHEN_APPLICATION_ID = applicationId;
		const service = new Env();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("FROM_ENV=yes\n"));

		await expect(service.load()).resolves.toEqual({ FROM_ENV: "yes" });

		expect(service.apiKey).toBe(apiKey);
		expect(getSpy).toHaveBeenNthCalledWith(1, keyStoreUrl, {
			caching: false,
			headers: authHeaders,
		});
		expect(getSpy).toHaveBeenNthCalledWith(2, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
	});

	test("supports HYPHEN_APP_ID as a legacy application fallback", async () => {
		process.env.HYPHEN_API_KEY = apiKey;
		process.env.HYPHEN_ORGANIZATION_ID = organizationId;
		process.env.HYPHEN_PROJECT_ID = projectId;
		process.env.HYPHEN_APP_ID = applicationId;
		const service = new Env({ decryptionKey });
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValue(mockEnvResponse("LEGACY_APP_ID=yes\n"));

		await service.load();

		expect(getSpy).toHaveBeenCalledWith(horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
	});

	test("uses Hyphen Deploy names and environment as final fallbacks", async () => {
		const deployProjectName = "project-from-deploy";
		const deployApplicationName = "app-from-deploy";
		const deployEnvironment = "staging";
		process.env.HYPHEN_API_KEY = apiKey;
		process.env.HYPHEN_ORGANIZATION_ID = organizationId;
		process.env.HYPHEN_PROJECT_NAME = deployProjectName;
		process.env.HYPHEN_APP_NAME = deployApplicationName;
		process.env.HYPHEN_APP_ENVIRONMENT = deployEnvironment;
		const service = new Env();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("DEFAULT_VALUE=yes\n"))
			.mockResolvedValueOnce(mockEnvResponse("DEPLOY_FALLBACK=yes\n"));

		await expect(service.load()).resolves.toEqual({
			DEFAULT_VALUE: "yes",
			DEPLOY_FALLBACK: "yes",
		});

		expect(getSpy).toHaveBeenNthCalledWith(
			1,
			`${defaultEnvKeyStoreUri}/${organizationId}/${deployProjectName}/key`,
			{
				caching: false,
				headers: authHeaders,
			},
		);
		expect(getSpy).toHaveBeenNthCalledWith(
			2,
			`${defaultEnvHorizonUri}/api/organizations/${organizationId}/apps/${deployApplicationName}/dot-env/`,
			{
				caching: false,
				headers: authHeaders,
				params: { secretKeyId: decryptionKey.secretKeyId },
			},
		);
		expect(getSpy).toHaveBeenNthCalledWith(
			3,
			`${defaultEnvHorizonUri}/api/organizations/${organizationId}/apps/${deployApplicationName}/dot-env/`,
			{
				caching: false,
				headers: authHeaders,
				params: {
					environmentId: deployEnvironment,
					secretKeyId: decryptionKey.secretKeyId,
				},
			},
		);
	});

	test("prefers ID variables and an explicit environment over deploy fallbacks", async () => {
		process.env.HYPHEN_API_KEY = apiKey;
		process.env.HYPHEN_ORGANIZATION_ID = organizationId;
		process.env.HYPHEN_PROJECT_ID = projectId;
		process.env.HYPHEN_PROJECT_NAME = "ignored-project-name";
		process.env.HYPHEN_APPLICATION_ID = applicationId;
		process.env.HYPHEN_APP_ID = "ignored-legacy-app-id";
		process.env.HYPHEN_APP_NAME = "ignored-app-name";
		process.env.HYPHEN_APP_ENVIRONMENT = "ignored-environment";
		const service = new Env();
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("ID_PRECEDENCE=yes\n"));

		await expect(
			service.load("PRODUCTION", { includeDefault: false }),
		).resolves.toEqual({ ID_PRECEDENCE: "yes" });

		expect(getSpy).toHaveBeenNthCalledWith(1, keyStoreUrl, {
			caching: false,
			headers: authHeaders,
		});
		expect(getSpy).toHaveBeenNthCalledWith(2, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: {
				environmentId: productionEnvironment,
				secretKeyId: decryptionKey.secretKeyId,
			},
		});
	});

	test("prefers explicit options over environment variable fallbacks", async () => {
		process.env.HYPHEN_API_KEY = "environment-api-key";
		process.env.HYPHEN_ORGANIZATION_ID = "org_environment";
		process.env.HYPHEN_PROJECT_ID = "proj_environment";
		process.env.HYPHEN_APPLICATION_ID = "app_environment";
		const service = createService({ decryptionKey });
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValue(mockEnvResponse("EXPLICIT=yes\n"));

		await service.load();

		expect(getSpy).toHaveBeenCalledWith(horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
	});

	test("uses custom service URIs without duplicate trailing slashes", async () => {
		const customKeyStoreUri = "https://keys.example.test/";
		const customHorizonUri = "https://env.example.test/";
		const service = createService({
			keyStoreUri: customKeyStoreUri,
			horizonUri: customHorizonUri,
		});
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockKeyResponse())
			.mockResolvedValueOnce(mockEnvResponse("CUSTOM_URI=yes\n"));

		await service.load();

		expect(getSpy).toHaveBeenNthCalledWith(
			1,
			`https://keys.example.test/${organizationId}/${projectId}/key`,
			expect.any(Object),
		);
		expect(getSpy).toHaveBeenNthCalledWith(
			2,
			`https://env.example.test/api/organizations/${organizationId}/apps/${applicationId}/dot-env/`,
			expect.any(Object),
		);
	});

	test("allows the API key to be supplied after construction", async () => {
		const service = new Env({
			organizationId,
			applicationId,
			decryptionKey,
		});
		service.apiKey = apiKey;
		vi.spyOn(service, "get").mockResolvedValue(
			mockEnvResponse("SETTER_KEY=yes\n"),
		);

		expect(service.apiKey).toBe(apiKey);
		await expect(service.load()).resolves.toEqual({ SETTER_KEY: "yes" });
	});

	test("rejects a public API key on load before making a request", async () => {
		const constructorService = createService({ apiKey: "public_test-key" });
		const constructorGetSpy = vi.spyOn(constructorService, "get");
		await expect(constructorService.load()).rejects.toThrow(
			"A public API key cannot load Hyphen ENV data.",
		);
		expect(constructorGetSpy).not.toHaveBeenCalled();

		const setterService = createService();
		setterService.apiKey = "public_test-key";
		const setterGetSpy = vi.spyOn(setterService, "get");
		await expect(setterService.load()).rejects.toThrow(
			"A public API key cannot load Hyphen ENV data.",
		);
		expect(setterGetSpy).not.toHaveBeenCalled();
	});

	test("normalizes uppercase and empty environment names", async () => {
		const service = createService({ decryptionKey });
		const getSpy = vi
			.spyOn(service, "get")
			.mockResolvedValueOnce(mockEnvResponse("ONLY_NAMED=yes\n"))
			.mockResolvedValueOnce(mockEnvResponse("DEFAULT_VALUE=yes\n"));

		await service.load("PRODUCTION", { includeDefault: false });
		await service.load("");

		expect(getSpy).toHaveBeenNthCalledWith(1, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: {
				environmentId: "production",
				secretKeyId: decryptionKey.secretKeyId,
			},
		});
		expect(getSpy).toHaveBeenNthCalledWith(2, horizonUrl, {
			caching: false,
			headers: authHeaders,
			params: { secretKeyId: decryptionKey.secretKeyId },
		});
	});

	test("rejects an invalid environment name before making a request", async () => {
		const service = createService({ decryptionKey });
		const getSpy = vi.spyOn(service, "get");

		await expect(service.load("invalid environment!")).rejects.toThrow(
			"Environment must contain only lowercase letters, numbers, hyphens, and underscores.",
		);
		expect(getSpy).not.toHaveBeenCalled();
	});

	describe("validation", () => {
		test.each([
			{
				label: "API key",
				options: { organizationId, projectId, applicationId },
				error: "An API key is required to load Hyphen ENV data.",
			},
			{
				label: "organization ID",
				options: { apiKey, projectId, applicationId },
				error: "An organization ID is required to load Hyphen ENV data.",
			},
			{
				label: "application ID",
				options: { apiKey, organizationId, projectId },
				error: "An application ID is required to load Hyphen ENV data.",
			},
			{
				label: "project ID",
				options: { apiKey, organizationId, applicationId },
				error:
					"A project ID or decryption key is required to load Hyphen ENV data.",
			},
		])("rejects a missing $label before making a request", async ({
			options,
			error,
		}) => {
			const service = new Env(options);
			const getSpy = vi.spyOn(service, "get");

			await expect(service.load()).rejects.toThrow(error);
			expect(getSpy).not.toHaveBeenCalled();
		});

		test.each([
			{ secretKeyId: 0, secretKey: decryptionKey.secretKey },
			{ secretKeyId: -1, secretKey: decryptionKey.secretKey },
			{ secretKeyId: Number.NaN, secretKey: decryptionKey.secretKey },
			{ secretKeyId: decryptionKey.secretKeyId, secretKey: "" },
		])("rejects an invalid explicit decryption key %#", async (invalidKey) => {
			const service = createService({ decryptionKey: invalidKey });
			const getSpy = vi.spyOn(service, "get");

			await expect(service.load()).rejects.toThrow(
				"The Hyphen ENV key is invalid.",
			);
			expect(getSpy).not.toHaveBeenCalled();
		});
	});

	describe("failures are atomic", () => {
		test("rejects a failed key-store response without mutating process.env", async () => {
			process.env.UNCHANGED = "before";
			const service = createService();
			vi.spyOn(service, "get").mockResolvedValue(
				response({ message: "unauthorized" }, 401, "Unauthorized"),
			);

			await expect(service.load()).rejects.toThrow(
				"Failed to fetch the Hyphen ENV key: HTTP 401",
			);

			expect(process.env.UNCHANGED).toBe("before");
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test.each([
			null,
			{},
			{ key: null },
			{ key: {} },
			{ key: { secret_key_id: "not-a-number", secret_key: "secret" } },
			{ key: { secret_key_id: 1, secret_key: "" } },
			{ key: { secret_key_id: 1, secret_key: 123 } },
		])("rejects a malformed key-store payload %#", async (payload) => {
			const service = createService();
			vi.spyOn(service, "get").mockResolvedValue(response(payload));

			await expect(service.load()).rejects.toThrow(
				"Failed to fetch the Hyphen ENV key:",
			);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test("rejects a failed Horizon response without mutating process.env", async () => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(
				response({ message: "unavailable" }, 503, "Service Unavailable"),
			);

			await expect(service.load()).rejects.toThrow(
				'Failed to fetch Hyphen ENV "default": HTTP 503',
			);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test.each([
			null,
			{},
			{ data: null },
			{ data: 123 },
		])("rejects a malformed Horizon payload %#", async (payload) => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(response(payload));

			await expect(service.load()).rejects.toThrow(
				'Failed to fetch Hyphen ENV "default":',
			);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test.each([
			"not-base64!",
			"A",
			"AA=",
			"AB",
			"AAECAwQFBgcICQ==",
		])("rejects malformed or truncated ciphertext %s", async (data) => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(response({ data }));

			await expect(service.load()).rejects.toThrow(
				'Failed to decrypt or parse Hyphen ENV "default".',
			);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test("rejects decrypted bytes that are not valid UTF-8", async () => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(
				response({ data: encryptBytesLikeHx(Uint8Array.of(0xff)) }),
			);

			await expect(service.load()).rejects.toThrow(
				'Failed to decrypt or parse Hyphen ENV "default".',
			);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test.each([
			"SAFE_VALUE=before\nBAD\0NAME=value\n",
			"SAFE_VALUE=before\nBAD_VALUE=value\0suffix\n",
		])("rejects process-incompatible variables atomically", async (contents) => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(mockEnvResponse(contents));

			await expect(service.load()).rejects.toThrow(
				"Hyphen ENV contains a variable that cannot be added to process.env.",
			);
			expect(process.env.SAFE_VALUE).toBeUndefined();
		});

		test("accepts empty and comment-only ENV documents", async () => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockResolvedValue(
				mockEnvResponse("# This environment intentionally has no variables.\n"),
			);

			await expect(service.load()).resolves.toEqual({});
		});

		test("rejects ciphertext when required base64url padding is missing", async () => {
			const service = createService({ decryptionKey });
			const data = encryptLikeHx("UNPADDED=yes\n").replace(/=+$/, "");
			vi.spyOn(service, "get").mockResolvedValue(response({ data }));

			await expect(service.load()).rejects.toThrow(
				'Failed to decrypt or parse Hyphen ENV "default".',
			);
		});

		test("does not apply a valid default ENV when the named ENV fails", async () => {
			process.env.UNCHANGED = "before";
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get")
				.mockResolvedValueOnce(mockEnvResponse("DEFAULT_ONLY=base\n"))
				.mockResolvedValueOnce(
					response({ message: "not found" }, 404, "Not Found"),
				);

			await expect(service.load(productionEnvironment)).rejects.toThrow(
				'Failed to fetch Hyphen ENV "production": HTTP 404',
			);

			expect(process.env.DEFAULT_ONLY).toBeUndefined();
			expect(process.env.UNCHANGED).toBe("before");
		});

		test("sanitizes request failures without mutating process.env", async () => {
			const service = createService({ decryptionKey });
			const sensitiveDetail = `network down: ${decryptionKey.secretKey}`;
			vi.spyOn(service, "get").mockRejectedValue(new Error(sensitiveDetail));

			const error = await service.load().catch((caught) => caught as Error);
			expect(error.message).toBe(
				'Failed to fetch Hyphen ENV "default": Request failed.',
			);
			expect(error.message).not.toContain(decryptionKey.secretKey);
			expect(process.env.DEFAULT_ONLY).toBeUndefined();
		});

		test("uses a stable message for a non-Error request rejection", async () => {
			const service = createService({ decryptionKey });
			vi.spyOn(service, "get").mockRejectedValue("network down");

			await expect(service.load()).rejects.toThrow(
				'Failed to fetch Hyphen ENV "default": Request failed.',
			);
		});
	});
});
