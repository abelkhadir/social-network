package middleware

import (
	"context"
	"database/sql"
	"net/http"

	"social/pkg/utils"
)

// Request
//
//	↓
//
// Middleware (DB query → check token)
//
//	↓
//
// Context فيه userID
//
//	↓
//
// Handler (يستعمل userID فقط)

func AuthMiddleware(db *sql.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := GetUserIDFromToken(r, "auth_session", db)
		if err != nil {
			utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		ctx := context.WithValue(r.Context(), UserIDKey, userID) // string

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
