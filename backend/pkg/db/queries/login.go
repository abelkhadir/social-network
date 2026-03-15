package queries

import (
	"social/pkg/db/sqlite"
)

type User struct {
	ID           string
	Email        string
	PasswordHash string
}

func GetUserByEmail(email string) (*User, error) {

	row := sqlite.DB.QueryRow(`
		SELECT id, email, password_hash
		FROM users
		WHERE email = ?
	`, email)

	var u User

	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash)
	if err != nil {
		return nil, err
	}

	return &u, nil
}
