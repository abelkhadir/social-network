package profile

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/utils"
)

type FollowHandler struct {
	app *app.Application
}

func NewFollowHandler(app *app.Application) *FollowHandler {
	return &FollowHandler{app: app}
}

func (h *FollowHandler) FollowUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}


	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	followerID := viewer.ID
	followingID := r.URL.Query().Get("following_id")

	if followingID == "" {
		utils.HandleError(w, http.StatusBadRequest, "following_id is required")
		return
	}

	if followerID == followingID {
		utils.HandleError(w, http.StatusBadRequest, "Cannot follow yourself")
		return
	}

	targetProfile, err := h.app.ProfileRepo.GetProfile(viewer.ID, followingID)
	if err != nil {
		utils.HandleError(w, http.StatusNotFound, "User not found")
		return
	}

	err = h.app.ProfileRepo.FollowUser(followerID, followingID)
	if err != nil {
		utils.HandleError(w,  http.StatusInternalServerError,err.Error())
		return
	}

	actorName := viewer.ID
	if viewer.Nickname != "" {
		actorName = viewer.Nickname
	}

	if !targetProfile.IsPrivate {
		err = h.app.ProfileRepo.AcceptFollow(followerID, followingID)
		if err != nil {
			utils.HandleError(w, http.StatusInternalServerError, "Failed to accept follow")
			return
		}

		notification := models.Notification{
			UserID:     followingID,
			ActorID:    followerID,
			Type:       "follow",
			EntityID:   followerID,
			EntityType: "user",
			Content:    actorName + " started following you",
		}
		_ = websockethandler.PushNotification(h.app, &notification, true)

		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message":   "followed successfully",
			"status":    "accepted",
			"isPending": false,
		})
		return
	}

	notification := models.Notification{
		UserID:     followingID,
		ActorID:    followerID,
		Type:       "follow_request",
		EntityID:   followerID,
		EntityType: "user",
		Content:    actorName + " requested to follow you",
	}
	_ = websockethandler.PushNotification(h.app, &notification, true)

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message":   "follow request sent",
		"status":    "pending",
		"isPending": true,
	})
}

func (h *FollowHandler) UnfollowUser(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	followerID := viewer.ID
	followingID := r.URL.Query().Get("following_id")

	if followingID == "" {
		utils.HandleError(w, http.StatusBadRequest, "following_id is required")
		return
	}

	err = h.app.ProfileRepo.UnfollowUser(followerID, followingID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message": "unfollowed successfully",
	})
}

func (h *FollowHandler) AcceptFollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	followerID := r.URL.Query().Get("follower_id")
	if followerID == "" {
		utils.HandleError(w, http.StatusBadRequest, "follower_id is required")
		return
	}

	followingID := viewer.ID

	err = h.app.ProfileRepo.AcceptFollow(followerID, followingID)
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, "Failed to accept follow request")
		return
	}

	actorName := viewer.ID
	if viewer.Nickname != "" {
		actorName = viewer.Nickname
	}

	notification := models.Notification{
		UserID:     followerID,
		ActorID:    followingID,
		Type:       "follow_accept",
		EntityID:   followingID,
		EntityType: "user",
		Content:    actorName + " accepted your follow request",
	}
	_ = websockethandler.PushNotification(h.app, &notification, true)

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message": "follow request accepted",
	})
}

func (h *FollowHandler) DeclineFollow(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	followerID := r.URL.Query().Get("follower_id")
	if followerID == "" {
		utils.HandleError(w, http.StatusBadRequest, "follower_id is required")
		return
	}

	followingID := viewer.ID

	err = h.app.ProfileRepo.UnfollowUser(followerID, followingID)
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, "Failed to decline follow request")
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message": "follow request declined",
	})
}

func (h *FollowHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := r.URL.Query().Get("user_id")

	if userID == "" {
		userID = viewer.ID
	}

	if userID != viewer.ID {
		targetProfile, err := h.app.ProfileRepo.GetProfile(viewer.ID, userID)
		if err != nil {
			utils.HandleError(w, http.StatusNotFound, "User not found")
			return
		}

		if targetProfile.IsPrivate {
			isFollowing, _ := h.app.ProfileRepo.IsFollowing(viewer.ID, userID)
			if !isFollowing {
				utils.HandleError(w, http.StatusForbidden, "This account is private")
				return
			}
		}
	}

	data, followerErr := h.app.ProfileRepo.GetUserFollowersRepo("following", userID)
	if followerErr.Code != http.StatusOK {
		utils.HandleError(w, followerErr.Code, followerErr.Message)
		return
	}

	json.NewEncoder(w).Encode(data)
}

func (h *FollowHandler) GetPendingRequests(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	requests, repoErr := h.app.ProfileRepo.GetPendingFollowRequests(viewer.ID)
	if repoErr.Code != http.StatusOK {
		utils.HandleError(w, repoErr.Code, repoErr.Message)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"pendingRequests": requests,
	})
}

func (h *FollowHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	viewer, err := h.app.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		userID = viewer.ID
	}

	if userID != viewer.ID {
		targetProfile, err := h.app.ProfileRepo.GetProfile(viewer.ID, userID)
		if err != nil {
			utils.HandleError(w, http.StatusNotFound, "User not found")
			return
		}

		if targetProfile.IsPrivate {
			isFollowing, _ := h.app.ProfileRepo.IsFollowing(viewer.ID, userID)
			if !isFollowing {
				utils.HandleError(w, http.StatusForbidden, "This account is private")
				return
			}
		}
	}

	data, followerErr := h.app.ProfileRepo.GetUserFollowersRepo("followers", userID)
	if followerErr.Code != http.StatusOK {
		utils.HandleError(w, followerErr.Code, followerErr.Message)
		return
	}

	json.NewEncoder(w).Encode(data)
}

func (h *FollowHandler) GetContactHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	action := r.URL.Query().Get("action")
	user, err := application.SessionRepo.GetUserFromSession(r)
	if err != nil {
		fmt.Println("get user inf err:", err)
		return
		//
	}
	data, errorr := h.app.ProfileRepo.GetUserFollowersRepo(action, user.ID)
	if errorr.Code != 200 {
		http.Error(w, errorr.Message, errorr.Code)
		return
	}
	fmt.Println(data, "²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²²")
	json.NewEncoder(w).Encode(data)
}
