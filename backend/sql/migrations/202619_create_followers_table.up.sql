CREATE TABLE IF NOT EXISTS followers (
	follower_id TEXT NOT NULL,
	following_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (follower_id) REFERENCES user(id) ON DELETE CASCADE,
	FOREIGN KEY (following_id) REFERENCES user(id) ON DELETE CASCADE,

	UNIQUE(follower_id, following_id)
);
