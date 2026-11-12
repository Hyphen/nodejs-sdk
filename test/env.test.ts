import process from "node:process";
import { describe, expect, test } from "vitest";
import { env, loadEnv } from "../src/env.js";

describe("ENV", () => {
	test("should be able to load the environment", () => {
		loadEnv();
		expect(process.env.HYPHEN_PUBLIC_API_KEY).toBeDefined();
		expect(process.env.HYPHEN_APPLICATION_ID).toBeDefined();
	});

	test("should be able to load multiple environments", () => {
		loadEnv({ path: "./test/fixtures/env-file-load" });
		expect(process.env.KEY_ID).toBe("default_key_id");
	});

	test("should be able to load multiple environments not local", () => {
		delete process.env.KEY_ID;
		expect(process.env.KEY_ID).toBeUndefined();
		loadEnv({
			path: "./test/fixtures/env-file-load",
			environment: "development",
			local: false,
		});
		expect(process.env.KEY_ID).toBe("development_key_id");
	});

	test("should be able to load multiple environments and local", () => {
		delete process.env.KEY_ID;
		expect(process.env.KEY_ID).toBeUndefined();
		loadEnv({
			path: "./test/fixtures/env-file-load",
			environment: "development",
		});
		expect(process.env.KEY_ID).toBe("development_key_id_local");
	});

	test("should be able to load the environment with env", () => {
		env();
		expect(process.env.HYPHEN_PUBLIC_API_KEY).toBeDefined();
		expect(process.env.HYPHEN_APPLICATION_ID).toBeDefined();
	});

	test("should be able to load multiple environments with env", () => {
		env({ path: "./test/fixtures/env-file-load" });
		expect(process.env.KEY_ID).toBe("default_key_id");
	});

	test("should be able to load multiple environments not local with env", () => {
		delete process.env.KEY_ID;
		expect(process.env.KEY_ID).toBeUndefined();
		env({
			path: "./test/fixtures/env-file-load",
			environment: "development",
			local: false,
		});
		expect(process.env.KEY_ID).toBe("development_key_id");
	});

	test("should be able to load multiple environments and local with env", () => {
		delete process.env.KEY_ID;
		expect(process.env.KEY_ID).toBeUndefined();
		env({ path: "./test/fixtures/env-file-load", environment: "development" });
		expect(process.env.KEY_ID).toBe("development_key_id_local");
	});
});
