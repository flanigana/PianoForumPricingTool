import { ForumProcessor } from "../../general/processor/forum_processor";
import { ScraperOptions } from "../../general/scraper/scraper_options";
import { PianoForumPost } from "../post/piano_forum_post";
import { PianoForumPostConverter } from "../post/piano_forum_post_converter";
import { PianoForumPostProcessor } from "./piano_forum_post_processor";

import fs = require("fs");

export class PianoForumProcessor extends ForumProcessor {
	public constructor(
		waitSecondsPerRequest: number,
		scraperOptions: ScraperOptions
	) {
		super(
			waitSecondsPerRequest,
			scraperOptions,
			new PianoForumPostConverter(),
			new PianoForumPostProcessor()
		);
	}

	public override async scrapeAndWriteToCsv(
		outputPath: string
	): Promise<void> {
		super.scrapeAndWriteToCsv(
			outputPath,
			true,
			PianoForumPost.csvHeaders()
		);
	}

	public override outputPost(outputPath: string, post: PianoForumPost): void {
		const { make, model, pricePaid } = post;
		if (make && model && pricePaid) {
			fs.writeFileSync(outputPath, post.toCsv() + "\n", {
				flag: "a+",
			});
		}
	}
}
