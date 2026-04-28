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

	tables := []string{
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
		`CREATE TABLE IF NOT EXISTS sessions(
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
		`CREATE TABLE IF NOT EXISTS post_category(
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
		`CREATE TABLE IF NOT EXISTS post_vote(
			user_id TEXT NOT NULL,
			post_id TEXT NOT NULL,
			vote INTEGER NOT NULL,
			FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
			FOREIGN KEY(post_id) REFERENCES post(id) ON DELETE CASCADE,
			UNIQUE(user_id, post_id)
		);`,
		`CREATE TABLE IF NOT EXISTS comment_vote(
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
		`CREATE TABLE IF NOT EXISTS followers (
	follower_id TEXT NOT NULL,
	following_id TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

	FOREIGN KEY (follower_id) REFERENCES user(id) ON DELETE CASCADE,
	FOREIGN KEY (following_id) REFERENCES user(id) ON DELETE CASCADE,

	UNIQUE(follower_id, following_id)
);`,
		`CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id, is_read, created_at);`,
	}

	for _, table := range tables {
		if _, err := db.Exec(table); err != nil {
			return fmt.Errorf("create tables: %w", err)
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
