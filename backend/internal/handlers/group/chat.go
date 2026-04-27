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
	fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")
	fmt.Println("((((((((((((((((((((((((((he enter to get messages ))))))))))))))))))))))))))")
	fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")

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
	groupid=strings.TrimSpace(groupid)
	// groupIDStr, errId := utils.GetGroupId(r, "members")

	// fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")
	// fmt.Println("((((((((((((((((((((((((((the grouup id ))))))))))))))))))))))))))", groupid)
	// fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")

	// messages, err := h.service.GetGroupMessagesService(groupid)
	messages,err:= app.GroupPostRepo.GetGroupMessagesRepo(groupid)

	fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")
	fmt.Println("((((((((((((((((((((((((((messages))))))))))))))))))))))))))", messages)
	fmt.Println("((((((((((((((((((((((((((the error))))))))))))))))))))))))))", err)
	fmt.Println("(((((((((((((((((((((((((())))))))))))))))))))))))))")
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
