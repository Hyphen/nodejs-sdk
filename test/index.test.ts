import { describe, expect, test } from "vitest";
import { Env, Toggle } from "../src/index.js";

describe("Hyphen sdk", () => {
	test("should create an instance of Toggle", () => {
		const toggle = new Toggle({
			applicationId: "my-app",
			publicApiKey: "public_my-public-key",
			environment: "development",
		});
		expect(toggle).toBeInstanceOf(Toggle);
	});

	test("should export the ENV service", () => {
		const env = new Env({ apiKey: "test-api-key" });
		expect(env).toBeInstanceOf(Env);
	});
});
