CREATE TABLE IF NOT EXISTS group_invitations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			group_id TEXT NOT NULL,
			inviter_id TEXT NOT NULL,
			invitee_id TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(group_id, invitee_id),
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (inviter_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (invitee_id) REFERENCES user(id) ON DELETE CASCADE
		);
