CREATE TABLE IF NOT EXISTS group_events_votes (
			id TEXT PRIMARY KEY,
			event_id TEXT,
			member_id TEXT,
			status TEXT CHECK(status IN ('going', 'not going')),
			FOREIGN KEY (event_id) REFERENCES group_events(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE
		);
