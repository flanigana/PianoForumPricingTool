import { RateLimitRequestService } from "../../utils/rate_limit_request_service";
import { PostConverter } from "../post/post_converter";
import { ForumScraper } from "../scraper/forum_scraper";
import { ScraperOptions } from "../scraper/scraper_options";
import { ForumPostProcessor } from "./forum_post_processor";
import { Post } from "../post/post";

import path = require("path");
import fs = require("fs");

export class ForumProcessor<P extends Post = Post> {
	private readonly ForumScraper: ForumScraper<P>;
	private readonly PostProcessor: ForumPostProcessor<P>;

	protected posts: P[];

	public constructor(
		waitSecondsPerRequest: number,
		scraperOptions: ScraperOptions,
		postConverter?: PostConverter<P>,
		postProcessor?: ForumPostProcessor<P>
	) {
		this.ForumScraper = new ForumScraper(
			new RateLimitRequestService(waitSecondsPerRequest),
			scraperOptions,
			postConverter
		);
		this.PostProcessor = postProcessor;
		this.posts = [];
	}

	public async scrapeAndWriteToCsv(
		outputPath: string,
		addInferredFields: boolean,
		headers?: string
	): Promise<void> {
		await this.scrapeAllPosts(addInferredFields);
		this.writePostsToCsv(outputPath, headers);
		console.log("Completed forum scraping and output");
	}

	public async scrapeAllPosts(addInferredFields?: boolean): Promise<void> {
		this.posts = await this.ForumScraper.getAllPosts();
		if (addInferredFields) {
			if (this.PostProcessor) {
				this.PostProcessor.setPosts(...this.posts);
				this.PostProcessor.addInferredFields();
				this.posts = this.PostProcessor.getPosts();
			} else {
				console.error(
					"Cannot add inferred fields without a PostProcessor in ForumProcessor"
				);
			}
		}
	}

	public writePostsToCsv(outputPath: string, headers?: string): void {
		this.verifyOrMakeOutputDir(outputPath);
		if (headers) {
			this.printHeadersToCsv(outputPath, headers);
		}
		this.outputPosts(outputPath);
		console.log(`Completed writing posts to ${outputPath}`);
	}

	protected verifyOrMakeOutputDir(outputPath: string): void {
		if (!fs.existsSync(path.dirname(outputPath))) {
			fs.mkdirSync(path.dirname(outputPath));
		}
	}

	protected printHeadersToCsv(outputPath: string, headers: string): void {
		fs.writeFileSync(outputPath, headers + "\n", {
			flag: "w",
		});
	}

	protected outputPosts(outputPath: string): void {
		this.posts.forEach((p) => {
			this.outputPost(outputPath, p);
		});
	}

	protected outputPost(outputPath: string, post: P): void {
		fs.writeFileSync(outputPath, post.toCsv() + "\n", {
			flag: "a+",
		});
	}
}
