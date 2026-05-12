package main

import (
	"log"
	"net/http"

	"social/internal/app"
	"social/internal/routers"
	"social/pkg/config"
	"social/pkg/middleware"
)

func main() {
	cfg := config.Load("conf.json")
	myApp := app.NewApp(cfg.Database)
	go myApp.SessionRepo.DeleteExpiredSessions()

	routers.SetupRoutes(myApp)
	root := middleware.CORSMiddleware(cfg.FrontendOrigin)(http.DefaultServeMux)

	log.Printf("[][] Server running on port %s\n", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, root); err != nil {
		log.Fatal(err)
	}
}
