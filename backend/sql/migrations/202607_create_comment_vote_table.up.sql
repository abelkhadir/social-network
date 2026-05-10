CREATE TABLE IF NOT EXISTS comment_vote (
			user_id TEXT NOT NULL,
			comment_id TEXT NOT NULL,
			vote INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			UNIQUE(user_id, comment_id)
		);
