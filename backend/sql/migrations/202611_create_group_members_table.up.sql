CREATE TABLE IF NOT EXISTS group_members (
			group_id TEXT,
			member_id TEXT,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE,
			PRIMARY KEY (group_id, member_id)
		);
