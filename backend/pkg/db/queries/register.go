package queries

import (
	"social/pkg/db/sqlite"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"about_me"`
}

func CreateUser(req RegisterRequest) error {
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }

    userID := uuid.New().String()

    _, err = sqlite.DB.Exec(`
        INSERT INTO users (id, email, password_hash, first_name, last_name, date_of_birth, nickname, about_me)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, userID, req.Email, string(hashedPassword), req.FirstName, req.LastName, req.DateOfBirth, req.Nickname, req.AboutMe)

    return err
}