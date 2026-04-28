package groupshandler

import (
	"fmt"
	"net/http"
	"strings"

	"social/internal/app"
	"social/pkg/utils"
)

// func (h *GroupHandler) GetInfoGroupe(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodGet {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}
// 	groupId := r.URL.Query().Get("group_id")
// 	sessionID := r.Context().Value("userID").(int)
// 	infoGrp, err := h.service.GetInfoGroupeService(groupId, sessionID)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 		return
// 	}
// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"data": infoGrp,
// 	})
// }

func GetGroupMessages(app *app.Application, w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}
	// groupId := r.URL.Query().Get("group_id")
	// groupIDStr:=r.URL.Path
	path := r.URL.Path
	parts := strings.Split(path, "/")
	groupid := parts[4]
	groupid = strings.TrimSpace(groupid)
	// groupIDStr, errId := utils.GetGroupId(r, "members")

	// messages, err := h.service.GetGroupMessagesService(groupid)
	messages, err := app.GroupPostRepo.GetGroupMessagesRepo(groupid)

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

func SendChatMessage(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("-------------------------------------")
	fmt.Println("hee   want to sent messages in grouuup")
	fmt.Println("-------------------------------------")
	if !utils.ValidateRequest(req, res, "/chat/group/new", http.MethodPost) {
		return
	}

	// if !application.SessionRepo.ValidSession(req) {
	// 	utils.HandleError(res, http.StatusUnauthorized, "No active session")
	// 	return
	// }

	// currentUser, _ := application.SessionRepo.GetUserFromSession(req)

	// var payload struct {
	// 	ReceiverID string `json:"receiverID"`
	// 	Text       string `json:"text"`
	// }
	// if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
	// 	utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
	// 	return
	// }

	// payload.Text = strings.TrimSpace(payload.Text)
	// if payload.ReceiverID == "" || payload.Text == "" {
	// 	utils.HandleError(res, http.StatusBadRequest, "Missing receiver or message text")
	// 	return
	// }

	// message := models.Message{
	// 	SenderID:   currentUser.ID,
	// 	ReceiverID: payload.ReceiverID,
	// 	Text:       payload.Text,
	// }

	// if err := application.MessageRepo.CreateMessage(&message); err != nil {
	// 	utils.HandleError(res, http.StatusInternalServerError, "Failed to save message")
	// 	return
	// }

	// saved, err := application.MessageRepo.GetMessageByID(message.ID)
	// if err != nil {
	// 	utils.HandleError(res, http.StatusInternalServerError, "Failed to load saved message")
	// 	return
	// }

	// // SendMessage(*saved)

	// utils.SendJSONResponse(res, http.StatusOK, map[string]any{
	// 	"message": "message sent successfully",
	// 	"data":    saved,
	// })
}

