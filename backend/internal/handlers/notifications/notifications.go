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
