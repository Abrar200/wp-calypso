export interface SiteVerticalsResponse {
	id: string;
	name: string;
	title: string;
	root: object;
}

export interface SiteVerticalQueryByIdParams {
	id?: string;
}

export interface SiteVerticalsQueryParams {
	term?: string;
	limit?: number;
	skip_synonyms?: boolean;
	expand_root?: boolean;
}
