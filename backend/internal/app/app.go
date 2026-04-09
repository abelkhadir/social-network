package app

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"social/internal/repositories/auth"
	"social/internal/repositories/notifications"
	"social/internal/repositories/post"
	"social/internal/repositories/sessions"
	"social/internal/repositories/websocket"
	dbschema "social/pkg/database/db"
	"social/pkg/utils"
)

type Application struct {
	DB               *sql.DB
	UserRepo         *auth.UserRepository
	PostRepo         *post.PostRepository
	CommentRepo      *post.CommentRepository
	CategoryRepo     *post.CategoryRepository
	PostCategoryRepo *post.PostCategoryRepository
	MessageRepo      *websocket.MessageRepository
	SessionRepo      *sessions.SessionRepository
	NotificationRepo *notifications.NotificationRepository
}

// NewApp initializes the database and repositories
func NewApp() *Application {
	utils.LoadEnv(".env")
	databaseURL := os.Getenv("DATABASE")
	fmt.Println("The database url", databaseURL)
	if databaseURL == "" {
		log.Fatal("❌ DATABASE environment variable is not set")
	}
	if _, err := os.Stat(databaseURL); os.IsNotExist(err) {
		file, err := os.Create(databaseURL)
		if err != nil {
			log.Fatal("❌ Cannot create database file:", err)
		}
		file.Close()
	}
	// Open DB connection
	db, err := sql.Open("sqlite3", databaseURL)
	if err != nil {
		log.Fatal("❌ Couldn't open database:", err)
	}
	fmt.Println("the db ", db)
	if err := db.Ping(); err != nil {
		log.Fatal("❌ Database not reachable:", err)
	}
	// Ensure tables / migrations
	if err := dbschema.EnsureSchema(db); err != nil {
		log.Fatal("❌ Failed to ensure database schema:", err)
	}
	if err := dbschema.SeedData(db); err != nil {
		log.Fatal("❌ Failed to seed database:", err)
	}

	// ensurePostImageColumn(db)
	// ensureCommentVoteTable(db)
	// ensureMessageTable(db)
	// Initialize repositories
	userRepo := auth.NewUserRepository(db)
	postRepo := post.NewPostRepository(db)
	commentRepo := post.NewCommentRepository(db)
	categoryRepo := post.NewCategoryRepository(db)
	postCategoryRepo := post.NewPostCategoryRepository(db)
	messageRepo := websocket.NewMessageRepository(db)
	sessionRepo := sessions.NewSessionRepository(db, userRepo)
	notificationRepo := notifications.NewNotificationRepository(db)
	app := &Application{
		DB:               db,
		UserRepo:         userRepo,
		PostRepo:         postRepo,
		CommentRepo:      commentRepo,
		CategoryRepo:     categoryRepo,
		PostCategoryRepo: postCategoryRepo,
		MessageRepo:      messageRepo,
		SessionRepo:      sessionRepo,
		NotificationRepo: notificationRepo,
	}

	log.Println("✅ Application initialized successfully")
	return app
}

func ensurePostImageColumn(db *sql.DB) {
	const tableName = "post"
	const columnName = "imageURL"

	rows, err := db.Query("PRAGMA table_info(" + tableName + ")")
	if err != nil {
		log.Printf("❌ Failed to inspect table %s: %v", tableName, err)
		return
	}
	defer rows.Close()

	hasColumn := false
	for rows.Next() {
		var cid int
		var name string
		var ctype string
		var notnull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &ctype, &notnull, &dfltValue, &pk); err != nil {
			log.Printf("❌ Failed to read table info: %v", err)
			return
		}
		if name == columnName {
			hasColumn = true
			break
		}
	}

	if hasColumn {
		return
	}

	if _, err := db.Exec("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " TEXT"); err != nil {
		log.Printf("❌ Failed to add %s.%s column: %v", tableName, columnName, err)
		return
	}
	log.Printf("✅ Added %s.%s column", tableName, columnName)
}

func ensureCommentVoteTable(db *sql.DB) {
	const ddl = `CREATE TABLE IF NOT EXISTS comment_vote(
		user_id TEXT NOT NULL,
		comment_id TEXT NOT NULL,
		vote INTEGER NOT NULL,
		FOREIGN KEY(user_id) REFERENCES user(id) ON DELETE CASCADE,
		FOREIGN KEY(comment_id) REFERENCES comment(id) ON DELETE CASCADE,
		UNIQUE(user_id, comment_id)
	);`

	if _, err := db.Exec(ddl); err != nil {
		log.Printf("❌ Failed to ensure comment_vote table: %v", err)
		return
	}
}

func ensureMessageTable(db *sql.DB) {
	const ddl = `CREATE TABLE IF NOT EXISTS message (
		id TEXT PRIMARY KEY,
		senderID TEXT NOT NULL,
		receiverID TEXT NOT NULL,
		content TEXT NOT NULL,
		createDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (senderID) REFERENCES user(id) ON DELETE CASCADE,
		FOREIGN KEY (receiverID) REFERENCES user(id) ON DELETE CASCADE
	);`

	if _, err := db.Exec(ddl); err != nil {
		log.Printf("❌ Failed to ensure message table: %v", err)
		return
	}
}
