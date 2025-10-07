import { describe, expect, test } from "vitest";
import { Toggle, type ToggleOptions } from "../src/toggle.js";
import { getRandomToggleContext, mockToggleContexts } from "./mock-contexts.js";

describe("Hyphen sdk", () => {
	test("should create an instance of Toggle", () => {
		const toggle = new Toggle();
		expect(toggle).toBeInstanceOf(Toggle);
	});

	describe("constructor", () => {
		test("should create Toggle with no options", () => {
			const toggle = new Toggle();
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.publicApiKey).toBeUndefined();
			expect(toggle.defaultContext).toBeUndefined();
		});

		test("should create Toggle with undefined options", () => {
			const toggle = new Toggle(undefined);
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.publicApiKey).toBeUndefined();
			expect(toggle.defaultContext).toBeUndefined();
		});

		test("should create Toggle with empty options object", () => {
			const options: ToggleOptions = {};
			const toggle = new Toggle(options);
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.publicApiKey).toBeUndefined();
			expect(toggle.defaultContext).toBeUndefined();
		});

		test("should create Toggle with defaultContext option", () => {
			const customContext = getRandomToggleContext();
			const options: ToggleOptions = {
				defaultContext: customContext,
			};
			const toggle = new Toggle(options);
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.defaultContext).toBe(customContext);
			expect(toggle.defaultContext?.targetingKey).toBe(
				customContext.targetingKey,
			);
			expect(toggle.defaultContext?.ipAddress).toBe(customContext.ipAddress);
			expect(toggle.publicApiKey).toBeUndefined();
		});

		test("should create Toggle with publicApiKey option", () => {
			const options: ToggleOptions = {
				publicApiKey: "public_test-api-key",
			};
			const toggle = new Toggle(options);
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.publicApiKey).toBe("public_test-api-key");
			expect(toggle.defaultContext).toBeUndefined();
		});

		test("should create Toggle with both defaultContext and publicApiKey options", () => {
			const customContext = getRandomToggleContext();
			const options: ToggleOptions = {
				defaultContext: customContext,
				publicApiKey: "public_comprehensive-key",
			};
			const toggle = new Toggle(options);
			expect(toggle).toBeInstanceOf(Toggle);
			expect(toggle.publicApiKey).toBe("public_comprehensive-key");
			expect(toggle.defaultContext).toBe(customContext);
			expect(toggle.defaultContext?.targetingKey).toBe(
				customContext.targetingKey,
			);
			expect(toggle.defaultContext?.user?.email).toBe(
				customContext.user?.email,
			);
		});

		test("should not validate publicApiKey in constructor", () => {
			const options: ToggleOptions = {
				publicApiKey: "invalid-key-without-prefix",
			};
			expect(() => {
				new Toggle(options);
			}).not.toThrow();
			const toggle = new Toggle(options);
			expect(toggle.publicApiKey).toBe("invalid-key-without-prefix");
		});
	});

	describe("publicApiKey property", () => {
		test("should return undefined by default", () => {
			const toggle = new Toggle();
			expect(toggle.publicApiKey).toBeUndefined();
		});

		test("should allow getting the publicApiKey property", () => {
			const toggle = new Toggle();
			const apiKey = toggle.publicApiKey;
			expect(apiKey).toBeUndefined();
		});

		test("should allow setting the publicApiKey property", () => {
			const toggle = new Toggle();
			const testApiKey = "public_test-api-key-123";
			toggle.publicApiKey = testApiKey;
			expect(toggle.publicApiKey).toBe(testApiKey);
		});

		test("should allow setting publicApiKey to undefined", () => {
			const toggle = new Toggle();
			toggle.publicApiKey = "public_test-key";
			toggle.publicApiKey = undefined;
			expect(toggle.publicApiKey).toBeUndefined();
		});

		test("should maintain the same publicApiKey value when accessed multiple times", () => {
			const toggle = new Toggle();
			const testApiKey = "public_consistent-api-key";
			toggle.publicApiKey = testApiKey;
			const key1 = toggle.publicApiKey;
			const key2 = toggle.publicApiKey;
			expect(key1).toBe(key2);
			expect(key1).toBe(testApiKey);
		});

		test("should update publicApiKey property when set to a new value", () => {
			const toggle = new Toggle();
			const originalKey = "public_original-key";
			const newKey = "public_new-key";
			toggle.publicApiKey = originalKey;
			expect(toggle.publicApiKey).toBe(originalKey);
			toggle.publicApiKey = newKey;
			expect(toggle.publicApiKey).toBe(newKey);
			expect(toggle.publicApiKey).not.toBe(originalKey);
		});

		test("should throw error when publicApiKey does not start with 'public_'", () => {
			const toggle = new Toggle();
			expect(() => {
				toggle.publicApiKey = "invalid-key";
			}).toThrow("Public API key must start with 'public_'");
		});

		test("should throw error when publicApiKey starts with different prefix", () => {
			const toggle = new Toggle();
			expect(() => {
				toggle.publicApiKey = "private_some-key";
			}).toThrow("Public API key must start with 'public_'");
		});

		test("should throw error when publicApiKey is empty string", () => {
			const toggle = new Toggle();
			expect(() => {
				toggle.publicApiKey = "";
			}).toThrow("Public API key must start with 'public_'");
		});

		test("should accept publicApiKey that starts with 'public_'", () => {
			const toggle = new Toggle();
			const validKey = "public_valid-key-123";
			expect(() => {
				toggle.publicApiKey = validKey;
			}).not.toThrow();
			expect(toggle.publicApiKey).toBe(validKey);
		});

		test("should accept undefined publicApiKey without throwing", () => {
			const toggle = new Toggle();
			expect(() => {
				toggle.publicApiKey = undefined;
			}).not.toThrow();
			expect(toggle.publicApiKey).toBeUndefined();
		});
	});

	describe("defaultContext property", () => {
		test("should return undefined when no defaultContext is set", () => {
			const toggle = new Toggle();
			const context = toggle.defaultContext;
			expect(context).toBeUndefined();
		});

		test("should allow getting the defaultContext property", () => {
			const toggle = new Toggle();
			const context = toggle.defaultContext;
			expect(context).toBeUndefined();
		});

		test("should allow setting the defaultContext property", () => {
			const toggle = new Toggle();
			const customContext = getRandomToggleContext();
			toggle.defaultContext = customContext;
			expect(toggle.defaultContext).toBe(customContext);
			expect(toggle.defaultContext?.targetingKey).toBe(
				customContext.targetingKey,
			);
			expect(toggle.defaultContext?.ipAddress).toBe(customContext.ipAddress);
		});

		test("should maintain the same defaultContext when accessed multiple times", () => {
			const toggle = new Toggle();
			const customContext = getRandomToggleContext();
			toggle.defaultContext = customContext;
			const context1 = toggle.defaultContext;
			const context2 = toggle.defaultContext;
			expect(context1).toBe(context2);
		});

		test("should update defaultContext property when set to a new value", () => {
			const toggle = new Toggle();
			const originalContext = toggle.defaultContext; // undefined
			const newContext = getRandomToggleContext();
			toggle.defaultContext = newContext;
			expect(toggle.defaultContext).not.toBe(originalContext);
			expect(toggle.defaultContext).toBe(newContext);
			expect(toggle.defaultContext?.targetingKey).toBe(newContext.targetingKey);
		});

		test("should handle complex defaultContext with all properties", () => {
			const toggle = new Toggle();
			// Using specific index for edge case user to test complex nested data structures
			const complexContext = mockToggleContexts[9];
			toggle.defaultContext = complexContext;
			expect(toggle.defaultContext).toBe(complexContext);
			expect(toggle.defaultContext?.user?.customAttributes?.tags).toEqual([
				"vip",
				"beta-tester",
				"early-adopter",
			]);
			expect(toggle.defaultContext?.customAttributes?.complexData).toEqual({
				nested: {
					value: "deep-nested-value",
					array: [1, 2, 3],
				},
			});
		});
	});

	describe("horizonUrls property", () => {
		test("should return default url", () => {
			const toggle = new Toggle();
			expect(toggle.horizonUrls).toEqual(["https://toggle.hyphen.cloud"]);
		});

		test("should be set when constructor receives horizonUrls option", () => {
			const testUrls = [
				"https://org1.toggle.hyphen.cloud",
				"https://org2.toggle.hyphen.cloud",
			];
			const toggle = new Toggle({ horizonUrls: testUrls });
			expect(toggle.horizonUrls).toEqual(testUrls);
		});

		test("should remain empty when constructor receives no horizonUrls", () => {
			const toggle = new Toggle({ publicApiKey: "public_test-key" });
			expect(toggle.horizonUrls).toEqual(["https://toggle.hyphen.cloud"]);
		});

		test("should allow getting the horizonUrls property", () => {
			const toggle = new Toggle();
			const urls = toggle.horizonUrls;
			expect(urls).toEqual(["https://toggle.hyphen.cloud"]);
			expect(Array.isArray(urls)).toBe(true);
		});

		test("should allow setting the horizonUrls property", () => {
			const toggle = new Toggle();
			const testUrls = ["https://test.toggle.hyphen.cloud"];
			toggle.horizonUrls = testUrls;
			expect(toggle.horizonUrls).toEqual(testUrls);
		});

		test("should allow setting horizonUrls to empty array", () => {
			const toggle = new Toggle();
			const testUrls = ["https://test.toggle.hyphen.cloud"];
			toggle.horizonUrls = testUrls;
			toggle.horizonUrls = [];
			expect(toggle.horizonUrls).toEqual([]);
		});

		test("should maintain the same horizonUrls array when accessed multiple times", () => {
			const toggle = new Toggle();
			const testUrls = [
				"https://endpoint1.hyphen.cloud",
				"https://endpoint2.hyphen.cloud",
			];
			toggle.horizonUrls = testUrls;
			const urls1 = toggle.horizonUrls;
			const urls2 = toggle.horizonUrls;
			expect(urls1).toBe(urls2);
			expect(urls1).toEqual(testUrls);
		});

		test("should update horizonUrls property when set to a new array", () => {
			const toggle = new Toggle();
			const originalUrls = ["https://original.hyphen.cloud"];
			const newUrls = [
				"https://new1.hyphen.cloud",
				"https://new2.hyphen.cloud",
			];
			toggle.horizonUrls = originalUrls;
			expect(toggle.horizonUrls).toEqual(originalUrls);
			toggle.horizonUrls = newUrls;
			expect(toggle.horizonUrls).toEqual(newUrls);
			expect(toggle.horizonUrls).not.toEqual(originalUrls);
		});

		test("should handle single URL in array", () => {
			const toggle = new Toggle();
			const singleUrl = ["https://single.toggle.hyphen.cloud"];
			toggle.horizonUrls = singleUrl;
			expect(toggle.horizonUrls).toEqual(singleUrl);
			expect(toggle.horizonUrls.length).toBe(1);
		});

		test("should handle multiple URLs with different formats", () => {
			const toggle = new Toggle();
			const mixedUrls = [
				"https://prod.toggle.hyphen.cloud",
				"http://staging.toggle.hyphen.cloud",
				"https://org-123.toggle.hyphen.cloud",
				"https://api.custom-domain.com/toggle",
			];
			toggle.horizonUrls = mixedUrls;
			expect(toggle.horizonUrls).toEqual(mixedUrls);
			expect(toggle.horizonUrls.length).toBe(4);
		});

		test("should handle very large URL array", () => {
			const toggle = new Toggle();
			const largeUrlArray = Array.from(
				{ length: 100 },
				(_, i) => `https://endpoint-${i}.toggle.hyphen.cloud`,
			);
			toggle.horizonUrls = largeUrlArray;
			expect(toggle.horizonUrls).toEqual(largeUrlArray);
			expect(toggle.horizonUrls.length).toBe(100);
		});

		test("should not interfere with other properties", () => {
			const testOrgId = "test-org";
			const validKey = `public_${Buffer.from(`${testOrgId}:some-secret`).toString("base64")}`;
			const toggle = new Toggle({ publicApiKey: validKey });
			const testUrls = ["https://test.hyphen.cloud"];
			const testContext = getRandomToggleContext();

			toggle.horizonUrls = testUrls;
			toggle.defaultContext = testContext;

			expect(toggle.horizonUrls).toEqual(testUrls);
			expect(toggle.defaultContext).toBe(testContext);
			expect(toggle.organizationId).toBe(testOrgId);
		});

		test("should work with constructor containing all options", () => {
			const testUrls = [
				"https://primary.toggle.hyphen.cloud",
				"https://secondary.toggle.hyphen.cloud",
			];
			const testContext = getRandomToggleContext();
			const toggle = new Toggle({
				publicApiKey: "public_test-comprehensive-key",
				defaultContext: testContext,
				horizonUrls: testUrls,
			});

			expect(toggle.horizonUrls).toEqual(testUrls);
			expect(toggle.defaultContext).toBe(testContext);
			expect(toggle.publicApiKey).toBe("public_test-comprehensive-key");
		});

		test("should handle URLs with query parameters and paths", () => {
			const toggle = new Toggle();
			const complexUrls = [
				"https://api.hyphen.cloud/v1/toggle?version=latest",
				"https://cdn.hyphen.cloud/toggle/endpoint",
				"https://backup.hyphen.cloud:8443/api/toggle",
			];
			toggle.horizonUrls = complexUrls;
			expect(toggle.horizonUrls).toEqual(complexUrls);
		});
	});

	describe("applicationId property", () => {
		test("should return undefined by default", () => {
			const toggle = new Toggle();
			expect(toggle.applicationId).toBeUndefined();
		});

		test("should be set when constructor receives applicationId option", () => {
			const toggle = new Toggle({ applicationId: "test-app" });
			expect(toggle.applicationId).toBe("test-app");
		});

		test("should allow getting the applicationId property", () => {
			const toggle = new Toggle();
			const appId = toggle.applicationId;
			expect(appId).toBeUndefined();
		});

		test("should allow setting the applicationId property", () => {
			const toggle = new Toggle();
			const testAppId = "my-application";
			toggle.applicationId = testAppId;
			expect(toggle.applicationId).toBe(testAppId);
		});

		test("should allow setting applicationId to undefined", () => {
			const toggle = new Toggle();
			toggle.applicationId = "test-app";
			toggle.applicationId = undefined;
			expect(toggle.applicationId).toBeUndefined();
		});
	});

	describe("defaultTargetingKey property", () => {
		test("should generate random key by default", () => {
			const toggle = new Toggle();
			expect(toggle.defaultTargetingKey).toBeDefined();
			expect(typeof toggle.defaultTargetingKey).toBe("string");
			expect(toggle.defaultTargetingKey.length).toBeGreaterThan(0);
		});

		test("should be set when constructor receives defaultTargetKey option", () => {
			const toggle = new Toggle({
				defaultTargetKey: "explicit-key",
			});
			expect(toggle.defaultTargetingKey).toBe("explicit-key");
		});

		test("should be set from defaultContext with targetingKey", () => {
			const toggle = new Toggle({
				defaultContext: { targetingKey: "context-key" },
			});
			expect(toggle.defaultTargetingKey).toBe("context-key");
		});

		test("should be set from defaultContext with user.id", () => {
			const toggle = new Toggle({
				defaultContext: {
					user: { id: "user-123" },
				},
			});
			expect(toggle.defaultTargetingKey).toBe("user-123");
		});

		test("should generate key with applicationId and environment when no context", () => {
			const toggle = new Toggle({
				applicationId: "test-app",
				environment: "production",
			});
			expect(toggle.defaultTargetingKey).toMatch(
				/^test-app-production-[a-z0-9]+$/,
			);
		});

		test("should prefer defaultTargetKey option over defaultContext", () => {
			const toggle = new Toggle({
				defaultTargetKey: "explicit-key",
				defaultContext: {
					targetingKey: "context-key",
				},
			});
			expect(toggle.defaultTargetingKey).toBe("explicit-key");
		});

		test("should prefer targetingKey over user.id in context", () => {
			const toggle = new Toggle({
				defaultContext: {
					targetingKey: "targeting-key",
					user: { id: "user-123" },
				},
			});
			expect(toggle.defaultTargetingKey).toBe("targeting-key");
		});

		test("should allow setting defaultTargetingKey property", () => {
			const toggle = new Toggle();
			const originalKey = toggle.defaultTargetingKey;
			toggle.defaultTargetingKey = "custom-key";
			expect(toggle.defaultTargetingKey).toBe("custom-key");
			expect(toggle.defaultTargetingKey).not.toBe(originalKey);
		});

		test("should generate different keys for different instances", () => {
			const toggle1 = new Toggle();
			const toggle2 = new Toggle();
			expect(toggle1.defaultTargetingKey).not.toBe(toggle2.defaultTargetingKey);
		});

		test("should generate key with applicationId and default environment", () => {
			const toggle = new Toggle({
				applicationId: "test-app",
			});
			expect(toggle.defaultTargetingKey).toMatch(
				/^test-app-development-[a-z0-9]+$/,
			);
		});

		test("should generate key with environment only", () => {
			const toggle = new Toggle({
				environment: "staging",
			});
			expect(toggle.defaultTargetingKey).toMatch(/^staging-[a-z0-9]+$/);
		});

		test("should fall back to getTargetingKey when defaultContext returns to default", () => {
			const toggle = new Toggle({
				defaultContext: {},
			});
			expect(toggle.defaultTargetingKey).toBeDefined();
			expect(typeof toggle.defaultTargetingKey).toBe("string");
		});

		test("should generate key with environment when no applicationId", () => {
			const toggle = new Toggle();
			// This triggers generateTargetKey() since no defaultContext is provided
			expect(toggle.defaultTargetingKey).toMatch(/^development-[a-z0-9]+$/);
		});

		test("should handle empty string values in key generation", () => {
			const toggle = new Toggle({
				applicationId: "",
				environment: "",
			});
			// Empty environment defaults to "development", empty app is filtered out
			expect(toggle.defaultTargetingKey).toMatch(/^development-[a-z0-9]+$/);
		});

		test("should generate key when environment is explicitly set to empty", () => {
			const toggle = new Toggle({
				applicationId: "test-app",
				environment: "",
			});
			// Empty environment defaults to "development"
			expect(toggle.defaultTargetingKey).toMatch(
				/^test-app-development-[a-z0-9]+$/,
			);
		});

		test("should handle environment set to undefined after construction", () => {
			const toggle = new Toggle({
				applicationId: "test-app",
			});

			// Set environment to undefined to trigger the fallback branch
			toggle.environment = undefined;

			// Set a new defaultContext to trigger regeneration via getTargetingKey
			toggle.defaultContext = {};

			// This should eventually trigger generateTargetKey with undefined environment
			expect(toggle.defaultTargetingKey).toBeDefined();
			expect(typeof toggle.defaultTargetingKey).toBe("string");
		});
	});

	describe("environment property", () => {
		test("should return 'development' by default", () => {
			const toggle = new Toggle();
			expect(toggle.environment).toBe("development");
		});

		test("should be set when constructor receives environment option", () => {
			const toggle = new Toggle({ environment: "production" });
			expect(toggle.environment).toBe("production");
		});

		test("should allow getting the environment property", () => {
			const toggle = new Toggle();
			const env = toggle.environment;
			expect(env).toBe("development");
		});

		test("should allow setting the environment property", () => {
			const toggle = new Toggle();
			const testEnv = "staging";
			toggle.environment = testEnv;
			expect(toggle.environment).toBe(testEnv);
		});

		test("should allow setting environment to undefined", () => {
			const toggle = new Toggle();
			toggle.environment = "production";
			toggle.environment = undefined;
			expect(toggle.environment).toBeUndefined();
		});
	});

	describe("organizationId property", () => {
		test("should return undefined by default", () => {
			const toggle = new Toggle();
			expect(toggle.organizationId).toBeUndefined();
		});

		test("should be set when constructor receives valid publicApiKey", () => {
			const orgId = "test-org";
			const validKey = `public_${Buffer.from(`${orgId}:some-secret`).toString("base64")}`;
			const toggle = new Toggle({ publicApiKey: validKey });
			expect(toggle.organizationId).toBe(orgId);
		});

		test("should remain undefined when constructor receives invalid publicApiKey", () => {
			const toggle = new Toggle({ publicApiKey: "invalid-key" });
			expect(toggle.organizationId).toBeUndefined();
		});

		test("should allow getting the organizationId property", () => {
			const toggle = new Toggle();
			const orgId = toggle.organizationId;
			expect(orgId).toBeUndefined();
		});

		test("should maintain the same organizationId value when accessed multiple times", () => {
			const testOrgId = "consistent-org-id";
			const validKey = `public_${Buffer.from(`${testOrgId}:some-secret`).toString("base64")}`;
			const toggle = new Toggle({ publicApiKey: validKey });
			const orgId1 = toggle.organizationId;
			const orgId2 = toggle.organizationId;
			expect(orgId1).toBe(orgId2);
			expect(orgId1).toBe(testOrgId);
		});
	});

	describe("get method", () => {
		test("should return defaultValue when error occurs", async () => {
			const toggle = new Toggle({
				horizonUrls: ["https://api.test.com"],
			});

			const result = await toggle.get("feature-flag", false);
			expect(result).toBe(false); // Returns defaultValue when error occurs
		});
	});
});
