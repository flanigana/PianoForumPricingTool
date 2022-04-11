export class Condition {
	public static readonly NEW = new Condition("NEW", /new|nib/i);
	public static readonly USED = new Condition(
		"USED-OTHER",
		/used|(2nd|second).?hand/i
	);
	public static readonly USED_LIKE_NEW = new Condition(
		"USED-LIKE NEW",
		/like new|mint|excellent|perfect|flawless|very good|great|near(ly)?.?new|pristine|almost.?new/i
	);
	public static readonly REFURBISHED = new Condition(
		"REFURBISHED",
		/refurb|recertified/i
	);
	public static readonly OPEN_BOX = new Condition(
		"OPEN BOX",
		/open box|re.?box|re.?stock/i
	);
	public static readonly FLOOR_MODEL = new Condition(
		"FLOOR MODEL",
		/floor|demo|display|expo|show/i
	);
	public static readonly B_STOCK = new Condition("B STOCK", /b.?stock/i);
	public static readonly BROKEN = new Condition(
		"BROKEN",
		/broken|(not|non).?working|faulty/i
	);
	public static readonly OTHER = new Condition("OTHER", /./i);

	private static readonly ALL_CONDITIONS = [
		this.FLOOR_MODEL,
		this.BROKEN,
		this.REFURBISHED,
		this.B_STOCK,
		this.OPEN_BOX,
		this.USED_LIKE_NEW,
		this.USED,
		this.NEW,
	]; // ordered by search priority

	private readonly _name: string;
	private readonly _pattern: RegExp;

	private constructor(condition: string, pattern: RegExp) {
		this._name = condition;
		this._pattern = pattern;
	}

	public get name(): string {
		return this._name;
	}

	public static conditionFrom(str: string): Condition {
		for (const con of this.ALL_CONDITIONS) {
			if (con._pattern.test(str)) {
				return con;
			}
		}
		return this.OTHER;
	}

	public toString(): string {
		return this._name;
	}
}
