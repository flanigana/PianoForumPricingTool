import "dotenv/config";
import { PianoForumProcessor } from "./piano_forum/processor/piano_forum_processor";
import cc from "currency-codes";
import { Currency } from "./piano_forum/post/currency";
import { Country } from "./piano_forum/post/country";

const outputPath = "./output_files/digital_piano_prices.csv";

const pricePostBaseUrl = "http://forum.pianoworld.com/ubbthreads.php/topics/1201029";
const pageQueryString = "/{}.html";
const postTargeter = ".post-content .post_inner";
const processor = new PianoForumProcessor(3, {
	baseUrl: pricePostBaseUrl,
	pageQueryString: pageQueryString,
	postTargeter: postTargeter,
	postContentsFilter: /MAKE[\s\S]*MODEL[\s\S]*PRICE PAID/im,
	postContentsBlacklist: /Originally Posted by|Quote/,
	startingPage: 1,
	endingPage: 105,
});

(async () => {
	try {
		processor.scrapeAndWriteToCsv(outputPath);
	} catch (e) {
		if (e instanceof Error) {
			console.error(e);
		}
	}

	process.on("SIGINT", async () => {
		console.log("Received manual shutdown.");
	});
})().catch(console.error);
