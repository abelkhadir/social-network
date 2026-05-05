package profile

import (
	"encoding/json"
	"net/http"

	"social/internal/profile"
)

type FollowHandler struct {
	repo *profile.ProfileRepository
}

func NewFollowHandler(repo *profile.ProfileRepository) *FollowHandler {
	return &FollowHandler{repo: repo}
}

func (h *FollowHandler) FollowUser(w http.ResponseWriter, r *http.Request) {

	followerID := r.URL.Query().Get("follower_id")
	followingID := r.URL.Query().Get("following_id")

	err := h.repo.FollowUser(followerID, followingID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "followed",
	})
}

func (h *FollowHandler) UnfollowUser(w http.ResponseWriter, r *http.Request) {

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

func (h *FollowHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {

	userID := r.URL.Query().Get("user_id")

	data, err := h.repo.GetUserFollowers("followers", userID)
	if err.Code != 200 {
		http.Error(w, err.Message, err.Code)
		return
	}

	json.NewEncoder(w).Encode(data)
}

func (h *FollowHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {

	userID := r.URL.Query().Get("user_id")

	data, err := h.repo.GetUserFollowers("following", userID)
	if err.Code != 200 {
		http.Error(w, err.Message, err.Code)
		return
	}

	json.NewEncoder(w).Encode(data)
}
