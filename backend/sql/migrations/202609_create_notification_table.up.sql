CREATE TABLE IF NOT EXISTS notification (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			actor_id TEXT,
			type TEXT NOT NULL,
			entity_id TEXT,
			entity_type TEXT,
			content TEXT NOT NULL,
			is_read INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (actor_id) REFERENCES user(id) ON DELETE SET NULL
		);

CREATE INDEX IF NOT EXISTS idx_notification_user
		 ON notification(user_id, is_read, created_at);
