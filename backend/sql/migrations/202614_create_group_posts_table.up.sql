CREATE TABLE IF NOT EXISTS group_posts  (
			id TEXT PRIMARY KEY,
			group_id TEXT,
			member_id TEXT,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			image TEXT,
			comments INTEGER DEFAULT 0,
			created_at DATETIME NOT NULL,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE
		);
