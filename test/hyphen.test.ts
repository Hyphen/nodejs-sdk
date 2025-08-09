/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, test } from "vitest";
import { Hyphen } from "../src/hyphen.js";
import { Link } from "../src/link.js";
import { NetInfo } from "../src/net-info.js";
import { Toggle } from "../src/toggle.js";

describe("Hyphen", () => {
	test("should create an instance of Hyphen", () => {
		const hyphen = new Hyphen();
		expect(hyphen).toBeInstanceOf(Hyphen);
	});

	test("should accept options in the constructor", () => {
		const options = { publicApiKey: "test-key" };
		const hyphen = new Hyphen(options);
		expect(hyphen).toBeInstanceOf(Hyphen);
	});

	test("should have a netInfo property", () => {
		const hyphen = new Hyphen();
		expect(hyphen.netInfo).toBeDefined();
		expect(hyphen.netInfo).toBeInstanceOf(NetInfo);
	});

	test("should have a toggle property", () => {
		const hyphen = new Hyphen();
		expect(hyphen.toggle).toBeDefined();
		expect(hyphen.toggle).toBeInstanceOf(Toggle);
	});

	test("should have a link property", () => {
		const hyphen = new Hyphen();
		expect(hyphen.link).toBeDefined();
		expect(hyphen.link).toBeInstanceOf(Link);
	});

	test("should allow setting and getting publicApiKey", () => {
		const publicApiKey = "public_api_key";
		const hyphen = new Hyphen({ publicApiKey });
		expect(hyphen.publicApiKey).toBe(publicApiKey);

		const newPublicApiKey = "public_new_api_key";
		hyphen.publicApiKey = newPublicApiKey;
		expect(hyphen.publicApiKey).toBe(newPublicApiKey);
	});

	test("should allow setting and getting apiKey", () => {
		const apiKey = "api_key";
		const hyphen = new Hyphen({ apiKey });
		expect(hyphen.apiKey).toBe(apiKey);

		const newApiKey = "new_api_key";
		hyphen.apiKey = newApiKey;
		expect(hyphen.apiKey).toBe(newApiKey);
	});

	test("should set throwErrors in options", () => {
		const hyphen = new Hyphen({ throwErrors: true });
		expect(hyphen.toggle.throwErrors).toBe(true);
		expect(hyphen.netInfo.throwErrors).toBe(true);
		expect(hyphen.throwErrors).toBe(true);
		hyphen.throwErrors = false;
		expect(hyphen.toggle.throwErrors).toBe(false);
		expect(hyphen.netInfo.throwErrors).toBe(false);
		expect(hyphen.throwErrors).toBe(false);
	});
});
