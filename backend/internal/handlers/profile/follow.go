package profile

import (
	"encoding/json"
	"net/http"

	"social/internal/repository"
)

type FollowHandler struct {
	repo *repository.ProfileRepository
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
