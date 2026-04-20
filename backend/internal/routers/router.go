package routers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"social/internal/app"
	authandler "social/internal/handlers/auth"
	notificationshandler "social/internal/handlers/notifications"
	posthandler "social/internal/handlers/post"
	"social/internal/handlers/profile"
	websockethandler "social/internal/handlers/websocket"
	"social/pkg/middleware"
)

// SetupRoutes registers all routes, using a single *app.Application instance
func SetupRoutes(a *app.Application) {
	rateLimiter := middleware.NewRateLimiter(time.Minute)

	// Static uploads (avatars, post images)
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/"))))

	// Single Page
	// http.Handle("/", rateLimiter.Wrap("auth", http.HandlerFunc(handler.Index)))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]string{
				"status":   "Online",
				"message":  "social API is running",
				"frontend": "http://localhost:3000",
			})
			return
		}
		return
	})

	// Authentication
	http.Handle("/me", rateLimiter.Wrap("auth", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		authandler.Me(a, res, req)
	})))
	http.Handle("/sign-up", rateLimiter.Wrap("auth", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		authandler.SignUp(a, res, req)
	})))
	http.Handle("/sign-in", rateLimiter.Wrap("auth", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		authandler.SignIn(a, res, req)
	})))
	http.Handle("/logout", rateLimiter.Wrap("auth", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		authandler.Logout(a, res, req)
	})))
	//================== Profile routes =======================///
	http.Handle("/profile", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		profile.Profile(a, res, req)
	})))
	http.Handle("/profile/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		profile.Profile(a, res, req)
	})))

	// Post Handlers
	http.Handle("/post", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.CreatePost(a, res, req)
	})))
	http.Handle("/post/", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.GetPost(a, res, req)
	}))
	http.Handle("/posts", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.GetAllPosts(a, res, req)
	}))

	// Categories
	http.Handle("/categories", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.GetaAllCategory(a, res, req)
	})))

	// Comment Handlers
	http.Handle("/comment/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.CreateComment(a, res, req)
	})))

	// Notifications
	http.Handle("/notifications", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.ListNotifications(a, res, req)
	})))
	http.Handle("/notifications/read", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.MarkNotificationsRead(a, res, req)
	})))

	// Chat Handlers
	http.Handle("/chat/users", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.GetUsers(a, res, req)
	})))
	http.Handle("/chat/messages/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.GetMessages(a, res, req)
	})))
	http.Handle("/chat/new", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.SendChatMessage(a, res, req)
	})))
	// groups
	// http.Handle("/groups/create", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
	// 	fmt.Println("the user want to create gouuup")
	// 	websockethandler.SendChatMessage(a, res, req)
	// })))
	http.HandleFunc("/api/groups/create",func (w http.ResponseWriter,r *http.Request)  {
		fmt.Print("the use want to create group")
	})
	// WebSocket
	http.Handle("/ws", http.HandlerFunc(websockethandler.HandleWebSocket))
}
