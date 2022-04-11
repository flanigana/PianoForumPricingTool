import cc from "currency-codes";
import Fuse from "fuse.js";

export class Currency {
	private static readonly CountryMatcher = new Fuse<string>(cc.countries(), {
		includeScore: true,
	});

	public static getCodeFromCountryName(country: string): string {
		const res = this.CountryMatcher.search(country);
		if (res.length > 0) {
			let { item: countryName } = res.find(({ item: name }) =>
				cc.country(name)
			);
			return cc.country(countryName)[0].code;
		}

		return "";
	}

	public static getNameFromCode(code: string): string {
		const currencyInfo = cc.code(code);
		if (currencyInfo?.currency) {
			return currencyInfo.currency.toUpperCase();
		}
		return "";
	}
}
