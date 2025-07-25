export type ClickByDay = {
	date: string;
	total: number;
	unique: number;
};

export type Clicks = {
	total: number;
	unique: number;
	byDay: ClickByDay[];
};

export type Referral = {
	url: string;
	total: number;
};

export type Browser = {
	name: string;
	total: number;
};

export type Device = {
	name: string;
	total: number;
};

export type Location = {
	country: string;
	total: number;
	unique: number;
};

export type GetCodeStatsResponse = {
	clicks: Clicks;
	referrals: Referral[];
	browsers: Browser[];
	devices: Device[];
	locations: Location[];
};
