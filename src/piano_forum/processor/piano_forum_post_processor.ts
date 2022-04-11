import { PianoForumPost } from "../post/piano_forum_post";
import Fuse from "fuse.js";
import { Color } from "../post/color";
import { ForumPostProcessor } from "../../general/processor/forum_post_processor";
import { Condition } from "../post/condition";
import { Country, CountrySearchOptions, CountrySearchType } from "../post/country";

export class PianoForumPostProcessor extends ForumPostProcessor<PianoForumPost> {
	private addedInferredMake = false;
	private addedInferredModel = false;
	private addedInferredColor = false;
	private addedInferredCondition = false;

	public constructor(posts?: PianoForumPost[]) {
		super(posts);
	}

	public override resetFlags(): void {
		this.addedInferredMake = false;
		this.addedInferredModel = false;
		this.addedInferredColor = false;
		this.addedInferredCondition = false;
	}

	public override addInferredFields(): void {
		const start = Date.now();
		console.log("Adding inferred fields to posts...");
		this.addInferredMake();
		this.addInferredModel();
		this.addInferredColor();
		this.addInferredCondition();
		this.addInferredPurchaseCountry();
		console.log(`Finished adding inferred fields in ${Date.now() - start} ms`);
	}

	public addInferredMake(): void {
		const start = Date.now();
		console.log("Adding inferred make to posts...");
		const fuse = new Fuse<string>([], {
			threshold: 0.3,
			includeScore: true,
			findAllMatches: true, // might not be working
			minMatchCharLength: 2,
		});

		// build frequency map
		const makeFreqMap = new Map<string, number>();
		this.posts.forEach((p) => {
			if (!p.make) {
				return;
			}

			const make = this.removeKnownDescriptors(p.make).toUpperCase();
			if (!makeFreqMap.has(make)) {
				fuse.add(make);
				makeFreqMap.set(make, 1);
			} else {
				makeFreqMap.set(make, makeFreqMap.get(make) + 1);
			}
		});

		// find inferred make
		this.posts.forEach((p) => {
			if (!p.make) {
				return;
			}

			// test make for best match
			let [makeMatchName, makeMatchCount] = this.findBestMatch(
				makeFreqMap,
				fuse,
				p.make.toUpperCase()
			);
			// check for swapped make/model
			let [modelMatchName, modelMatchCount] = this.findBestMatch(
				makeFreqMap,
				fuse,
				this.buildFuzzyString(p.model)
			);
			// if the post model matches more make names, make/model is probably swapped
			if (modelMatchCount > makeMatchCount) {
				p.inferredSwappedMakeModel = true;
				makeMatchName = modelMatchName;
				makeMatchCount = modelMatchCount;
			}
			p.inferredMake = makeMatchName;
		});

		this.addedInferredMake = true;

		console.log(`Finished adding inferred make in ${Date.now() - start} ms`);
	}

	public addInferredModel(): void {
		const start = Date.now();
		console.log("Adding inferred model to posts...");
		if (!this.addedInferredMake) {
			console.error(
				"Inferred models should not be attempted before adding inferred makes as this greatly increases accuracy."
			);
		}
		const fuse = new Fuse<string>([], {
			threshold: 0.05,
			includeScore: true,
			findAllMatches: true,
			minMatchCharLength: 3,
		});

		// build frequency map
		const modelFreqMap = new Map<string, number>();
		this.posts.forEach((p) => {
			if (!p.model) {
				return;
			}

			const model = this.buildFuzzyMakeModelName(p);
			if (!modelFreqMap.has(model)) {
				fuse.add(model);
				modelFreqMap.set(model, 1);
			} else {
				modelFreqMap.set(model, modelFreqMap.get(model) + 1);
			}
		});

		// find inferred model
		this.posts.forEach((p) => {
			if (!p.model) {
				return;
			}
			let inferredModel = this.buildFuzzyMakeModelName(p);
			if (this.finalizeModelName(inferredModel).length > 3) {
				const [matchName, _] = this.findBestMatch(
					modelFreqMap,
					fuse,
					inferredModel,
					(name: string, _) => {
						return this.modelNumbersMatch(inferredModel, name);
					}
				);
				inferredModel = matchName;
			}
			p.inferredModel = this.finalizeModelName(inferredModel);
		});

		this.addedInferredModel = true;

		console.log(`Finished adding inferred model in ${Date.now() - start} ms`);
	}

	public addInferredColor(): void {
		const start = Date.now();
		console.log("Adding inferred color to posts...");
		this.posts.forEach((p) => {
			// check end of model i.e. P155B
			let color = Color.colorFrom(this.normalizeStr(p.model), "endsWith");

			if (color === Color.OTHER) {
				const colorString = p.inferredModel
					? p.model
							.replace(/-/gi, "")
							.replace(new RegExp(`${p.inferredModel}`, "i"), "")
							.trim()
					: p.model;

				// test for longer color strings within full model string (without inferred model) i.e. P155 in Black
				color = Color.colorFrom(colorString, "contains", 3);

				// test each part separate part of the full model string (without inferred model) for exact color i.e. P155 B
				if (color === Color.OTHER) {
					for (const part of colorString.split(/\b/g)) {
						const colorMatch = Color.colorFrom(part, "exact");
						if (colorMatch != Color.OTHER) {
							color = colorMatch;
						}
					}
				}
			}

			p.inferredColor = color.name;
		});
		this.addedInferredColor = true;
		console.log(`Finished adding inferred color in ${Date.now() - start} ms`);
	}

	public addInferredCondition(): void {
		const start = Date.now();
		console.log("Adding inferred condition to posts...");
		this.posts.forEach((p) => {
			p.inferredCondition = Condition.conditionFrom(p.condition).name;
		});
		this.addedInferredCondition = true;
		console.log(`Finished adding inferred condition in ${Date.now() - start} ms`);
	}

	public addInferredPurchaseCountry(): void {
		const start = Date.now();
		console.log("Adding inferred country to posts...");

		this.posts.forEach((p) => {
			const { userLocation, vendorLocation } = p;
			p.inferredPurchaseCountry =
				this.findBestCountryMatch(vendorLocation, userLocation) ??
				this.findBestCountryMatch(vendorLocation, userLocation, true);
		});
		console.log(`Finished adding inferred country in ${Date.now() - start} ms`);
	}

	private findBestMatch(
		freqMap: Map<string, number>,
		fuse: Fuse<string>,
		searchTerm: string,
		matchFilter?: (name: string, count: number) => boolean
	): [string, number] {
		let res = fuse.search(searchTerm);
		const maxFreq = {
			name: "",
			count: 0,
		};

		// find highest frequency of all close matches
		if (matchFilter) {
			res = res.filter(({ item }) => matchFilter(item, freqMap.get(item)));
		}
		res.forEach(({ item }) => {
			const currFreq = freqMap.get(item);
			if (currFreq > maxFreq.count) {
				maxFreq.name = item;
				maxFreq.count = currFreq;
			}
		});

		return [maxFreq.name, maxFreq.count];
	}

	private finalizeModelName(model: string): string {
		let split = model.split("- ");
		return split[split.length - 1].replace(/ /g, "");
	}

	private buildFuzzyMakeModelName({
		make,
		model,
		inferredSwappedMakeModel,
	}: PianoForumPost): string {
		// if swapped make/model use opposites make=model model=make; otherwise, use normal make=make model=model
		let usedMake = inferredSwappedMakeModel ? model : make;
		let usedModel = inferredSwappedMakeModel ? make : model;

		// remove make from start of model if included
		if (usedModel.startsWith(usedMake)) {
			usedModel = usedModel.replace(new RegExp(`^${usedMake}[\s]*[:-]?`), "");
		}

		return this.buildFuzzyString(usedMake) + " - " + this.buildFuzzyString(usedModel);
	}

	private buildFuzzyString(str: string): string {
		const fuzzy = this.normalizeStr(str);
		return this.removeColor(fuzzy).trim();
	}

	private normalizeStr(str: string): string {
		let fuzzy = str.toUpperCase();
		fuzzy = this.removeAllDescriptors(fuzzy);
		fuzzy = fuzzy
			.replace(/-/g, " ")
			.replace(/(\d+)/g, (_, num) => {
				return " " + num + " ";
			})
			.replace(/[ ]+/, " ")
			.trim();
		return fuzzy;
	}

	private removeAllDescriptors(str: string): string {
		const split = this.removeKnownDescriptors(str).split(" ");

		let base = split[0];
		let holdChunk = "";

		// adds chunks until the last chunk with digits is found
		// this removes additional descriptors such as "digital piano" or "stage piano" from the end
		for (let i = 1; i < split.length; ++i) {
			const part = split[i];
			holdChunk += holdChunk != "" ? " " + part : part;
			if (/\d/.test(split[i])) {
				base += " " + holdChunk;
				holdChunk = "";
			}
		}

		return base;
	}

	private removeKnownDescriptors(str: string): string {
		return str
			.replace(/(arius|avant.?grand|clavinova|celviano|privia|novus) ?/gi, "") // removes optional long model names
			.split(/ ?([\[\+\(\/,&]|w\/|with|set|bundle|finish|in|pedal)/i)[0] // removes clear additional info
			.trim();
	}

	private removeColor(str: string): string {
		const match = Color.colorStringFrom(str, "endsWith");
		if (match) {
			return str.substring(0, str.length - match.length);
		}
		return str;
	}

	private modelNumbersMatch(first: string, second: string): boolean {
		let one = first.replace(/[^\d]+/g, "").trim();
		let two = second.replace(/[^\d]+/g, "").trim();
		return one === two;
	}

	private findBestCountryMatch(
		vendorLocation: string,
		userLocation: string,
		fuzzy: boolean = false
	): Country {
		return (
			this.findBestCountryMatchForLocation(vendorLocation, {
				searchTypes: [CountrySearchType.PROVINCE, CountrySearchType.COUNTRY],
				fuzzy: fuzzy,
				checkForIncludes: true,
			}) ??
			this.findBestCountryMatchForLocation(userLocation, {
				searchTypes: [CountrySearchType.PROVINCE, CountrySearchType.COUNTRY],
				fuzzy: fuzzy,
				checkForIncludes: true,
			}) ??
			this.findBestCountryMatchForLocation(
				vendorLocation.replace(/[^A-Z ]/gi, ""),
				{
					searchTypes: [
						CountrySearchType.PROVINCE,
						CountrySearchType.COUNTRY,
						CountrySearchType.CITY,
					],
					fuzzy: fuzzy,
					checkForIncludes: true,
				},
				/ /g
			) ??
			this.findBestCountryMatchForLocation(
				userLocation.replace(/[^A-Z ]/gi, ""),
				{
					searchTypes: [
						CountrySearchType.PROVINCE,
						CountrySearchType.COUNTRY,
						CountrySearchType.CITY,
					],
					fuzzy: fuzzy,
					checkForIncludes: true,
				},
				/ /g
			)
		);
	}

	private findBestCountryMatchForLocation(
		location: string,
		options?: CountrySearchOptions,
		splitPattern: RegExp = /[\(\)\/,]/g
	): Country {
		if (
			location.match(
				/^n\/?a$|^same$|^(online|web(.?site)?|ebay|craigslist)$|^www\.|\.com$/i
			)
		) {
			return undefined;
		}

		let locParts: string[] = [];
		// i.e. creates a St Louis string from St. Louis to be added
		if (location.includes(".")) {
			const match = location.match(/\b([A-Z]+)\. ?([A-Z]+)\b/i);
			if (match?.length > 2) {
				locParts.push(match[1] + " " + match[2]);
			}
		}

		locParts.push(
			...location
				.replace(".", "") // replace first instance of a . which may be common in some names i.e. St. Louis
				.split(".")[0]
				.split(splitPattern)
				.reverse() // reverses to prioritize ending of locations which normally includes country
		);
		for (const s of locParts) {
			if (s == "") {
				continue;
			}
			const country = Country.countryFrom(s, options);
			if (country) {
				return country;
			}
		}
	}
}
