package queries

import (
	"social/pkg/db/sqlite"
	"time"

	"github.com/google/uuid"
)

func CreateSession(userID string) (string, error) {
	sessionID := uuid.New().String()
	expiresAt := time.Now().Add(24 * time.Hour) // 24 hours

	_, err := sqlite.DB.Exec(`
		INSERT INTO sessions (id, user_id, expires_at)
		VALUES (?, ?, ?)
	`, sessionID, userID, expiresAt)

	if err != nil {
		return "", err
	}

	return sessionID, nil
}

func ValidateSession(sessionID string) (string, error) {
	var userID string
	var expiresAt time.Time

	err := sqlite.DB.QueryRow(`
		SELECT user_id, expires_at
		FROM sessions
		WHERE id = ? AND expires_at > ?
	`, sessionID, time.Now()).Scan(&userID, &expiresAt)

	if err != nil {
		return "", err
	}

	return userID, nil
}
