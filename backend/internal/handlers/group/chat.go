package handlers

import (
	"net/http"

	"social/pkg/utils"
)

func (h *GroupHandler) GetInfoGroupe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}
	groupId := r.URL.Query().Get("group_id")
	sessionID := r.Context().Value("userID").(int)
	infoGrp, err := h.service.GetInfoGroupeService(groupId, sessionID)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
			"error": err.Error(),
		})
		return
	}
	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": infoGrp,
	})
}

func (h *GroupHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}
	groupId := r.URL.Query().Get("group_id")
	messages, err := h.service.GetGroupMessagesService(groupId)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
			"message": "Error, please try again.",
			"status":  http.StatusInternalServerError,
		})
		return
	}
	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"messages": messages,
	})
}
