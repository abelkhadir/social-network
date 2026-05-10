CREATE TABLE IF NOT EXISTS group_comments (
			id TEXT PRIMARY KEY,
			group_post_id TEXT NOT NULL,
			member_id TEXT NOT NULL,
			content TEXT ,
			image TEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (group_post_id) REFERENCES group_posts(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE
		);
