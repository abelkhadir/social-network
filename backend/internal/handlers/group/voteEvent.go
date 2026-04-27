package groupshandler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func VoteEventHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("VOtttttttttttttttttttttttttte")
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	var vote models.EventVote
	if err := json.NewDecoder(r.Body).Decode(&vote); err != nil {
		return
	}
	vote.UserID = r.Context().Value(middleware.UserIDKey).(string)
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	fmt.Println("the useer voteeer",vote.UserID)
	fmt.Println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
	// err := .service.VoteOnEvent(r.Context(), vote)
	err := app.GroupPostRepo.VoteOnEvent(r.Context(), vote)
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
			"error": err.Message,
		})
		return
	}
}
