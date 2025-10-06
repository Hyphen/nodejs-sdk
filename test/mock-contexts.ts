import type { ToggleContext } from "../src/toggle.js";

/**
 * Mock ToggleContext examples for testing purposes.
 * These provide a variety of realistic scenarios for comprehensive test coverage.
 */
export const mockToggleContexts: ToggleContext[] = [
	// Basic context with minimal data
	{
		targetingKey: "user-123",
	},

	// Standard user context with email and basic attributes
	{
		targetingKey: "user-456",
		ipAddress: "203.0.113.42",
		user: {
			id: "user-456",
			email: "john.doe@example.com",
			name: "John Doe",
		},
		customAttributes: {
			region: "us-west",
			plan: "basic",
		},
	},

	// Premium user with extensive custom attributes
	{
		targetingKey: "premium-user-789",
		ipAddress: "198.51.100.15",
		user: {
			id: "premium-user-789",
			email: "jane.smith@company.com",
			name: "Jane Smith",
			customAttributes: {
				role: "admin",
				department: "engineering",
				seniority: "senior",
				permissions: ["read", "write", "delete"],
			},
		},
		customAttributes: {
			subscriptionLevel: "premium",
			region: "us-east",
			tier: "gold",
			betaFeatures: true,
			accountType: "business",
		},
	},

	// Mobile user context with device information
	{
		targetingKey: "mobile-user-321",
		ipAddress: "192.168.1.100",
		user: {
			id: "mobile-user-321",
			email: "mobile@user.com",
			name: "Mobile User",
			customAttributes: {
				deviceType: "mobile",
				os: "iOS",
				appVersion: "2.1.0",
			},
		},
		customAttributes: {
			platform: "mobile",
			region: "eu-west",
			language: "en",
		},
	},

	// Enterprise user with complex organizational data
	{
		targetingKey: "enterprise-user-654",
		ipAddress: "10.0.0.5",
		user: {
			id: "enterprise-user-654",
			email: "admin@enterprise.com",
			name: "Enterprise Admin",
			customAttributes: {
				role: "super-admin",
				organizationId: "org-12345",
				tenantId: "tenant-abc",
				permissions: ["all"],
				lastLogin: "2023-12-01T10:00:00Z",
			},
		},
		customAttributes: {
			subscriptionLevel: "enterprise",
			region: "us-central",
			industryVertical: "finance",
			companySize: "large",
			contractType: "annual",
		},
	},

	// Anonymous user context
	{
		targetingKey: "anonymous-987",
		ipAddress: "172.16.0.25",
		customAttributes: {
			region: "ap-southeast",
			sessionId: "sess_anonymous_123",
			userAgent: "Mozilla/5.0",
			referrer: "https://google.com",
		},
	},

	// Developer/QA testing context
	{
		targetingKey: "dev-user-111",
		ipAddress: "127.0.0.1",
		user: {
			id: "dev-user-111",
			email: "developer@test.com",
			name: "Test Developer",
			customAttributes: {
				role: "developer",
				team: "platform",
				environment: "staging",
			},
		},
		customAttributes: {
			region: "us-west",
			testMode: true,
			debugEnabled: true,
			featureFlags: ["new-ui", "beta-api"],
		},
	},

	// International user with localization data
	{
		targetingKey: "intl-user-888",
		ipAddress: "185.199.108.153",
		user: {
			id: "intl-user-888",
			email: "usuario@ejemplo.es",
			name: "María García",
			customAttributes: {
				locale: "es-ES",
				timezone: "Europe/Madrid",
				currency: "EUR",
			},
		},
		customAttributes: {
			region: "eu-south",
			language: "spanish",
			country: "Spain",
			gdprConsent: true,
		},
	},

	// API/Service account context
	{
		targetingKey: "service-account-555",
		ipAddress: "10.1.1.50",
		user: {
			id: "service-account-555",
			email: "api@service.com",
			name: "API Service Account",
			customAttributes: {
				accountType: "service",
				apiVersion: "v2",
				clientId: "client_12345",
			},
		},
		customAttributes: {
			region: "us-east",
			serviceType: "api",
			rateLimitTier: "premium",
			authentication: "oauth2",
		},
	},

	// Edge case: User with numeric and special character data
	{
		targetingKey: "edge-case-user_999",
		ipAddress: "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
		user: {
			id: "edge-case-user_999",
			email: "test+special@domain-name.co.uk",
			name: "Test User-Name O'Connor",
			customAttributes: {
				userId: 12345,
				score: 98.5,
				isActive: true,
				tags: ["vip", "beta-tester", "early-adopter"],
				metadata: {
					source: "referral",
					campaign: "spring-2023",
				},
			},
		},
		customAttributes: {
			region: "ap-north",
			numericId: 999,
			percentage: 85.75,
			enabled: false,
			complexData: {
				nested: {
					value: "deep-nested-value",
					array: [1, 2, 3],
				},
			},
		},
	},
];

/**
 * Gets a random ToggleContext from the mock contexts array.
 * Useful for testing with varied context data without hardcoding specific indices.
 *
 * @returns A randomly selected ToggleContext from the mockToggleContexts array
 *
 * @example
 * ```typescript
 * const randomContext = getRandomToggleContext();
 * const toggle = new Toggle({ defaultContext: randomContext });
 * ```
 */
export function getRandomToggleContext(): ToggleContext {
	const randomIndex = Math.floor(Math.random() * mockToggleContexts.length);
	return mockToggleContexts[randomIndex];
}
