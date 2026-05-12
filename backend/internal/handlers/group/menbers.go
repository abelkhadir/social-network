package groupshandler

import (
	"net/http"

	"social/internal/app"
	"social/pkg/middleware"
	"social/pkg/utils"
)

func GetGroupMembersHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	groupIDStr, errId := utils.GetGroupId(r, "members")

	if errId != nil {
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"error": errId,
		})
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(string)
	if !requireMember(app, w, groupIDStr, userID) {
		return
	}

	// // events, err := h.service.GetGroupMembers(groupIDStr)
	Members, err := app.GroupPostRepo.GetGroupMembers(groupIDStr)

	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, map[string]any{
			"error": err.Message,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": Members,
	})
}

// func (h *GroupHandler) VoteEventHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	var vote models.EventVote
// 	if err := json.NewDecoder(r.Body).Decode(&vote); err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": "Bad Reauest",
// 		})
// 		return
// 	}
// 	vote.UserID = r.Context().Value("userID").(int)
// 	err := h.service.VoteOnEvent(r.Context(), vote)
// 	if err.Code != http.StatusOK {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Message,
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"message": "Event voted succefully!",
// 	})
// }
