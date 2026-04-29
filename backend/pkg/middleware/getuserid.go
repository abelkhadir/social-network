package middleware

import (
	"database/sql"
	"errors"
	"fmt"
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
		SELECT user_id FROM sessions WHERE token = ?
	`, cookie.Value).Scan(&userID)

	if err == sql.ErrNoRows {
		return "", ErrInvalidToken
	}
	if err != nil {
		return "", err
	}
	fmt.Println("the id tsfsdfjsdfjsdbgfjsdngfsajkgnsdkjgdsfjh",userID)

	return userID, nil
}