package groupshandler

import (
	"encoding/json"
	"net/http"
	"strings"

	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

// GET /groups/invite-user/followers/{groupId}
// Returns connected users (followers/following) who can still be invited.
func GetInvitableFollowersHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := r.Context().Value(middleware.UserIDKey).(string)

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	// /groups/invite-user/followers/{groupId}
	if len(parts) < 4 {
		utils.HandleError(w, http.StatusBadRequest, "Invalid URL")
		return
	}
	groupID := parts[3]

	users, err := application.GroupPostRepo.GetFollowersNotInGroup(groupID, userID)
	if err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if users == nil {
		users = []*models.User{}
	}
	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"users": users})
}

// POST /groups/invite-user
// Body: { "group_id": "...", "user_id": "..." }
// Sends an invitation notification to the target user.
func SendGroupUserInvitationHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userID := r.Context().Value(middleware.UserIDKey).(string)

	var body struct {
		GroupID string `json:"group_id"`
		UserID  string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" || body.UserID == "" {
		utils.HandleError(w, http.StatusBadRequest, "group_id and user_id required")
		return
	}

	// Inviter must be a group member
	isMember, err := application.GroupPostRepo.IsMember(body.GroupID, userID)
	if err != nil || !isMember {
		utils.HandleError(w, http.StatusForbidden, "You must be a group member to invite others")
		return
	}

	// Cannot invite yourself
	if body.UserID == userID {
		utils.HandleError(w, http.StatusBadRequest, "Cannot invite yourself")
		return
	}

	if err := application.GroupPostRepo.SendGroupInvitation(body.GroupID, userID, body.UserID); err != nil {
		utils.HandleError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Build notification content
	inviterName := userID
	if inviter, uErr := application.UserRepo.GetUserByID(userID); uErr == nil && inviter != nil && strings.TrimSpace(inviter.Nickname) != "" {
		inviterName = strings.TrimSpace(inviter.Nickname)
	}
	groupTitle := "a group"
	if groupInfo, gErr := application.GroupMessage.GetInfoGroupeRepo(body.GroupID, 0); gErr == nil && groupInfo != nil && strings.TrimSpace(groupInfo.Title) != "" {
		groupTitle = strings.TrimSpace(groupInfo.Title)
	}

	notification := models.Notification{
		UserID:     body.UserID,
		ActorID:    userID,
		Type:       "group_invitation",
		EntityID:   body.GroupID,
		EntityType: "group",
		Content:    inviterName + " invited you to join " + groupTitle,
	}
	_ = websockethandler.PushNotification(application, &notification, true)

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"message": "Invitation sent"})
}

// POST /groups/invite-user/respond
// Body: { "group_id": "...", "decision": "accept"|"refuse" }
func RespondGroupInvitationHandler(application *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.HandleError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	userInSession, err := application.SessionRepo.GetUserFromSession(r)
	if err != nil {
		utils.HandleError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var body struct {
		GroupID  string `json:"group_id"`
		Decision string `json:"decision"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		utils.HandleError(w, http.StatusBadRequest, "group_id and decision required")
		return
	}
	if body.Decision != "accept" && body.Decision != "refuse" {
		utils.HandleError(w, http.StatusBadRequest, "decision must be 'accept' or 'refuse'")
		return
	}

	if err := application.GroupPostRepo.RespondGroupInvitation(body.GroupID, userInSession.ID, body.Decision); err != nil {
		utils.HandleError(w, http.StatusBadRequest, err.Error())
		return
	}

	if body.Decision == "accept" {
		inviterID, _ := application.GroupPostRepo.GetGroupInviter(body.GroupID, userInSession.ID)
		if inviterID != "" && inviterID != userInSession.ID {
			groupTitle := "your group"
			if groupInfo, gErr := application.GroupMessage.GetInfoGroupeRepo(body.GroupID, 0); gErr == nil && groupInfo != nil {
				groupTitle = strings.TrimSpace(groupInfo.Title)
			}
			joinerName := userInSession.Nickname
			if joinerName == "" {
				joinerName = userInSession.ID
			}
			notification := models.Notification{
				UserID:     inviterID,
				ActorID:    userInSession.ID,
				Type:       "group_request_accepted",
				EntityID:   body.GroupID,
				EntityType: "group",
				Content:    joinerName + " accepted your invitation to join " + groupTitle,
			}
			_ = websockethandler.PushNotification(application, &notification, true)
		}
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message":  "Response recorded",
		"group_id": body.GroupID,
	})
}
