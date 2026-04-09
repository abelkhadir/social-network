package main

import (
	"log"
	"net/http"
	"os"
	"social/internal/app"
	"social/internal/routers"
	"social/pkg/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	frontendOrigin := os.Getenv("FRONTEND_ORIGIN")
	if frontendOrigin == "" {
		frontendOrigin = "http://localhost:3000"
	}
	myApp := app.NewApp()
	go myApp.SessionRepo.DeleteExpiredSessions()

	routers.SetupRoutes(myApp)
		root := middleware.CORSMiddleware(frontendOrigin)(http.DefaultServeMux)

	log.Printf("Server running on port %s\n", port)
	if err := http.ListenAndServe(":"+port, root); err != nil {
		log.Fatal(err)
	}
}
