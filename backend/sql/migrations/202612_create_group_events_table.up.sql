CREATE TABLE IF NOT EXISTS group_events (
			id TEXT PRIMARY KEY,
			group_id TEXT,
			member_id TEXT,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			event_date DATETIME NOT NULL,
			created_at DATETIME NOT NULL,
			total_going INTEGER DEFAULT 0,
			total_not_going INTEGER DEFAULT 0,
			status TEXT,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE
		);
