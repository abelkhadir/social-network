package groupshandler

import (
	"encoding/json"
	"net/http"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func VoteEventHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	var vote models.EventVote
	if err := json.NewDecoder(r.Body).Decode(&vote); err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "invalid request"})
		return
	}
	vote.UserID = r.Context().Value(middleware.UserIDKey).(string)

	groupID, lookupErr := app.GroupPostRepo.GetGroupIDByEvent(vote.ID)
	if lookupErr != nil {
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{"error": "event not found"})
		return
	}
	if !requireMember(app, w, groupID, vote.UserID) {
		return
	}

	err := app.GroupPostRepo.VoteOnEvent(r.Context(), vote)
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
			"error": err.Message,
		})
		return
	}
}
