import process from "node:process";
import { describe, expect, test } from "vitest";
import { ErrorMessages } from "../src/base-service.js";
import { NetInfo } from "../src/net-info.js";

const validIpAddresses = ["1.1.1.1", "8.8.8.8", "2.2.2.2"];

const invalidIpAddresses = ["256.256.256.256", "123.456.789.0"];

const mixedIpAddresses = [...validIpAddresses, ...invalidIpAddresses];

const testTimeout = 10_000;

describe("NetInfo", () => {
	test("should create an instance of NetInfo", () => {
		const netInfo = new NetInfo();
		expect(netInfo).toBeInstanceOf(NetInfo);
	});

	test("should have default properties", () => {
		const netInfo = new NetInfo();
		expect(netInfo.log).toBeDefined();
		expect(netInfo.cache).toBeDefined();
		expect(netInfo.throwErrors).toBe(false);
	});

	test("should allow setting and getting apiKey", () => {
		const netInfo = new NetInfo({ apiKey: "test_api_key1" });
		expect(netInfo.apiKey).toBe("test_api_key1");
		netInfo.apiKey = "test_api_key2";
		expect(netInfo.apiKey).toBe("test_api_key2");
	});

	test("should allow setting and getting baseUri", () => {
		const netInfo = new NetInfo({ baseUri: "https://example.com" });
		expect(netInfo.baseUri).toBe("https://example.com");
		netInfo.baseUri = "https://another-example.com";
		expect(netInfo.baseUri).toBe("https://another-example.com");
	});

	test("should throw an error if apiKey is not set", () => {
		// Ensure that the environment variable is not set for this test
		const originalApiKey = process.env.HYPHEN_API_KEY;
		delete process.env.HYPHEN_API_KEY;
		let didThrow = false;
		try {
			new NetInfo({ throwErrors: true });
		} catch (error) {
			expect(error).toEqual(new Error(ErrorMessages.API_KEY_REQUIRED));
			didThrow = true;
		}

		expect(didThrow).toBe(true);

		// Restore the original environment variable
		if (originalApiKey) {
			process.env.HYPHEN_API_KEY = originalApiKey;
		}
	});

	test("should throw an error if apiKey is set to public api key", () => {
		// Ensure that the environment variable is not set for this test
		const originalApiKey = process.env.HYPHEN_API_KEY;
		delete process.env.HYPHEN_API_KEY;
		let didThrow = false;
		try {
			new NetInfo({
				throwErrors: true,
				apiKey: "public_api_key",
			});
		} catch (error) {
			expect(error).toEqual(
				new Error(ErrorMessages.PUBLIC_API_KEY_SHOULD_NOT_BE_USED),
			);
			didThrow = true;
		}

		expect(didThrow).toBe(true);

		// Restore the original environment variable
		if (originalApiKey) {
			process.env.HYPHEN_API_KEY = originalApiKey;
		}
	});

	test("should fail to fetch IP info without API key", async () => {
		// Ensure that the environment variable is not set for this test
		const originalApiKey = process.env.HYPHEN_API_KEY;
		delete process.env.HYPHEN_API_KEY;
		let didThrow = false;
		try {
			const netInfo = new NetInfo({ throwErrors: true });
			netInfo.apiKey = undefined; // Explicitly set apiKey to undefined
			await netInfo.getIpInfo("1.1.1.1");
		} catch (error) {
			expect(error).toEqual(new Error(ErrorMessages.API_KEY_REQUIRED));
			didThrow = true;
		}

		expect(didThrow).toBe(true);
		// Restore the original environment variable
		if (originalApiKey) {
			process.env.HYPHEN_API_KEY = originalApiKey;
		}
	});

	test(
		"should fetch IP info failure",
		async () => {
			// API key should be set in the environment variable HYPHEN_API_KEY
			const netInfo = new NetInfo();
			const invalidIpAddress =
				invalidIpAddresses[
					Math.floor(Math.random() * invalidIpAddresses.length)
				];
			const ipInfo = await netInfo.getIpInfo(invalidIpAddress);
			expect(ipInfo).toBeDefined();
			expect(ipInfo).toHaveProperty("ip", invalidIpAddress);
			expect(ipInfo).toHaveProperty("type");
		},
		testTimeout,
	);

	test("should fetch IP info successfully", async () => {
		// API key should be set in the environment variable HYPHEN_API_KEY
		const netInfo = new NetInfo();
		const validIpAddress =
			validIpAddresses[Math.floor(Math.random() * validIpAddresses.length)];
		const ipInfo = await netInfo.getIpInfo(validIpAddress);
		expect(ipInfo).toBeDefined();
		expect(ipInfo).toHaveProperty("ip", validIpAddress);
		expect(ipInfo).toHaveProperty("location");
	});

	test("should fetch multiple IP infos successfully", async () => {
		// API key should be set in the environment variable HYPHEN_API_KEY
		const netInfo = new NetInfo();
		const ipInfos = await netInfo.getIpInfos(mixedIpAddresses);
		expect(ipInfos).toBeDefined();
		expect(ipInfos.length).toBe(mixedIpAddresses.length);
		for (const [index, ipInfo] of ipInfos.entries()) {
			if (validIpAddresses.includes(mixedIpAddresses[index])) {
				expect(ipInfo).toHaveProperty("ip", mixedIpAddresses[index]);
				expect(ipInfo).toHaveProperty("location");
			} else {
				expect(ipInfo).toHaveProperty("type");
			}
		}
	});

	test("should handle empty IP array gracefully", async () => {
		const netInfo = new NetInfo();
		const ipInfos = await netInfo.getIpInfos([]);
		expect(ipInfos).toBeDefined();
		expect(ipInfos.length).toBe(0);
	});
});
