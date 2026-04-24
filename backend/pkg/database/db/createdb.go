package db

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
)

func EnsureSchema(db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("nil database handle")
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return fmt.Errorf("enable foreign keys: %w", err)
	}

	stmts := []string{
		`CREATE TABLE IF NOT EXISTS user (
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
		);`,

		`CREATE TABLE IF NOT EXISTS sessions (
			token TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			expire_at DATETIME NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS post (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			authorID TEXT NOT NULL,
			imageURL TEXT,
			createDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (authorID) REFERENCES user(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS category (
			id TEXT PRIMARY KEY,
			name TEXT UNIQUE NOT NULL
		);`,

		`CREATE TABLE IF NOT EXISTS post_category (
			category_id TEXT NOT NULL,
			post_id TEXT NOT NULL,
			FOREIGN KEY(category_id) REFERENCES category(id) ON DELETE CASCADE,
			FOREIGN KEY(post_id) REFERENCES post(id) ON DELETE CASCADE,
			UNIQUE(category_id, post_id)
		);`,

		`CREATE TABLE IF NOT EXISTS comment (
			id TEXT PRIMARY KEY,
			text TEXT NOT NULL,
			authorID TEXT NOT NULL,
			postID TEXT NOT NULL,
			createDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (authorID) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (postID) REFERENCES post(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS post_vote (
			user_id TEXT NOT NULL,
			post_id TEXT NOT NULL,
			vote INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY(post_id) REFERENCES post(id) ON DELETE CASCADE,
			UNIQUE(user_id, post_id)
		);`,

		`CREATE TABLE IF NOT EXISTS comment_vote (
			user_id TEXT NOT NULL,
			comment_id TEXT NOT NULL,
			vote INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY(comment_id) REFERENCES comment(id) ON DELETE CASCADE,
			UNIQUE(user_id, comment_id)
		);`,

		`CREATE TABLE IF NOT EXISTS message (
			id TEXT PRIMARY KEY,
			senderID TEXT NOT NULL,
			receiverID TEXT NOT NULL,
			content TEXT NOT NULL,
			createDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (senderID) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY (receiverID) REFERENCES user(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS notification (
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
		);`,

		`CREATE INDEX IF NOT EXISTS idx_notification_user 
		 ON notification(user_id, is_read, created_at);`,

		// Groups (FIXED: TEXT IDs + correct FK)
		`CREATE TABLE IF NOT EXISTS groups (
			id TEXT  PRIMARY KEY ,
			user_id TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS group_members (
			group_id TEXT,
			member_id TEXT,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE,
			PRIMARY KEY (group_id, member_id)
		);`,

		`CREATE TABLE IF NOT EXISTS group_events (
			id TEXT PRIMARY KEY,
			group_id TEXT,
			member_id TEXT,
			title TEXT NOT NULL,
			description TEXT NOT NULL,
			event_date DATETIME NOT NULL,
			created_at DATETIME NOT NULL,
			total_going INTEGER DEFAULT 0,
			total_not_going INTEGER DEFAULT 0,
			FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS group_events_votes (
			id TEXT PRIMARY KEY,
			event_id TEXT,
			member_id TEXT,
			status TEXT CHECK(status IN ('going', 'not going')),
			FOREIGN KEY (event_id) REFERENCES group_events(id) ON DELETE CASCADE,
			FOREIGN KEY (member_id) REFERENCES user(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE group_posts (
    id INTEGER PRIMARY KEY,
    group_id INTEGER,
    member_id INTEGER,
    title TEXT NOT NULL, 
    content TEXT NOT NULL,
    media TEXT, 
    comments INTEGER DEFAULT 0,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);`,
`CREATE TABLE group_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE ON UPDATE CASCADE
)`,
	}

	// Execute tables safely
	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return fmt.Errorf("create table failed: %w", err)
		}
	}

	// Triggers (separate execution for safety)
	triggers := []string{
		`CREATE TRIGGER IF NOT EXISTS upsert_vote
		 BEFORE INSERT ON group_events_votes
		 FOR EACH ROW
		 BEGIN
			DELETE FROM group_events_votes
			WHERE event_id = NEW.event_id
			AND member_id = NEW.member_id;
		 END;`,

		`CREATE TRIGGER IF NOT EXISTS update_vote_counts_after_insert
		 AFTER INSERT ON group_events_votes
		 FOR EACH ROW
		 BEGIN
			UPDATE group_events
			SET
				total_going = (
					SELECT COUNT(*) FROM group_events_votes
					WHERE event_id = NEW.event_id AND status = 'going'
				),
				total_not_going = (
					SELECT COUNT(*) FROM group_events_votes
					WHERE event_id = NEW.event_id AND status = 'not going'
				)
			WHERE id = NEW.event_id;
		 END;`,

		`CREATE TRIGGER IF NOT EXISTS update_vote_counts_after_delete
		 AFTER DELETE ON group_events_votes
		 FOR EACH ROW
		 BEGIN
			UPDATE group_events
			SET
				total_going = (
					SELECT COUNT(*) FROM group_events_votes
					WHERE event_id = OLD.event_id AND status = 'going'
				),
				total_not_going = (
					SELECT COUNT(*) FROM group_events_votes
					WHERE event_id = OLD.event_id AND status = 'not going'
				)
			WHERE id = OLD.event_id;
		 END;`,
	}

	for _, t := range triggers {
		if _, err := db.Exec(t); err != nil {
			return fmt.Errorf("create trigger failed: %w", err)
		}
	}

	if err := ensureUserProfileColumns(db); err != nil {
		return err
	}

	return nil
}
func ensureUserProfileColumns(db *sql.DB) error {
	columns := map[string]string{
		"about_me":   "TEXT DEFAULT ''",
		"is_private": "INTEGER NOT NULL DEFAULT 0",
	}
	return ensureColumns(db, "user", columns)
}

func ensureColumns(db *sql.DB, table string, columns map[string]string) error {
	rows, err := db.Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		return fmt.Errorf("inspect table %s: %w", table, err)
	}
	defer rows.Close()

	existing := map[string]bool{}
	for rows.Next() {
		var cid int
		var name string
		var ctype string
		var notnull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			return fmt.Errorf("read table info %s: %w", table, err)
		}
		existing[name] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("read table info %s: %w", table, err)
	}

	for name, definition := range columns {
		if existing[name] {
			continue
		}
		query := fmt.Sprintf("ALTER TABLE %s ADD COLUMN %s %s", table, name, definition)
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("add column %s.%s: %w", table, name, err)
		}
	}

	return nil
}

func SeedData(db *sql.DB) error {
	if db == nil {
		return fmt.Errorf("nil database handle")
	}

	seedPath := resolveSeedPath()
	if seedPath == "" {
		return fmt.Errorf("insert.sql not found (expected ./backend/sql/insert.sql or ./sql/insert.sql)")
	}

	content, err := os.ReadFile(seedPath)
	if err != nil {
		return fmt.Errorf("read seed file: %w", err)
	}

	if strings.TrimSpace(string(content)) == "" {
		return nil
	}

	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("execute seed data: %w", err)
	}

	return nil
}

func resolveSeedPath() string {
	candidates := []string{
		"./backend/sql/insert.sql",
		"./sql/insert.sql",
	}
	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			return path
		}
	}
	return ""
}
