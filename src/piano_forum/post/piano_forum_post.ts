import { Post, PostFieldExtractor } from "../../general/post/post";
import { Country } from "./country";

export class PianoForumPost extends Post {
	userLocation: string;
	make: string;
	model: string;
	condition: string;
	pricePaid: string;
	deliveryCharge: string;
	vendorLocation: string;
	vendorName: string;
	purchaseDate: string;
	inferredSwappedMakeModel: boolean = false;
	inferredMake?: string;
	inferredModel?: string;
	inferredColor?: string;
	inferredCondition?: string;
	inferredPurchaseCountry?: Country;

	public constructor(init: Partial<PianoForumPost>) {
		super(init);
		Object.assign(this, init);
	}

	public static csvHeaders(): string {
		return `"PAGE","MAKE","MODEL","CONDITION","PRICE_PAID","DELIVERY_CHARGE","USER_LOCATION","VENDOR_LOCATION","VENDOR_NAME","PURCHASE_DATE","INFERRED_MAKE","INFERRED_MODEL","INFERRED_COLOR","INFERRED_CONDITION","INFERRED_PURCHASE_COUNTRY"`;
	}

	public override toCsv(): string {
		return `"${this.fieldToCsv("pageNum")}","${this.fieldToCsv(
			"make"
		)}","${this.fieldToCsv("model")}","${this.fieldToCsv(
			"condition"
		)}","${this.fieldToCsv("pricePaid")}","${this.fieldToCsv(
			"deliveryCharge"
		)}","${this.fieldToCsv("userLocation")}","${this.fieldToCsv(
			"vendorLocation"
		)}","${this.fieldToCsv("vendorName")}","${this.fieldToCsv(
			"purchaseDate"
		)}","${this.fieldToCsv("inferredMake")}","${this.fieldToCsv(
			"inferredModel"
		)}","${this.fieldToCsv("inferredColor")}","${this.fieldToCsv(
			"inferredCondition"
		)}","${this.fieldToCsv("inferredPurchaseCountry")}"`;
	}

	private fieldToCsv(fieldName: string): string {
		const field = this[fieldName];
		return field ? field.toString().replaceAll('"', "'") : "UNKNOWN";
	}
}

export abstract class AbstractPianoForumPostFieldExtractor<T>
	implements PostFieldExtractor<T>
{
	abstract get(post: Post): T;
}

export class BasePianoForumPostFieldExtractor extends AbstractPianoForumPostFieldExtractor<string> {
	private readonly label: string;

	public constructor(label: string) {
		super();
		this.label = label;
	}

	get(post: Post): string {
		const match = post.text.match(
			new RegExp(`^${this.label}[ \\t]*[:-][ \\t]*([^:\\n]+)`, "ism")
		);
		return match?.length > 1 ? match[1].trim() : "";
	}
}

export class PianoForumPostExtractors {
	public static readonly AllExtractorsMap: Map<
		string,
		AbstractPianoForumPostFieldExtractor<any>
	> = new Map();

	public static readonly UserLocationExtractor =
		new BasePianoForumPostFieldExtractor("USER LOCATION");
	public static readonly MakeExtractor = new BasePianoForumPostFieldExtractor(
		"MAKE"
	);
	public static readonly ModelExtractor =
		new BasePianoForumPostFieldExtractor("MODEL");
	public static readonly ConditionExtractor =
		new BasePianoForumPostFieldExtractor("CONDITION");
	public static readonly PricePaidExtractor =
		new BasePianoForumPostFieldExtractor("PRICE PAID");
	public static readonly DeliveryChargeExtractor =
		new BasePianoForumPostFieldExtractor("DELIVERY CHARGE");
	public static readonly VendorLocationExtractor =
		new BasePianoForumPostFieldExtractor("VENDOR LOCATION");
	public static readonly VendorNameExtractor =
		new BasePianoForumPostFieldExtractor("VENDOR NAME");
	public static readonly PurchaseDateExtractor =
		new BasePianoForumPostFieldExtractor("PURCHASE DATE");

	static {
		this.AllExtractorsMap.set("userLocation", this.UserLocationExtractor);
		this.AllExtractorsMap.set("make", this.MakeExtractor);
		this.AllExtractorsMap.set("model", this.ModelExtractor);
		this.AllExtractorsMap.set("condition", this.ConditionExtractor);
		this.AllExtractorsMap.set("pricePaid", this.PricePaidExtractor);
		this.AllExtractorsMap.set(
			"deliveryCharge",
			this.DeliveryChargeExtractor
		);
		this.AllExtractorsMap.set(
			"vendorLocation",
			this.VendorLocationExtractor
		);
		this.AllExtractorsMap.set("vendorName", this.VendorNameExtractor);
		this.AllExtractorsMap.set("purchaseDate", this.PurchaseDateExtractor);
	}
}
