package sessions

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"social/internal/models"
	"time"

	"github.com/gofrs/uuid"
	"social/internal/repositories/auth"
)

type SessionRepository struct {
	db       *sql.DB
	UserRepo *auth.UserRepository
}

func NewSessionRepository(db *sql.DB, userRepo *auth.UserRepository) *SessionRepository {
	return &SessionRepository{
		db:       db,
		UserRepo: userRepo,
	}
}

const SessionExpiry = 2 * time.Hour

// 🔹 Create New Session
func (sb *SessionRepository) NewSessionToken(res http.ResponseWriter, userID string) error {
	token := generateSessionToken()
	expireAt := time.Now().Add(SessionExpiry)

	// Delete existing session for this user (1 session per user)
	_, err := sb.db.Exec("DELETE FROM sessions WHERE user_id = ?", userID)
	if err != nil {
		return err
	}

	// Insert new session
	_, err = sb.db.Exec(
		"INSERT INTO sessions(token, user_id, expire_at) VALUES (?, ?, ?)",
		token,
		userID,
		expireAt,
	)
	if err != nil {
		return err
	}

	http.SetCookie(res, &http.Cookie{
		Name:     "auth_session",
		Value:    token,
		HttpOnly: true,
		Expires:  expireAt,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Secure:   false, // set true in HTTPS
	})

	return nil
}

// 🔹 Validate Session
func (sb *SessionRepository) ValidSession(req *http.Request) bool {
	cookie, err := req.Cookie("auth_session")
	if err != nil {
		return false
	}

	var expireAt time.Time
	err = sb.db.QueryRow(
		"SELECT expire_at FROM sessions WHERE token = ?",
		cookie.Value,
	).Scan(&expireAt)

	if err != nil {
		return false
	}

	if time.Now().After(expireAt) {
		// auto delete expired session
		sb.db.Exec("DELETE FROM sessions WHERE token = ?", cookie.Value)
		return false
	}

	return true
}

// 🔹 Get User From Session
func (sb *SessionRepository) GetUserFromSession(req *http.Request) (*models.User, error) {
	cookie, err := req.Cookie("auth_session")
	if err != nil {
		return nil, errors.New("no session cookie")
	}

	var userID string
	var expireAt time.Time

	err = sb.db.QueryRow(
		"SELECT user_id, expire_at FROM sessions WHERE token = ?",
		cookie.Value,
	).Scan(&userID, &expireAt)

	if err != nil {
		return nil, errors.New("invalid session")
	}

	if time.Now().After(expireAt) {
		sb.db.Exec("DELETE FROM sessions WHERE token = ?", cookie.Value)
		return nil, errors.New("session expired")
	}

	// ✅ Use injected UserRepo to fetch user
	user, err := sb.UserRepo.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

// 🔹 Delete Session (Logout)
func (sb *SessionRepository) DeleteSession(req *http.Request) error {
	cookie, err := req.Cookie("auth_session")
	if err != nil {
		return errors.New("no cookie found")
	}

	_, err = sb.db.Exec("DELETE FROM sessions WHERE token = ?", cookie.Value)
	if err != nil {
		return err
	}

	return nil
}

// 🔹 Clean Expired Sessions (optional background job)
func (sb *SessionRepository) DeleteExpiredSessions() {
	for range time.Tick(30 * time.Minute) {
		_, err := sb.db.Exec("DELETE FROM sessions WHERE expire_at < ?", time.Now())
		if err != nil {
			log.Println("Failed to clean sessions:", err)
		}
	}
}

// 🔹 Generate Token
func generateSessionToken() string {
	id, err := uuid.NewV4()
	if err != nil {
		log.Fatal("Failed to generate UUID:", err)
	}
	return id.String()
}