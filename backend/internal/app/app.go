package app

import (
	"database/sql"
	"log"
	"os"

	"social/internal/repositories/auth"
	groupsrepos "social/internal/repositories/group"
	"social/internal/repositories/notifications"
	"social/internal/repositories/post"
	profilerepo "social/internal/repositories/profile"
	"social/internal/repositories/sessions"
	"social/internal/repositories/websocket"
	dbschema "social/pkg/database/db"
	"social/pkg/utils"

	// _ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/golang-migrate/migrate/v4"
)

type Application struct {
	DB               *sql.DB
	UserRepo         *auth.UserRepository
	PostRepo         *post.PostRepository
	CommentRepo      *post.CommentRepository
	ProfileRepo      *profilerepo.ProfileRepository
	MessageRepo      *websocket.MessageRepository
	SessionRepo      *sessions.SessionRepository
	NotificationRepo *notifications.NotificationRepository
	GroupPostRepo    *groupsrepos.GroupRepository
	GroupMembers     *groupsrepos.GroupRepository
	GroupEvents      *groupsrepos.GroupRepository
	GroupMessage     *groupsrepos.MessageRepository
}

// NewApp initializes the database and repositories
func NewApp() *Application {
	utils.LoadEnv(".env")
	databaseURL := os.Getenv("DATABASE")
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

	if err := db.Ping(); err != nil {
		log.Fatal("❌ Database not reachable:", err)
	}
	// Ensure tables / migrations
	if err := dbschema.EnsureSchema(db); err != nil {
		log.Fatal("❌ Failed to ensure database schema:", err)
	}

	// RunMigration()
	// ensureCommentVoteTable(db)
	// ensureMessageTable(db)
	// Initialize repositories
	userRepo := auth.NewUserRepository(db)
	postRepo := post.NewPostRepository(db)
	commentRepo := post.NewCommentRepository(db)
	profileRepo := profilerepo.NewProfileRepository(db)
	messageRepo := websocket.NewMessageRepository(db)
	sessionRepo := sessions.NewSessionRepository(db, userRepo)
	notificationRepo := notifications.NewNotificationRepository(db)
	groupsRepo := groupsrepos.NewGroupRepo(db)
	groupMsgRepo := groupsrepos.NewMessageRepository(db)
	app := &Application{
		DB:               db,
		UserRepo:         userRepo,
		PostRepo:         postRepo,
		CommentRepo:      commentRepo,
		ProfileRepo:      profileRepo,
		MessageRepo:      messageRepo,
		SessionRepo:      sessionRepo,
		NotificationRepo: notificationRepo,
		GroupPostRepo:    groupsRepo,
		GroupMessage:     groupMsgRepo,
	}

	return app
}

func RunMigration() {
	m, err := migrate.New(
		"file://sql/migrations",
		"sqlite3://./database/socialdb.db",
	)
	if err != nil {
		log.Fatal("failed to create DB driver:", err)
	}

	if err = m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatal(err)
	}
}
