import { Post } from "../../general/post/post";
import { PostConverter } from "../../general/post/post_converter";
import { PianoForumPost, PianoForumPostExtractors } from "./piano_forum_post";

export class PianoForumPostConverter extends PostConverter<PianoForumPost> {
	private static converter = new PostConverter<PianoForumPost>(
		PianoForumPostExtractors.AllExtractorsMap
	);

	public constructor() {
		super(PianoForumPostExtractors.AllExtractorsMap);
	}

	public override convertPosts(posts: Post[]): PianoForumPost[] {
		return posts.map((p) => this.convertPost(p));
	}

	public override convertPost(post: Post): PianoForumPost {
		post.text = post.text.replace(/[Â]/gi, "");
		return new PianoForumPost(
			PianoForumPostConverter.converter.convertPost(post)
		);
	}
}
