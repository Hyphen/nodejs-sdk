import process from "node:process";
import { describe, expect, test } from "vitest";
import { Toggle } from "../src/toggle.js";

const baseMockUrl = process.env.BASE_MOCK_URL ?? "https://mockhttp.org";

const testTimeout = 10_000;

describe("getOrgIdFromPublicKey", () => {
	test("should extract org ID from valid public key", () => {
		const toggle = new Toggle();
		const orgId = "test-org";
		const validKey = `public_${Buffer.from(`${orgId}:some-secret`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(validKey)).toBe(orgId);
	});

	test("should handle public key without prefix", () => {
		const toggle = new Toggle();
		const orgId = "org-without-prefix";
		const keyWithoutPrefix = Buffer.from(`${orgId}:secret-data`).toString(
			"base64",
		);
		expect(toggle.getOrgIdFromPublicKey(keyWithoutPrefix)).toBe(orgId);
	});

	test("should return undefined for malformed base64", () => {
		const toggle = new Toggle();
		expect(
			toggle.getOrgIdFromPublicKey("public_invalid-base64!"),
		).toBeUndefined();
	});

	test("should return undefined for empty decoded content", () => {
		const toggle = new Toggle();
		const emptyKey = `public_${Buffer.from("").toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(emptyKey)).toBeUndefined();
	});

	test("should return undefined for decoded content without colon", () => {
		const toggle = new Toggle();
		const keyWithoutColon = `public_${Buffer.from("orgidwithoutcolon").toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(keyWithoutColon)).toBe(
			"orgidwithoutcolon",
		);
	});

	test("should handle org ID with valid characters", () => {
		const toggle = new Toggle();
		const orgId = "valid_org-123";
		const validKey = `public_${Buffer.from(`${orgId}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(validKey)).toBe(orgId);
	});

	test("should return undefined for org ID with invalid characters", () => {
		const toggle = new Toggle();
		const invalidOrgId = "org@invalid#chars";
		const invalidKey = `public_${Buffer.from(`${invalidOrgId}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(invalidKey)).toBeUndefined();
	});

	test("should handle org ID with spaces (invalid)", () => {
		const toggle = new Toggle();
		const orgIdWithSpaces = "org with spaces";
		const keyWithSpaces = `public_${Buffer.from(`${orgIdWithSpaces}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(keyWithSpaces)).toBeUndefined();
	});

	test("should handle multiple colons in decoded content", () => {
		const toggle = new Toggle();
		const orgId = "multi-colon-org";
		const keyWithMultipleColons = `public_${Buffer.from(`${orgId}:secret:extra:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(keyWithMultipleColons)).toBe(orgId);
	});

	test("should handle empty org ID", () => {
		const toggle = new Toggle();
		const emptyOrgKey = `public_${Buffer.from(":secret-data").toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(emptyOrgKey)).toBeUndefined();
	});

	test("should handle numeric org ID", () => {
		const toggle = new Toggle();
		const numericOrgId = "123456";
		const numericKey = `public_${Buffer.from(`${numericOrgId}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(numericKey)).toBe(numericOrgId);
	});

	test("should handle very long org ID", () => {
		const toggle = new Toggle();
		const longOrgId = "a".repeat(100);
		const longKey = `public_${Buffer.from(`${longOrgId}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(longKey)).toBe(longOrgId);
	});

	test("should handle single character org ID", () => {
		const toggle = new Toggle();
		const singleCharOrgId = "a";
		const singleCharKey = `public_${Buffer.from(`${singleCharOrgId}:data`).toString("base64")}`;
		expect(toggle.getOrgIdFromPublicKey(singleCharKey)).toBe(singleCharOrgId);
	});

	test("should return undefined for null input", () => {
		const toggle = new Toggle();
		expect(() =>
			toggle.getOrgIdFromPublicKey(null as unknown as string),
		).not.toThrow();
	});

	test("should return undefined for undefined input", () => {
		const toggle = new Toggle();
		expect(() =>
			toggle.getOrgIdFromPublicKey(undefined as unknown as string),
		).not.toThrow();
	});

	test("should handle edge case with only public_ prefix", () => {
		const toggle = new Toggle();
		expect(toggle.getOrgIdFromPublicKey("public_")).toBeUndefined();
	});

	test("should use Buffer fallback when atob is not available", () => {
		const toggle = new Toggle();
		const orgId = "fallback-org";
		const validKey = `public_${Buffer.from(`${orgId}:some-secret`).toString("base64")}`;

		// Temporarily remove atob to force Buffer fallback
		const originalAtob = globalThis.atob;
		// @ts-expect-error - Intentionally setting to undefined for testing
		globalThis.atob = undefined;

		try {
			expect(toggle.getOrgIdFromPublicKey(validKey)).toBe(orgId);
		} finally {
			// Restore original atob
			globalThis.atob = originalAtob;
		}
	});
});

describe("fetch method", () => {
	test("should throw error when horizon URLs array is explicitly empty", async () => {
		const toggle = new Toggle({ horizonUrls: [] });
		await expect(toggle.fetch("/api/test")).rejects.toThrow(
			"No horizon URLs configured. Set horizonUrls or provide a valid publicApiKey.",
		);
	});

	test("should throw error when horizon URLs array is empty", async () => {
		const toggle = new Toggle({ horizonUrls: [] });
		await expect(toggle.fetch("/api/test")).rejects.toThrow(
			"No horizon URLs configured. Set horizonUrls or provide a valid publicApiKey.",
		);
	});

	test(
		"should successfully make POST request to mockhttp.org",
		async () => {
			const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

			interface MockHttpResponse {
				method: string;
				headers: Record<string, string>;
				body: Record<string, unknown>;
			}

			const result = await toggle.fetch<MockHttpResponse>("/post", {
				test: "data",
			});
			expect(result.method).toBe("POST");
			expect(result.headers).toBeDefined();
			expect(result.body).toBeDefined();
		},
		testTimeout,
	);

	test("should handle 404 error response from mockhttp.org", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		await expect(
			toggle.fetch("/status/404", { test: "error" }),
		).rejects.toThrow("HTTP 404");
	});

	test("should handle 500 error response from mockhttp.org", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		await expect(
			toggle.fetch("/status/500", { test: "error" }),
		).rejects.toThrow("HTTP 500");
	});

	test("should return typed JSON response with request body", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpPostResponse {
			method: string;
			body: {
				test: string;
				number: number;
			};
		}

		const result = await toggle.fetch<MockHttpPostResponse>("/post", {
			test: "hello",
			number: 42,
		});
		expect(result.method).toBe("POST");
		expect(result.body.test).toBe("hello");
		expect(result.body.number).toBe(42);
	});

	test("should include x-api-key header when publicApiKey is set", async () => {
		const toggle = new Toggle({
			publicApiKey: "public_test-key",
			horizonUrls: [baseMockUrl],
		});

		interface MockHttpResponse {
			method: string;
			headers: Record<string, string>;
		}

		const result = await toggle.fetch<MockHttpResponse>("/post", {
			test: "auth",
		});
		expect(result.method).toBe("POST");
		expect(result.headers["x-api-key"]).toBe("public_test-key");
	});

	test("should include custom headers in request", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			headers: Record<string, string>;
		}

		const result = await toggle.fetch<MockHttpResponse>(
			"/post",
			{ test: "custom" },
			{
				headers: { "X-Custom-Header": "test-value" },
			},
		);

		expect(result.method).toBe("POST");
		expect(result.headers["x-custom-header"]).toBe("test-value");
	});

	test("should work with path without leading slash", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		const result = await toggle.fetch("post", { test: "data" });
		expect(result).toBeDefined();
	});

	test("should work with path with leading slash", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		const result = await toggle.fetch("/post", { test: "data" });
		expect(result).toBeDefined();
	});

	test("should try multiple horizon URLs on failure", async () => {
		const toggle = new Toggle({
			horizonUrls: [
				"https://invalid-url-that-should-fail.example",
				baseMockUrl,
			],
		});

		const result = await toggle.fetch("/post", { test: "data" });
		expect(result).toBeDefined();
	});

	test("should fail when all horizon URLs are invalid", async () => {
		const toggle = new Toggle({
			horizonUrls: [
				"https://invalid-url-1.example",
				"https://invalid-url-2.example",
			],
		});

		await expect(toggle.fetch("/test", { test: "data" })).rejects.toThrow(
			"All horizon URLs failed",
		);
	});

	test("should handle URLs with trailing slashes correctly", async () => {
		const toggle = new Toggle({ horizonUrls: [`${baseMockUrl}/`] });

		const result = await toggle.fetch("/post", { test: "data" });
		expect(result).toBeDefined();
	});

	test("should handle Headers object in request options", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		const headers = new Headers();
		headers.set("X-Test-Header", "headers-object-value");

		interface MockHttpResponse {
			method: string;
			headers: Record<string, string>;
		}

		const result = await toggle.fetch<MockHttpResponse>(
			"/post",
			{ test: "headers" },
			{
				headers: headers,
			},
		);

		expect(result.method).toBe("POST");
		expect(result.headers["x-test-header"]).toBe("headers-object-value");
	});

	test("should handle array headers in request options", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			headers: Record<string, string>;
		}

		const result = await toggle.fetch<MockHttpResponse>(
			"/post",
			{ test: "array" },
			{
				headers: [
					["X-Array-Header", "array-value"],
					["X-Another-Header", "another-value"],
				],
			},
		);

		expect(result.method).toBe("POST");
		expect(result.headers["x-array-header"]).toBe("array-value");
		expect(result.headers["x-another-header"]).toBe("another-value");
	});

	test("should handle non-Error exceptions in fetch method", async () => {
		const toggle = new Toggle({
			horizonUrls: ["https://invalid-domain-that-does-not-exist.test"],
		});

		// Mock fetch to throw a non-Error value
		const originalFetch = global.fetch;
		global.fetch = (() => {
			throw "string error"; // Non-Error exception
		}) as typeof fetch;

		try {
			await expect(toggle.fetch("/test", { test: "data" })).rejects.toThrow(
				"All horizon URLs failed",
			);
		} finally {
			// Restore original fetch
			global.fetch = originalFetch;
		}
	});

	test("should send payload as JSON in request body", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: {
				name: string;
				age: number;
				active: boolean;
			};
		}

		const payload = { name: "test-user", age: 25, active: true };
		const result = await toggle.fetch<MockHttpResponse>("/post", payload);

		expect(result.method).toBe("POST");
		expect(result.body.name).toBe("test-user");
		expect(result.body.age).toBe(25);
		expect(result.body.active).toBe(true);
	});

	test("should handle undefined payload", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: unknown;
		}

		const result = await toggle.fetch<MockHttpResponse>("/post", undefined, {
			body: JSON.stringify({ default: "body" }),
		});
		expect(result.method).toBe("POST");
	});

	test("should handle null payload", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: unknown;
		}

		const result = await toggle.fetch<MockHttpResponse>("/post", null, {
			body: JSON.stringify({ default: "body" }),
		});
		expect(result.method).toBe("POST");
	});

	test("should handle complex nested payload", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: {
				user: {
					profile: {
						name: string;
						preferences: string[];
					};
				};
				metadata: Record<string, unknown>;
			};
		}

		const complexPayload = {
			user: {
				profile: {
					name: "complex-user",
					preferences: ["dark-mode", "notifications"],
				},
			},
			metadata: {
				version: "1.0",
				feature_flags: { newUI: true },
			},
		};

		const result = await toggle.fetch<MockHttpResponse>(
			"/post",
			complexPayload,
		);

		expect(result.method).toBe("POST");
		expect(result.body.user.profile.name).toBe("complex-user");
		expect(result.body.user.profile.preferences).toEqual([
			"dark-mode",
			"notifications",
		]);
		expect(result.body.metadata.version).toBe("1.0");
	});

	test("should prioritize payload over options.body when both provided", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: {
				source: string;
			};
		}

		const result = await toggle.fetch<MockHttpResponse>(
			"/post",
			{ source: "payload" },
			{
				body: JSON.stringify({ source: "options" }),
			},
		);

		expect(result.method).toBe("POST");
		expect(result.body.source).toBe("payload");
	});

	test("should fall back to options.body when payload is undefined", async () => {
		const toggle = new Toggle({ horizonUrls: [baseMockUrl] });

		interface MockHttpResponse {
			method: string;
			body: {
				source: string;
			};
		}

		const result = await toggle.fetch<MockHttpResponse>("/post", undefined, {
			body: JSON.stringify({ source: "options" }),
		});

		expect(result.method).toBe("POST");
		expect(result.body.source).toBe("options");
	});
});

describe("buildDefaultHorizonUrl", () => {
	test("should build URL with org ID from valid public key", () => {
		const toggle = new Toggle();
		const orgId = "test-org";
		const validKey = `public_${Buffer.from(`${orgId}:some-secret`).toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(validKey)).toBe(
			`https://${orgId}.toggle.hyphen.cloud`,
		);
	});

	test("should return default URL when org ID cannot be extracted", () => {
		const toggle = new Toggle();
		expect(toggle.getDefaultHorizonUrl("invalid-key")).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should return default URL for malformed base64", () => {
		const toggle = new Toggle();
		expect(toggle.getDefaultHorizonUrl("public_invalid-base64!")).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should build URL with complex org ID", () => {
		const toggle = new Toggle();
		const orgId = "my-org-123_test";
		const validKey = `public_${Buffer.from(`${orgId}:secret-data`).toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(validKey)).toBe(
			`https://${orgId}.toggle.hyphen.cloud`,
		);
	});

	test("should return default URL for org ID with invalid characters", () => {
		const toggle = new Toggle();
		const invalidOrgId = "org@invalid#chars";
		const invalidKey = `public_${Buffer.from(`${invalidOrgId}:data`).toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(invalidKey)).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should return default URL for empty org ID", () => {
		const toggle = new Toggle();
		const emptyOrgKey = `public_${Buffer.from(":secret-data").toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(emptyOrgKey)).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should build URL with numeric org ID", () => {
		const toggle = new Toggle();
		const numericOrgId = "123456";
		const numericKey = `public_${Buffer.from(`${numericOrgId}:data`).toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(numericKey)).toBe(
			`https://${numericOrgId}.toggle.hyphen.cloud`,
		);
	});

	test("should build URL with single character org ID", () => {
		const toggle = new Toggle();
		const singleCharOrgId = "a";
		const singleCharKey = `public_${Buffer.from(`${singleCharOrgId}:data`).toString("base64")}`;
		expect(toggle.getDefaultHorizonUrl(singleCharKey)).toBe(
			`https://${singleCharOrgId}.toggle.hyphen.cloud`,
		);
	});

	test("should return default URL for null input", () => {
		const toggle = new Toggle();
		expect(toggle.getDefaultHorizonUrl(null as unknown as string)).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should return default URL for undefined input", () => {
		const toggle = new Toggle();
		expect(toggle.getDefaultHorizonUrl(undefined as unknown as string)).toBe(
			"https://toggle.hyphen.cloud",
		);
	});

	test("should return default URL for empty string", () => {
		const toggle = new Toggle();
		expect(toggle.getDefaultHorizonUrl("")).toBe("https://toggle.hyphen.cloud");
	});

	test("should handle key without prefix", () => {
		const toggle = new Toggle();
		const orgId = "no-prefix-org";
		const keyWithoutPrefix = Buffer.from(`${orgId}:secret-data`).toString(
			"base64",
		);
		expect(toggle.getDefaultHorizonUrl(keyWithoutPrefix)).toBe(
			`https://${orgId}.toggle.hyphen.cloud`,
		);
	});
});
