import { beforeEach, describe, expect, test, vi } from "vitest";
import { getExecutionContext } from "../src/execution-context.js";

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
		await expect(getExecutionContext("")).rejects.toThrow(
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

		const context = await getExecutionContext("test-api-key");

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

		await getExecutionContext("test-api-key", { organizationId: "org-456" });

		expect(mockState.getCalls[0][0]).toBe(
			"https://api.hyphen.ai/api/execution-context?organizationId=org-456",
		);
	});

	test("should use custom baseUri when provided", async () => {
		mockState.getResponse = {
			response: { status: 200 },
			data: { organization: { id: "org-789" } },
		};

		await getExecutionContext("test-api-key", {
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

		await expect(getExecutionContext("invalid-api-key")).rejects.toThrow(
			"Failed to get execution context: Unauthorized",
		);
	});
});
