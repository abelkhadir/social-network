CREATE TABLE IF NOT EXISTS user (
			id TEXT PRIMARY KEY,
			nickname TEXT UNIQUE NOT NULL,
			firstname TEXT,
			lastname TEXT,
			age INTEGER,
			gender TEXT,
			email TEXT UNIQUE NOT NULL,
			password TEXT NOT NULL,
			avatarURL TEXT,
			about_me TEXT DEFAULT '',
			is_private INTEGER NOT NULL DEFAULT 0
		);