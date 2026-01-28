import { describe, expect, test } from "vitest";
import { env } from "../src/env.js";
import { getExecutionContext } from "../src/execution-context.js";

env();

const apiKey = process.env.HYPHEN_API_KEY;
const organizationId = process.env.HYPHEN_ORGANIZATION_ID;
const testTimeout = 10_000;

describe("getExecutionContext integration", () => {
	test.skipIf(!apiKey)(
		"should fetch execution context from live API",
		async () => {
			const context = await getExecutionContext(apiKey as string);
			expect(context).toBeDefined();
			expect(context.user).toBeDefined();
			expect(context.member).toBeDefined();
			expect(context.member?.organization).toBeDefined();
		},
		testTimeout,
	);

	test.skipIf(apiKey === undefined && organizationId === undefined)(
		"should fetch organization level execution context from live API",
		async () => {
			const context = await getExecutionContext(apiKey as string, {
				organizationId,
			});
			expect(context).toBeDefined();
			expect(context.user).toBeDefined();
			expect(context.member).toBeDefined();
			expect(context.organization).toBeDefined();
		},
		testTimeout,
	);
});
