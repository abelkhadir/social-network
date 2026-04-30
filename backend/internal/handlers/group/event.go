package groupshandler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func CreateEventHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	var event models.Event
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"error": err.Error(),
		})
		return
	}
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		utils.SendJSONResponse(w, http.StatusUnauthorized, map[string]any{
			"error": "Unauthorized",
		})
		return
	}

	event.UserID = userID

	if event.EventDate.Before(time.Now()) {
		utils.SendJSONResponse(w, 400, map[string]any{
			"error": "event is before the current date",
		})
		return
	}

	if event.EventDate.After(time.Now().AddDate(5, 0, 0)) {
		utils.SendJSONResponse(w, 400, map[string]any{
			"error": "event can only be up to 5 years",
		})
		return
	}
	newevent, err := app.GroupPostRepo.SaveEvent(r.Context(), &event)
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"message": "Event created succefully!",
		"data":    newevent,
	})
}

func GetGroupEventsHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	groupIDStr, errId := utils.GetGroupId(r, "events")

	if errId != nil {
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"error": errors.New(errId.Error()),
		})
		return
	}
	UserID := r.Context().Value(middleware.UserIDKey).(string)
	events, err := app.GroupPostRepo.GetGroupEvents(UserID, groupIDStr)
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": events,
	})
}
