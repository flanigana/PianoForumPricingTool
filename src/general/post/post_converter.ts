import { Post, PostFieldExtractor } from "./post";

export class PostConverter<P extends Post = Post> {
	protected extractorsMap: Map<string, PostFieldExtractor<P>>;

	public constructor(extractorsMap?: Map<string, PostFieldExtractor<P>>) {
		this.extractorsMap = extractorsMap;
	}

	public convertPosts(posts: Post[]): Post[] {
		return posts.map((p: Post) => this.convertPost(p));
	}

	public convertPost(post: Post): any {
		if (!this.extractorsMap) {
			return post as P;
		}

		const partialPost: Partial<Post> = { ...post };

		this.extractorsMap.forEach((extractor, field) => {
			partialPost[field] = extractor.get(post);
		});

		return partialPost as P;
	}
}
