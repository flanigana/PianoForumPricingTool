import * as cheerio from "cheerio";
import { Post } from "../post/post";
import { PostConverter } from "../post/post_converter";
import { AxiosRequester } from "../../utils/axios_requester";
import { ScraperOptions } from "./scraper_options";

export class ForumScraper<P extends Post = Post> {
	private readonly Axios: AxiosRequester;
	private readonly PostConverter: PostConverter<P>;

	private baseUrl: string;
	private pageQueryString: string;
	private postTargeter: string;
	private postContentsFilter: RegExp;
	private postContentsBlacklist: RegExp;
	private endingPage: number;

	private currentRawPage: string;
	private $: cheerio.Root;
	private nextPageNum: number;
	private postsOnPage: string[];
	private postCount: number = 0; // first post will have postNum = 1
	private nextPostPos: number = 0; // position of next post on the current page that will be returned by getNextPost()
	private reachedEnd: boolean = false;

	public constructor(
		axios: AxiosRequester,
		options: ScraperOptions,
		postConverter?: PostConverter<P>
	) {
		options = ScraperOptions.validateAndBuildScraperOptions(options);
		this.Axios = axios;
		this.PostConverter = postConverter ?? new PostConverter<P>();
		this.baseUrl = options.baseUrl;
		this.pageQueryString = options.pageQueryString;
		this.postTargeter = options.postTargeter;
		this.postContentsFilter = options.postContentsFilter;
		this.postContentsBlacklist = options.postContentsBlacklist;
		this.nextPageNum = options.startingPage;
		this.endingPage = options.endingPage;
	}

	public async getAllPosts(): Promise<P[]> {
		const posts: P[] = [];
		try {
			while (this.hasNextPost()) {
				posts.push(await this.getNextPost());
			}
			console.log("Completed forum scrape");
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.error(
					`Post scraping crashed unexpectedly with the following error: \n`,
					error
				);
			}
		}
		return posts;
	}

	public async getNextPost(): Promise<P> {
		if (this.reachedEnd) {
			throw Error(
				`Reached End! Cannot retrieve any more posts the end has been reached.`
			);
		}
		if (!this.$) {
			await this.loadNextPage();
		}

		// builds a base Post and converts to the post type using the PostConverter
		const newPost = this.PostConverter.convertPost(
			new Post({
				text: this.postsOnPage[this.nextPostPos++],
				pageNum: this.nextPageNum - 1,
				postNum: ++this.postCount,
			})
		);

		// check if last post on current page
		if (this.nextPostPos == this.postsOnPage.length) {
			this.nextPostPos = 0;
			if (this.endingPage != -1 && this.nextPageNum > this.endingPage) {
				this.reachedEnd = true;
			} else {
				await this.loadNextPage();
			}
		}

		return newPost;
	}

	public hasNextPost(): boolean {
		return !this.reachedEnd;
	}

	private buildPageUrl(pageNum: number): string {
		return (
			this.baseUrl +
			this.pageQueryString.replace("{}", pageNum.toString())
		);
	}

	private async loadNextPage(): Promise<void> {
		if (this.reachedEnd) {
			throw Error(
				`Reached End! Cannot retrieve next page ${this.nextPageNum}`
			);
		}
		if (this.endingPage != -1 && this.nextPageNum > this.endingPage) {
			this.reachedEnd == true;
			throw Error(
				`Reached End! Cannot retrieve any more pages as next page is ${this.nextPageNum} and ending page is ${this.endingPage}!`
			);
		}

		const url =
			this.nextPageNum == 1
				? this.baseUrl
				: this.buildPageUrl(this.nextPageNum);

		console.log(`Loading page #${this.nextPageNum} @${url}`);
		const start = Date.now();
		const nextPage = await this.getPageData(url).then((data) => {
			return cheerio.load(data);
		});

		const nextPageContents = nextPage("body").contents().text();
		if (this.currentRawPage && this.currentRawPage == nextPageContents) {
			this.reachedEnd = true;
			console.log(
				`Reached End! Next page (#${
					this.nextPageNum
				}) has the exact html as the last page (#${
					this.nextPageNum - 1
				}).`
			);
			return;
		}

		console.log(
			`Successfully loaded page #${this.nextPageNum} in ${
				Date.now() - start
			} ms.`
		);

		this.currentRawPage = nextPageContents;
		this.$ = nextPage;
		this.postsOnPage = this.getProcessedPostsOnPage();
		++this.nextPageNum;
	}

	private async getPageData(url: string): Promise<string> {
		return this.Axios.get(url).then((res) => {
			if (res.status == 200) {
				return res.data as string;
			} else {
				throw Error(
					`Attempt to fetch url:${url} resulted in a ${res.status} status.`
				);
			}
		});
	}

	private getProcessedPostsOnPage(): string[] {
		return this.filterPosts(
			this.processIntoPostStrings(this.$(this.postTargeter).toArray())
		);
	}

	private processIntoPostStrings(postElements: cheerio.Element[]): string[] {
		/**
		 * Cheerio does not preserve line breaks, so they are replaced with newline characters
		 * The next post's text is then retrieved and trimmed for possible newlines at the beginning and end of the post
		 *  */
		return postElements.map((p) => {
			this.$(p).find("br").replaceWith("\n");
			return this.$(p).contents().text().trim();
		});
	}

	private filterPosts(posts: string[]): string[] {
		return posts.filter((p) => {
			return (
				(!this.postContentsFilter || this.postContentsFilter.test(p)) &&
				(!this.postContentsBlacklist ||
					!this.postContentsBlacklist.test(p))
			);
		});
	}
}
