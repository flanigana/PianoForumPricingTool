export class Post {
	text: string;
	pageNum: number;
	postNum: number;

	public constructor(init: Partial<Post>) {
		Object.assign(this, init);
	}

	public static csvHeaders(): string {
		return `"text","pageNum","postNum","postNumOnPage"`;
	}

	public toString(): string {
		return this.toString();
	}

	public toCsv(): string {
		return `"${this.text}","${this.pageNum}","${this.postNum}"`;
	}
}

export interface PostField<T> {
	name: string;
	value: T;
}

export interface PostFieldExtractor<T> {
	get(post: Post): T;
}

export interface PostExtractors<E extends PostFieldExtractor<any>> {
	readonly AllExtractorsMap: Map<string, E>;
}
