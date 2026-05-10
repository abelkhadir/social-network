CREATE TABLE IF NOT EXISTS post_vote (
			user_id TEXT NOT NULL,
			post_id TEXT NOT NULL,
			vote INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			UNIQUE(user_id, post_id)
		);
