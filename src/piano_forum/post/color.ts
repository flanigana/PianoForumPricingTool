export class Color {
	public static readonly ALL_COLORS: Color[] = [];
	public static readonly EBONY = new Color("EBONY", [
		"PE",
		"EP",
		"POLISHED EBONY",
		"EBONY POLISH",
		"EBONY POLISHED",
		"BLACK EBONY",
	]);
	public static readonly BLACK = new Color("BLACK", [
		"B",
		"BK",
		"BLK",
		"SB",
		"SATIN BLACK",
		"BLACK SATIN",
		"MATTE BLACK",
		"BLACK MATTE",
		"CHARCOAL",
		"CHARCOAL BLACK",
	]);
	public static readonly POLISHED_BLACK = new Color("POLISHED BLACK", [
		"PB",
		"BP",
		"POLISHED BLACK",
		"BLACK POLISH",
	]);
	public static readonly WHITE = new Color("WHITE", [
		"W",
		"WH",
		"PW",
		"PBW",
		"SW",
		"POLISHED WHITE",
		"POLISHED BRILLIANT  WHITE",
		"SATIN WHITE",
		"MATTE WHITE",
		"WHITE MATTE",
	]);
	public static readonly BROWN = new Color("BROWN", ["BRWN"]);
	public static readonly ROSEWOOD = new Color("ROSEWOOD", [
		"R",
		"RO",
		"RW",
		"PR",
		"POLISHED ROSEWOOD",
		"PREMIUM ROSEWOOD",
		"SATIN ROSEWOOD",
		"DARK ROSEWOOD",
	]);
	public static readonly MAHOGANY = new Color("MAHOGANY", [
		"PM",
		"POLISHED MAHOGANY",
		"PREMIUM MAHOGANY",
		"SATIN MAHOGANY",
	]);
	public static readonly WALNUT = new Color("WALNUT", [
		"PW",
		"WALNUT BROWN",
		"POLISHED WALNUT",
		"PREMIUM WALNUT",
		"SATIN WALNUT",
	]);
	public static readonly CHERRY = new Color("CHERRY", [
		"PC",
		"POLISHED CHERRY",
		"PREMIUM CHERRY",
		"SATIN CHERRY",
	]);
	public static readonly MAPLE = new Color("MAPLE", [
		"POLISHED MAPLE",
		"PREMIUM MAPLE",
		"SATIN MAPLE",
	]);
	public static readonly SILVER = new Color("SILVER", ["ROSE SILVER"]);
	public static readonly OTHER = new Color("OTHER/UNKNOWN");

	private static readonly ALL_COLOR_STR_MAP = new Map<string, Color>();
	private static readonly ALL_COLOR_STR: string[] = [];

	private readonly _name: string;
	private readonly _equivs: string[];

	public constructor(name: string, equivalentNames?: string[]) {
		this._name = name;
		let equivs: string[] = equivalentNames ? [...equivalentNames] : [];
		equivs.push(name);
		this._equivs = equivs;
	}

	public get name(): string {
		return this._name;
	}

	public get allNames(): string[] {
		return Array.from(this._equivs);
	}

	public static endsInColor(str: string): boolean {
		return this.colorFrom(str, "endsWith") != undefined;
	}

	public static colorFrom(
		str: string,
		mode: "startsWith" | "endsWith" | "contains" | "exact",
		minimumMatchLength?: number
	): Color {
		let matched = this.colorStringFrom(str, mode, minimumMatchLength);
		return matched ? this.ALL_COLOR_STR_MAP.get(matched) : Color.OTHER;
	}

	public static colorStringFrom(
		str: string,
		mode: "startsWith" | "endsWith" | "contains" | "exact",
		minimumMatchLength?: number
	): string {
		const test = str.toUpperCase();
		return this.ALL_COLOR_STR.find((n) => {
			if (minimumMatchLength && n.length < minimumMatchLength) {
				return false;
			}
			switch (mode) {
				case "startsWith":
					return test.startsWith(n);
				case "endsWith":
					return test.endsWith(n);
				case "contains":
					return test.includes(n);
				case "exact":
					return test == n;
			}
		});
	}

	private static addColorToAllColors(color: Color): void {
		this.ALL_COLORS.push(color);
		color._equivs.forEach((e) => {
			this.ALL_COLOR_STR_MAP.set(e, color);
		});
		this.ALL_COLOR_STR.push(...color._equivs);
	}

	private static sortByLength(
		strs: string[],
		mode: "asc" | "desc"
	): string[] {
		return strs.sort((a, b) => {
			return mode == "asc" ? a.length - b.length : b.length - a.length;
		});
	}

	public toString(): string {
		return this.name;
	}

	static {
		this.addColorToAllColors(Color.EBONY);
		this.addColorToAllColors(Color.BLACK);
		this.addColorToAllColors(Color.POLISHED_BLACK);
		this.addColorToAllColors(Color.WHITE);
		this.addColorToAllColors(Color.BROWN);
		this.addColorToAllColors(Color.ROSEWOOD);
		this.addColorToAllColors(Color.MAHOGANY);
		this.addColorToAllColors(Color.WALNUT);
		this.addColorToAllColors(Color.CHERRY);
		this.addColorToAllColors(Color.MAPLE);
		this.addColorToAllColors(Color.SILVER);
		this.addColorToAllColors(Color.OTHER);
		this.sortByLength(this.ALL_COLOR_STR, "desc");
	}
}
