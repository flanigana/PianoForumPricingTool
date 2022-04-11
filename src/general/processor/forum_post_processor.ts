import { Post } from "../post/post";

export abstract class ForumPostProcessor<P extends Post = Post> {
	protected posts: P[];

	public constructor(posts?: P[]) {
		this.posts = posts ? [...posts] : [];
	}

	public getPosts(): P[] {
		return this.posts;
	}

	public setPosts(...posts: P[]): void {
		this.clearPosts();
		this.addPosts(...posts);
	}

	public addPosts(...posts: P[]): void {
		this.posts.push(...posts);
		this.resetFlags();
	}

	public clearPosts(): void {
		this.posts = [];
		this.resetFlags();
	}

	abstract addInferredFields(): void;
	abstract resetFlags(): void;
}
