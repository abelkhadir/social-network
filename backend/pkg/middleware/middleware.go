package middleware

import (
	"context"
	"database/sql"
	"fmt"
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
type ContextKey string

const UserIDKey ContextKey = "userID"
func AuthMiddleware(db *sql.DB, next http.Handler) http.Handler {
	fmt.Println("daze min meddileware")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := GetUserIDFromToken(r, "auth_session", db)
		if err != nil {
			fmt.Println("kayn chi mochkil ")
			// http.Error(w, "Unauthorized", http.StatusUnauthorized)
			utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
		fmt.Println("3la slaama  aw9 ", userID)
		ctx := context.WithValue(r.Context(),UserIDKey, userID) // string
		fmt.Println("putting in context:", userID)

		// daba context howa lkay3tini userid m9awad chwiya ana hhh
		fmt.Printf("CTX KEY TYPE: %T\n", UserIDKey)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
