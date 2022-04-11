export class ScraperOptions {
	baseUrl: string;
	pageQueryString: string;
	postTargeter: string;
	postContentsFilter?: RegExp;
	postContentsBlacklist?: RegExp;
	startingPage?: number;
	endingPage?: number;

	public constructor(init: ScraperOptions) {
		Object.assign(this, init);
	}

	public static validateAndBuildScraperOptions(
		options: ScraperOptions
	): ScraperOptions {
		this.validateScraperOptions(options);
		options.startingPage = options.startingPage ?? 1;
		options.endingPage = options.endingPage ?? -1;
		return options;
	}

	public static validateScraperOptions(options: ScraperOptions): boolean {
		return (
			this.validatePageQueryString(options.pageQueryString) &&
			(!options.startingPage ||
				this.validateStartingPage(options.startingPage)) &&
			(!options.endingPage || this.validateEndingPage(options.endingPage))
		);
	}

	private static validatePageQueryString(queryString: string): boolean {
		if (queryString.match(/.*{}.*/).length > 0) {
			return true;
		} else {
			throw Error(
				"The pageQueryString must be a string including '{}' where '{}' designates where the page number should go."
			);
		}
	}

	private static validateStartingPage(pageNum: number): boolean {
		if (pageNum > 0) {
			return true;
		} else {
			throw Error("Starting page must be >= 1");
		}
	}

	private static validateEndingPage(pageNum: number): boolean {
		if (pageNum > 0 || pageNum == -1) {
			return true;
		} else {
			throw Error("Ending page must be == -1 or >= 1");
		}
	}
}
