package middleware

import (
	"database/sql"
	"errors"
	"net/http"
)

var (
	ErrUnauthorized = errors.New("unauthorized")
	ErrInvalidToken = errors.New("invalid token")
)

func GetUserIDFromToken(r *http.Request, name string, db *sql.DB) (string, error) {
	cookie, err := r.Cookie(name)
	if err != nil || cookie.Value == "" {
		return "", ErrUnauthorized
	}

	var userID string

	err = db.QueryRow(`
		SELECT user_id FROM sessions WHERE token = ? AND expire_at > datetime('now')
	`, cookie.Value).Scan(&userID)

	if err == sql.ErrNoRows {
		return "", ErrInvalidToken
	}
	if err != nil {
		return "", err
	}

	return userID, nil
}
