CREATE TABLE IF NOT EXISTS groups (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
		);
