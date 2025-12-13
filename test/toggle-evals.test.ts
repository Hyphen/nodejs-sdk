import process from "node:process";
import { describe, expect, test } from "vitest";
import { Toggle, type ToggleContext } from "../src/toggle.js";

/*
hyphen-sdk-boolean
hyphen-sdk-json
hyphen-sdk-number
hyphen-sdk-string
*/

try {
	process.loadEnvFile();
} catch {
	// .env file doesn't exist, skip silently
}

const hyphenPublicApiKey = process.env.HYPHEN_PUBLIC_API_KEY;
const hyphenApplicationId = process.env.HYPHEN_APPLICATION_ID;

const defaultTimeout = 10_000;

// check that we have values

if (!hyphenPublicApiKey || !hyphenApplicationId) {
	console.warn("You need HYPHEN_PUBLIC_API_KEY and HYPHEN_APPLICATION_ID");
}

const context: ToggleContext = {
	targetingKey: "user-123",
	ipAddress: "203.0.113.42",
	customAttributes: {
		subscriptionLevel: "premium",
		region: "us-east",
	},
	user: {
		id: "user-123",
		email: "john.doe@example.com",
		name: "John Doe",
		customAttributes: {
			role: "admin",
		},
	},
};

describe("Toggle Evaluations", () => {
	test(
		"Getting a string",
		async () => {
			const toggle = new Toggle();
			toggle.publicApiKey = hyphenPublicApiKey;
			toggle.applicationId = hyphenApplicationId;
			toggle.defaultContext = context;

			const result = await toggle.get<string>(
				"hyphen-sdk-string",
				"fake-default-value-123",
			);

			expect(result).toBe("Hyphen!");
		},
		defaultTimeout,
	);

	test(
		"getBoolean helper method",
		async () => {
			const toggle = new Toggle();
			toggle.publicApiKey = hyphenPublicApiKey;
			toggle.applicationId = hyphenApplicationId;
			toggle.defaultContext = context;

			const result = await toggle.getBoolean("hyphen-sdk-boolean", false);

			expect(typeof result).toBe("boolean");
			expect(result).toBe(true);
		},
		defaultTimeout,
	);

	test(
		"getString helper method",
		async () => {
			const toggle = new Toggle();
			toggle.publicApiKey = hyphenPublicApiKey;
			toggle.applicationId = hyphenApplicationId;
			toggle.defaultContext = context;

			const result = await toggle.getString(
				"hyphen-sdk-string",
				"default-string",
			);

			expect(typeof result).toBe("string");
			expect(result).toBe("Hyphen!");
		},
		defaultTimeout,
	);

	test(
		"getNumber helper method",
		async () => {
			const toggle = new Toggle();
			toggle.publicApiKey = hyphenPublicApiKey;
			toggle.applicationId = hyphenApplicationId;
			toggle.defaultContext = context;

			const result = await toggle.getNumber("hyphen-sdk-number", 0);

			expect(typeof result).toBe("number");
			expect(result).toBe(42);
		},
		defaultTimeout,
	);

	test(
		"getObject helper method",
		async () => {
			const toggle = new Toggle();
			toggle.publicApiKey = hyphenPublicApiKey;
			toggle.applicationId = hyphenApplicationId;
			toggle.defaultContext = context;

			const result = await toggle.getObject("hyphen-sdk-json", {});

			// The toggle returns a JSON string, so we expect a string type
			expect(typeof result).toBe("string");
			expect(result).toBe('{ "id": "Hello World!"}');

			// Verify it's valid JSON
			const parsed = JSON.parse(result as string);
			expect(parsed).toEqual({ id: "Hello World!" });
		},
		defaultTimeout,
	);

	describe("get method error handling", () => {
		test(
			"should return defaultValue when no publicApiKey is set",
			async () => {
				const toggle = new Toggle({
					applicationId: "test-app",
					defaultContext: { targetingKey: "test" },
				});

				const result = await toggle.get("test-toggle", "default-value");
				expect(result).toBe("default-value");
			},
			defaultTimeout,
		);

		test(
			"should return defaultValue when no defaultContext and no context option",
			async () => {
				const toggle = new Toggle({
					publicApiKey: "public_test-key",
					applicationId: "test-app",
				});

				const result = await toggle.get("test-toggle", "fallback");
				expect(result).toBe("fallback");
			},
			defaultTimeout,
		);

		test(
			"should return defaultValue when application is empty",
			async () => {
				const toggle = new Toggle({
					publicApiKey: "public_test-key",
					applicationId: "",
					defaultContext: { targetingKey: "test" },
				});

				const result = await toggle.get("test-toggle", "default");
				expect(result).toBe("default");
			},
			defaultTimeout,
		);

		test("should set targetingKey when context has no targetingKey", async () => {
			const toggle = new Toggle({
				publicApiKey: hyphenPublicApiKey,
				applicationId: hyphenApplicationId,
				defaultTargetKey: "fallback-key",
			});

			const result = await toggle.get("hyphen-sdk-string", "default", {
				context: { user: { id: "user-123" } },
			});

			expect(typeof result).toBe("string");
		});

		test("should handle fetch failures gracefully", async () => {
			const toggle = new Toggle({
				publicApiKey: "public_invalid-key",
				applicationId: "test-app",
				defaultContext: { targetingKey: "test" },
				horizonUrls: ["https://invalid-domain.test"],
			});

			const result = await toggle.get("test-toggle", "fallback-value");
			expect(result).toBe("fallback-value");
		});

		test("should handle missing toggle in response", async () => {
			const toggle = new Toggle({
				publicApiKey: hyphenPublicApiKey,
				applicationId: hyphenApplicationId,
				defaultContext: { targetingKey: "test" },
			});

			const result = await toggle.get("non-existent-toggle", "not-found");
			expect(result).toBe("not-found");
		});

		test("should use provided context with all properties", async () => {
			const toggle = new Toggle({
				publicApiKey: hyphenPublicApiKey,
				applicationId: hyphenApplicationId,
			});

			// This should trigger lines 244-247 (options?.context branch)
			const customContext: ToggleContext = {
				targetingKey: "custom-targeting",
				ipAddress: "192.168.1.1",
				user: { id: "custom-user", email: "test@example.com" },
				customAttributes: { role: "tester" },
			};

			const result = await toggle.get("hyphen-sdk-string", "default", {
				context: customContext,
			});

			expect(typeof result).toBe("string");
		});

		test("should handle application validation error", async () => {
			const toggle = new Toggle({
				publicApiKey: "public_test-key",
				applicationId: undefined, // This will cause validation to fail
				defaultContext: { targetingKey: "test" },
			});

			const result = await toggle.get("test-toggle", "validation-failed");
			expect(result).toBe("validation-failed");
		});

		test("should copy context properties correctly when no options.context", async () => {
			const toggle = new Toggle({
				publicApiKey: hyphenPublicApiKey,
				applicationId: hyphenApplicationId,
				defaultContext: {
					targetingKey: "default-targeting",
					ipAddress: "127.0.0.1",
					user: { id: "default-user" },
					customAttributes: { plan: "basic" },
				},
			});

			// This should trigger lines 249-252 (else branch, using defaultContext)
			const result = await toggle.get("hyphen-sdk-string", "default");
			expect(typeof result).toBe("string");
		});

		test("should handle application validation error when applicationId is empty", async () => {
			const toggle = new Toggle({
				publicApiKey: "public_test-key",
				applicationId: "", // This will cause validation to fail
				defaultContext: { targetingKey: "test" },
			});

			const result = await toggle.get("test-toggle", "validation-failed");
			expect(result).toBe("validation-failed");
		});

		test("should handle application validation error when applicationId is undefined", async () => {
			const toggle = new Toggle({
				publicApiKey: "public_test-key",
				// No applicationId provided, will be undefined -> ""
				defaultContext: { targetingKey: "test" },
			});

			const result = await toggle.get("test-toggle", "validation-failed");
			expect(result).toBe("validation-failed");
		});
	});
});
