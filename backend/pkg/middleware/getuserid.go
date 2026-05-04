package middleware

import (
	"database/sql"
	"errors"
<<<<<<< HEAD
=======
	"fmt"
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
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
<<<<<<< HEAD

	return userID, nil
}
=======
	fmt.Println("the id tsfsdfjsdfjsdbgfjsdngfsajkgnsdkjgdsfjh",userID)

	return userID, nil
}
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
