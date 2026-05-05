package profile

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social/internal/app"
	"social/internal/repositories/profile"
	"social/pkg/middleware"
)

type FollowHandler struct {
	repo *profile.ProfileRepository
}

func NewFollowHandler(repo *profile.ProfileRepository) *FollowHandler {
	return &FollowHandler{repo: repo}
}

func (h *FollowHandler) FollowUser(w http.ResponseWriter, r *http.Request) {
	fmt.Println("------------------------------------------")


	UserID := r.Context().Value(middleware.UserIDKey).(string)

	followerID := r.URL.Query().Get("followerId")

	fmt.Println("//////////////////////////////////",UserID)

	fmt.Println("this is the followerID:", followerID)
	err := h.repo.FollowUser(followerID)
	fmt.Println(err)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	json.NewEncoder(w).Encode(map[string]string{
		"message": "followed",
	})
}

func (h *FollowHandler) UnfollowUserHandler(w http.ResponseWriter, r *http.Request) {
	followerID := r.URL.Query().Get("follower_id")
	followingID := r.URL.Query().Get("following_id")

	err := h.repo.UnfollowUser(followerID, followingID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "unfollowed",
	})
}

func (h *FollowHandler) GetContactHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	fmt.Println(action)
	user, err := application.SessionRepo.GetUserFromSession(r)
	if err != nil {
		//
	}
	data, errorr := h.repo.GetUserFollowersRepo(action, user.ID)
	if errorr.Code != 200 {
		http.Error(w, errorr.Message, errorr.Code)
		return
	}
	fmt.Println(data, "²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²")
	json.NewEncoder(w).Encode(data)
}
