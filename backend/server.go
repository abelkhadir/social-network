package main

import (
	"fmt"
	"log"
	"net/http"

	"social/pkg/db/sqlite"
	"social/pkg/handlers"
	"social/pkg/middleware"
)

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	err := sqlite.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", handlers.LoginHandler)
	mux.HandleFunc("POST /api/register", handlers.RegisterHandler)
	mux.HandleFunc("POST /api/register", handlers.LogoutHandler)

	mux.HandleFunc("GET /api/posts", middleware.RequireAuth(handlers.PostsHandler))

	mux.HandleFunc("POST /api/create_posts", middleware.RequireAuth(handlers.CreatePostHandler))

	mux.HandleFunc("GET /api/users", middleware.RequireAuth(handlers.UsersHandler))

	fmt.Println("Server started at http://localhost:8080")
	log.Panic(http.ListenAndServe(":8080", corsMiddleware(mux)))
}

/*
API structure:

POST   /api/register
POST   /api/login
POST   /api/logout

GET    /api/users/:id

POST   /api/follow
POST   /api/unfollow

GET    /api/posts
POST   /api/posts
POST   /api/comments

GET    /api/groups
POST   /api/groups

GET    /api/notifications

*/
