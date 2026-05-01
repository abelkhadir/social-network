package notificationshandler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"social/internal/app"
	"social/pkg/utils"
)

func ListNotifications(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications", http.MethodGet) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	limit := 50
	if rawLimit := req.URL.Query().Get("limit"); rawLimit != "" {
		if v, err := strconv.Atoi(rawLimit); err == nil && v > 0 {
			limit = v
		}
	}

	notifications, err := application.NotificationRepo.ListByUser(user.ID, limit)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message":       "notifications retrieved successfully",
		"notifications": notifications,
	})
}

func MarkNotificationsRead(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications/read", http.MethodPost) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	var payload struct {
		ID  string `json:"id"`
		All bool   `json:"all"`
	}
	_ = json.NewDecoder(req.Body).Decode(&payload)

	if payload.All || payload.ID == "" {
		if err := application.NotificationRepo.MarkAllRead(user.ID); err != nil {
			utils.HandleError(res, http.StatusInternalServerError, "Failed to mark notifications")
			return
		}
	} else {
		if err := application.NotificationRepo.MarkRead(user.ID, payload.ID); err != nil {
			utils.HandleError(res, http.StatusInternalServerError, "Failed to mark notification")
			return
		}
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "notifications updated",
	})
}

func ListChatNotifications(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications/chat", http.MethodGet) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	counters, err := application.NotificationRepo.ListUnreadMessageCounts(user.ID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to fetch chat notifications")
		return
	}

	counts := make(map[string]int, len(counters))
	totalUnread := 0
	for _, counter := range counters {
		counts[counter.ActorID] = counter.UnreadCount
		totalUnread += counter.UnreadCount
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message":      "chat notifications retrieved successfully",
		"counts":       counts,
		"total_unread": totalUnread,
	})
}

func MarkChatNotificationsRead(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications/chat/read", http.MethodPost) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	var payload struct {
		ActorID string `json:"actor_id"`
	}
	if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if payload.ActorID == "" {
		utils.HandleError(res, http.StatusBadRequest, "Missing actor_id")
		return
	}

	if err := application.NotificationRepo.MarkMessageThreadRead(user.ID, payload.ActorID); err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to mark chat notifications")
		return
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "chat notifications updated",
	})
}

func ListGroupNotifications(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications/groups", http.MethodGet) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	counters, err := application.NotificationRepo.ListUnreadGroupMessageCounts(user.ID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to fetch group notifications")
		return
	}

	counts := make(map[string]int, len(counters))
	totalUnread := 0
	for _, counter := range counters {
		counts[counter.GroupID] = counter.UnreadCount
		totalUnread += counter.UnreadCount
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message":      "group notifications retrieved successfully",
		"counts":       counts,
		"total_unread": totalUnread,
	})
}

func MarkGroupNotificationsRead(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/notifications/groups/read", http.MethodPost) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	var payload struct {
		GroupID string `json:"group_id"`
	}
	if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if payload.GroupID == "" {
		utils.HandleError(res, http.StatusBadRequest, "Missing group_id")
		return
	}

	if err := application.NotificationRepo.MarkGroupThreadRead(user.ID, payload.GroupID); err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to mark group notifications")
		return
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "group notifications updated",
	})
}
