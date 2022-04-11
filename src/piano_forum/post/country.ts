import cities from "all-the-cities"; // uses country codes for each city
import { countries, Country as ListCountry } from "countries-list"; // contains full country names, country codes, and currency codes
import provinces from "provinces"; // uses country codes for each province
import Fuse from "fuse.js";
import { Currency } from "./currency";

export type CountrySearchOptions = {
	searchTypes?: CountrySearchType[];
	checkForIncludes?: boolean;
	fuzzy?: boolean;
};

export enum CountrySearchType {
	COUNTRY,
	PROVINCE,
	CITY,
}

export class Country {
	private static readonly CountryMap = new Map<string, Country>();
	private static readonly ProvinceToCountryMap = new Map<string, Country>();
	private static readonly CityToCountryMap = new Map<string, Country>();

	private static readonly CountryFuzzyMatcher = new Fuse([], {
		threshold: 0.05,
	});

	private static readonly ProvinceFuzzyMatcher = new Fuse([], {
		threshold: 0.1,
	});

	private static readonly CityFuzzyMatcher = new Fuse([], {
		threshold: 0.15,
	});

	private static readonly DefaultSearchOptions: CountrySearchOptions = {
		searchTypes: [CountrySearchType.COUNTRY],
		checkForIncludes: true,
		fuzzy: false,
	};

	static {
		for (const code in countries) {
			const countryInfo: ListCountry = countries[code];
			if (!countryInfo.currency) {
				countryInfo.currency = "USD";
			}
			const currCodes = this.parseCurrencyCodes(countryInfo.currency);
			const country = new Country({
				name: countryInfo.name.toUpperCase(),
				countryCode: code,
				currencyCodes: currCodes,
				currencyNames: this.findCurrencyNames(currCodes),
			});
			this.CountryFuzzyMatcher.add(country.name);

			this.CountryMap.set(country.name, country);
			this.CountryMap.set(country.countryCode, country);

			if (country.name == "UNITED STATES") {
				// United States is US but many use USA
				this.CountryMap.set("USA", country);
			} else if (country.name == "UNITED KINGDOM") {
				// United Kingdom is GB but many use UK
				this.CountryMap.set("UK", country);
			}
		}

		provinces.forEach((province) => {
			const country = this.CountryMap.get(province.country);
			// prioritize US/CA provinces as they are used the most
			if (!country || !(province.country == "US" || province.country == "CA")) {
				return;
			}
			province.name = province.name.toUpperCase();
			this.ProvinceFuzzyMatcher.add(province.name);

			if (this.ProvinceToCountryMap.has(province.name)) {
				console.error(`Duplicate province with name ${province.name} found`);
			}
			this.ProvinceToCountryMap.set(province.name, country);

			if (province.short) {
				if (this.ProvinceToCountryMap.has(province.short)) {
					console.error(
						`Duplicate province with short name ${province.name} found`
					);
				}
				this.ProvinceToCountryMap.set(province.short, country);
			}

			if (province.english) {
				if (this.ProvinceToCountryMap.has(province.english)) {
					console.error(
						`Duplicate province with short name ${province.name} found`
					);
				}
				this.ProvinceToCountryMap.set(province.english, country);
			}
		});

		const cityMap = new Map<string, cities.City>();
		cities.forEach((city) => {
			if (city.population < 10000) {
				return;
			}
			const country = this.CountryMap.get(city.country);
			if (!country) {
				return;
			}

			city.name = city.name.toUpperCase();
			this.CityFuzzyMatcher.add(city.name);

			if (city.name == "NEW YORK CITY") {
				// Many use NYC for New York City
				cityMap.set("NYC", city);
			}

			if (cityMap.has(city.name)) {
				const other = cityMap.get(city.name);
				const higherPop = city.population > other.population;
				if (higherPop) {
					cityMap.set(city.name, city);
					this.CityToCountryMap.set(city.name, country);
				}
			} else {
				cityMap.set(city.name, city);
				this.CityToCountryMap.set(city.name, country);
			}
		});
	}

	readonly name: string;
	readonly countryCode: string;
	readonly currencyCodes: string[];
	readonly currencyNames: string[];

	public constructor(init: Partial<Country>) {
		Object.assign(this, init);
	}

	public static countryFrom(str: string, options: CountrySearchOptions): Country {
		options = Object.assign({}, this.DefaultSearchOptions, options);
		const { searchTypes } = options;
		for (const t of searchTypes) {
			let res: Country;
			switch (t) {
				case CountrySearchType.COUNTRY:
					res = this.testForCountry(str, options);
					break;
				case CountrySearchType.PROVINCE:
					res = this.testForProvince(str, options);
					break;
				case CountrySearchType.CITY:
					res = this.testForCity(str, options);
					break;
			}
			if (res) {
				return res;
			}
		}
	}

	public static testForCountry(str: string, options?: CountrySearchOptions): Country {
		options = Object.assign({}, this.DefaultSearchOptions, options);
		return this.testTypeForCountry(
			str,
			this.CountryMap,
			this.CountryFuzzyMatcher,
			options
		);
	}

	public static testForProvince(str: string, options?: CountrySearchOptions): Country {
		options = Object.assign({}, this.DefaultSearchOptions, options);
		return this.testTypeForCountry(
			str,
			this.ProvinceToCountryMap,
			this.ProvinceFuzzyMatcher,
			options
		);
	}

	public static testForCity(str: string, options?: CountrySearchOptions): Country {
		options = Object.assign({}, this.DefaultSearchOptions, options);
		return this.testTypeForCountry(
			str,
			this.CityToCountryMap,
			this.CityFuzzyMatcher,
			options
		);
	}

	private static testTypeForCountry(
		str: string,
		map: Map<string, Country>,
		fuzzyMatcher: Fuse<string>,
		options?: CountrySearchOptions
	): Country {
		options = Object.assign({}, this.DefaultSearchOptions, options);
		const test = this.normalize(str);
		if (map.has(test)) {
			return map.get(test);
		}
		if (options.checkForIncludes) {
			for (const key of Array.from(map.keys())) {
				if (key.length > 3 && new RegExp(`\b${key}\b`, "i").test(test)) {
					return map.get(key);
				}
			}
		}
		if (options.fuzzy) {
			const res = fuzzyMatcher.search(test);
			if (res.length > 0) {
				return map.get(res[0].item);
			}
		}
	}

	private static normalize(str: string): string {
		return str
			.replace(/[^A-Z ]/gi, "")
			.trim()
			.toUpperCase();
	}

	private static parseCurrencyCodes(codes: string): string[] {
		return codes.split(/, ?/g);
	}

	private static findCurrencyNames(codes: string[]): string[] {
		return codes
			.map((curr) => Currency.getNameFromCode(curr))
			.filter((name) => name != "");
	}

	public toString(): string {
		return this.name;
	}
}
