package routers

import (
	"encoding/json"
	"net/http"
	"path/filepath"
	"runtime"
	"time"

	"social/internal/app"
	authandler "social/internal/handlers/auth"
	groupshandler "social/internal/handlers/group"
	notificationshandler "social/internal/handlers/notifications"
	posthandler "social/internal/handlers/post"
	"social/internal/handlers/profile"
	profileHandler "social/internal/handlers/profile"
	websockethandler "social/internal/handlers/websocket"
	"social/pkg/middleware"
)

// SetupRoutes registers all routes, using a single *app.Application instance
func SetupRoutes(a *app.Application) {
	rateLimiter := middleware.NewRateLimiter(time.Minute)
	_, thisFile, _, _ := runtime.Caller(0)
	uploadsDir := filepath.Clean(filepath.Join(filepath.Dir(thisFile), "../../uploads"))

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
	followHandler := profileHandler.NewFollowHandler(a)

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

	// Profile routes
	http.Handle("/profile", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		profile.Profile(a, res, req)
	})))
	http.Handle("/profile/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		profile.Profile(a, res, req)
	})))

	// Follow routes
	http.Handle("/follow/accept", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.AcceptFollow)))        // PUT
	http.Handle("/follow/decline", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.DeclineFollow)))      // DELETE
	http.Handle("/follow/pending", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.GetPendingRequests))) // GET
	http.Handle("/follow", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.FollowUser)))                 // POST
	http.Handle("/unfollow", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.UnfollowUser)))             // DELETE
	http.Handle("/followers", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.GetFollowers)))            // GET
	http.Handle("/following", rateLimiter.Wrap("api", http.HandlerFunc(followHandler.GetFollowing)))            // GET

	// Post Handlers
	http.Handle("/post", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.CreatePost(a, res, req)
	})))
	http.Handle("/post/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.GetPost(a, res, req)
	})))
	http.Handle("/posts", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		posthandler.GetAllPosts(a, res, req)
	})))

	// Comment routes
	http.Handle("/comment/",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					posthandler.CreateComment(a, w, r)
				}),
			),
		),
	)

	// Notification routes
	http.Handle("/notifications", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.ListNotifications(a, res, req)
	})))
	http.Handle("/notifications/chat", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.ListChatNotifications(a, res, req)
	})))
	http.Handle("/notifications/read", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.MarkNotificationsRead(a, res, req)
	})))
	http.Handle("/notifications/chat/read", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.MarkChatNotificationsRead(a, res, req)
	})))
	http.Handle("/notifications/groups", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.ListGroupNotifications(a, res, req)
	})))
	http.Handle("/notifications/groups/read", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		notificationshandler.MarkGroupNotificationsRead(a, res, req)
	})))

	// Chat routes
	http.Handle("/chat/users", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.GetUsers(a, res, req)
	})))
	http.Handle("/users", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.GetUsers(a, res, req)
	})))

	http.Handle("/chat/messages/", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.GetMessages(a, res, req)
	})))

	http.Handle("/chat/new", rateLimiter.Wrap("api", http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		websockethandler.SendChatMessage(a, res, req)
	})))

	// Static file serving
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	// Group routes
	http.Handle("/groups/create",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupshandler.CreateGroupHandler(a, w, r)
				}),
			),
		),
	)
	http.Handle("/groups/joined", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetJoinedGroupsHandler(a, w, r)
	}))))
	http.Handle("/groups/suggested", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetSuggestedGroupsHandler(a, w, r)
	}))))

	http.Handle("/groups/request", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.JoinGroupRequestHandler(a, w, r)
	}))))

	http.Handle("/groups/pending/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetGroupPendingMembers(a, w, r)
	}))))

	http.Handle("/groups/request/decision", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.AcceptMemberGroup(a, w, r)
	}))))

	http.Handle("/groups/joined/post/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.AddGroupPost(a, w, r)
	}))))

	http.Handle("/groups/posts/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetGroupPosts(a, w, r)
	}))))
	http.Handle("/groups/joined/members/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetGroupMembersHandler(a, w, r)
	}))))
	http.Handle("/groups/joined/event/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.CreateEventHandler(a, w, r)
	}))))

	http.Handle("/groups/info/",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupshandler.GetGroupInfo(a, w, r)
				}),
			),
		),
	)
	http.Handle("/groups/joined/events/",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupshandler.GetGroupEventsHandler(a, w, r)
				}),
			),
		),
	)
	http.Handle("/groups/events/vote/",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupshandler.VoteEventHandler(a, w, r)
				}),
			),
		),
	)
	http.Handle("/chat/messages/group/",
		rateLimiter.Wrap("api",
			middleware.AuthMiddleware(a.DB,
				http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					groupshandler.
						GetGroupMessages(a, w, r)
				}),
			),
		),
	)

	http.Handle("/groups/invite-user/followers/", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.GetInvitableFollowersHandler(a, w, r)
	}))))
	http.Handle("/groups/invite-user/respond", rateLimiter.Wrap("api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.RespondGroupInvitationHandler(a, w, r)
	})))
	http.Handle("/groups/invite-user", rateLimiter.Wrap("api", middleware.AuthMiddleware(a.DB, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		groupshandler.SendGroupUserInvitationHandler(a, w, r)
	}))))

	// WebSocket
	http.Handle("/ws", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		websockethandler.HandleWebSocket(a, w, r)
	}))
	// Contacts
	http.Handle("/fetchUsers", rateLimiter.Wrap("api", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		profile.NewFollowHandler(a).GetContactHandler(a, w, r)
	})))
}
