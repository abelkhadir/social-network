package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"social/pkg/db/queries"
	"social/pkg/response"

	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

const cookieName = "session_token"

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	errV := validateLoginReq(&req)
	if len(errV) > 0 {
		response.MultiError(w, errV, http.StatusBadRequest)
		return
	}
	user, err := queries.GetUserByEmail(req.Email)
	if err == sql.ErrNoRows {
		response.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	if err != nil {
		response.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		response.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	sessionID, err := queries.CreateSession(user.ID)
	if err != nil {
		response.Error(w, "internal server error", http.StatusInternalServerError)
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    sessionID,
		Expires:  time.Now().Add(24 * time.Hour),
		Path:     "/",
		HttpOnly: true,
	})
	response.Success(w, "login successful", http.StatusOK)
}

func validateLoginReq(req *LoginRequest) map[string]string {
	errs := make(map[string]string)
	if req.Email == "" {
		errs["email"] = "email is required"
	} else {
		if !emailRegex.MatchString(req.Email) {
			errs["email"] = "invalid email format"
		}
	}
	if req.Password == "" {
		errs["password"] = "password is required"
	}
	return errs
}
