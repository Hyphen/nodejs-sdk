import process from "node:process";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExecutionContext } from "../src/execution-context.js";

const testTimeout = 10_000;

// Shared mock state that can be configured per test
const mockState: {
	getResponse: {
		response: { status: number; statusText?: string };
		data: Record<string, unknown> | null;
	};
	getCalls: Array<[string, unknown]>;
} = {
	getResponse: {
		response: { status: 200 },
		data: { organization: { id: "default-org" } },
	},
	getCalls: [],
};

// Mock for CacheableNet
vi.mock("@cacheable/net", () => {
	return {
		CacheableNet: class MockCacheableNet {
			async get(url: string, config: unknown) {
				mockState.getCalls.push([url, config]);
				return mockState.getResponse;
			}
		},
	};
});

describe("getExecutionContext", () => {
	beforeEach(() => {
		// Reset mock state before each test
		mockState.getResponse = {
			response: { status: 200 },
			data: { organization: { id: "default-org" } },
		};
		mockState.getCalls = [];
	});

	test("should throw an error if apiKey is not provided", async () => {
		await expect(getExecutionContext({ apiKey: "" })).rejects.toThrow(
			"API key is required",
		);
	});

	test("should fetch execution context successfully with mocked response", async () => {
		mockState.getResponse = {
			response: { status: 200 },
			data: {
				organization: { id: "org-123", name: "Test Org" },
				user: { id: "user-123", name: "Test User" },
			},
		};

		const context = await getExecutionContext({ apiKey: "test-api-key" });

		expect(context).toBeDefined();
		expect(context.organization).toEqual({ id: "org-123", name: "Test Org" });
		expect(context.user).toEqual({ id: "user-123", name: "Test User" });
		expect(mockState.getCalls.length).toBe(1);
		expect(mockState.getCalls[0][0]).toBe(
			"https://api.hyphen.ai/api/execution-context",
		);
		const callConfig = mockState.getCalls[0][1] as {
			headers: Record<string, string>;
		};
		expect(callConfig.headers["x-api-key"]).toBe("test-api-key");
		expect(callConfig.headers["content-type"]).toBe("application/json");
		expect(callConfig.headers.accept).toBe("application/json");
	});

	test("should include organizationId in URL when provided", async () => {
		mockState.getResponse = {
			response: { status: 200 },
			data: { organization: { id: "org-456" } },
		};

		await getExecutionContext({
			apiKey: "test-api-key",
			organizationId: "org-456",
		});

		expect(mockState.getCalls[0][0]).toBe(
			"https://api.hyphen.ai/api/execution-context?organizationId=org-456",
		);
	});

	test("should use custom baseUri when provided", async () => {
		mockState.getResponse = {
			response: { status: 200 },
			data: { organization: { id: "org-789" } },
		};

		await getExecutionContext({
			apiKey: "test-api-key",
			baseUri: "https://custom.api.com",
		});

		expect(mockState.getCalls[0][0]).toBe(
			"https://custom.api.com/api/execution-context",
		);
	});

	test("should throw an error when response status is not 200", async () => {
		mockState.getResponse = {
			response: { status: 401, statusText: "Unauthorized" },
			data: null,
		};

		await expect(
			getExecutionContext({ apiKey: "invalid-api-key" }),
		).rejects.toThrow("Failed to get execution context: Unauthorized");
	});

	test(
		"should fetch execution context successfully (integration)",
		async () => {
			const apiKey = process.env.HYPHEN_API_KEY;
			if (!apiKey) {
				console.log("Skipping test: HYPHEN_API_KEY not set");
				return;
			}

			mockState.getResponse = {
				response: { status: 200 },
				data: { organization: { id: "integration-org" } },
			};

			const context = await getExecutionContext({ apiKey });
			expect(context).toBeDefined();
			expect(context).toHaveProperty("organization");
		},
		testTimeout,
	);

	test(
		"should fetch execution context with organizationId (integration)",
		async () => {
			const apiKey = process.env.HYPHEN_API_KEY;
			const organizationId = process.env.HYPHEN_ORGANIZATION_ID;
			if (!apiKey) {
				console.log("Skipping test: HYPHEN_API_KEY not set");
				return;
			}

			mockState.getResponse = {
				response: { status: 200 },
				data: { organization: { id: organizationId ?? "default-org" } },
			};

			const context = await getExecutionContext({
				apiKey,
				organizationId,
			});
			expect(context).toBeDefined();
			expect(context).toHaveProperty("organization");
		},
		testTimeout,
	);

	test(
		"should allow custom baseUri (integration)",
		async () => {
			const apiKey = process.env.HYPHEN_API_KEY;
			if (!apiKey) {
				console.log("Skipping test: HYPHEN_API_KEY not set");
				return;
			}

			mockState.getResponse = {
				response: { status: 200 },
				data: { organization: { id: "custom-uri-org" } },
			};

			const context = await getExecutionContext({
				apiKey,
				baseUri: "https://api.hyphen.ai",
			});
			expect(context).toBeDefined();
			expect(context).toHaveProperty("organization");
		},
		testTimeout,
	);

	test(
		"should throw an error for invalid API key (integration)",
		async () => {
			mockState.getResponse = {
				response: { status: 401, statusText: "Unauthorized" },
				data: null,
			};

			await expect(
				getExecutionContext({ apiKey: "invalid_api_key" }),
			).rejects.toThrow();
		},
		testTimeout,
	);
});
