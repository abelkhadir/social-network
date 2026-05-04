package middleware

import (
	"context"
	"database/sql"
<<<<<<< HEAD
=======
	"fmt"
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
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
<<<<<<< HEAD
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err := GetUserIDFromToken(r, "auth_session", db)
		if err != nil {
=======
	fmt.Println("daze min meddileware")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, err :=GetUserIDFromToken(r, "auth_session", db)
		if err != nil {
			fmt.Println("kayn chi mochkil ")
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
			// http.Error(w, "Unauthorized", http.StatusUnauthorized)
			utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}
<<<<<<< HEAD
		ctx := context.WithValue(r.Context(), UserIDKey, userID) // string

		// daba context howa lkay3tini userid m9awad chwiya ana hhh
=======
		fmt.Println("3la slaama  aw9 ", userID)
		ctx := context.WithValue(r.Context(), UserIDKey, userID) // string
		fmt.Println("putting in context:", userID)

		// daba context howa lkay3tini userid m9awad chwiya ana hhh
		fmt.Printf("CTX KEY TYPE: %T\n", UserIDKey)
>>>>>>> 8d06227bb4e592b4936f6b26a8d92cd8af73a3e0
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
