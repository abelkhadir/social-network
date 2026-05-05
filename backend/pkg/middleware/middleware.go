package middleware

import (
	"context"
	"database/sql"
	"net/http"

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
		userID, _ := GetUserIDFromToken(r, "auth_session", db)
		// if err != nil {
		// 	// http.Error(w, "Unauthorized", http.StatusUnauthorized)
		// 	utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		// 	return
		// }
		ctx := context.WithValue(r.Context(), UserIDKey, userID) // string

		// daba context howa lkay3tini userid m9awad chwiya ana hhh
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
