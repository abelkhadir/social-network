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

// type GroupHandler struct {
// 	service *services.GroupService
// }

// func NewGroupHandler(service *services.GroupService) *GroupHandler {
// 	return &GroupHandler{service: service}
// }

func CreateGroupHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if utils.ValidateRequest(r, w, "/groups/create", http.MethodPost) {
	}
	fmt.Println("the user want to create a group let see if he can fgfgdgdf")

	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	var group models.Group

	if err := json.NewDecoder(r.Body).Decode(&group); err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"error": "Invalid JSON",
		})
		return
	}

	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
		if !ok {
				fmt.Println("userID not found in context")
	// fmt.Printf("CTX KEY TYPE HANDLER: %T\n",userID)
			utils.SendJSONResponse(w, http.StatusUnauthorized, map[string]any{
		"error": "Unauthorized",
	})
	return
	}	

	group.UserID = userID

	groupId, gErr := app.GroupPostRepo.SaveGroup(&group)
	if gErr != nil {
		utils.SendJSONResponse(w, gErr.Code, map[string]any{
			"error": gErr.Message,
		})
		return
	}
	// if groupId==-1{
	// 	utils.SendJSONResponse(w, gErr.Code, map[string]any{
	// 		"error": gErr.Message,
	// 	})
	// 	return
	// }
	group.ID = groupId

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data":    group,
		"message": "Group created successfully",
	})
}

func  GetJoinedGroupsHandler(app *app.Application ,w http.ResponseWriter, r *http.Request) {
	fmt.Println("the user bghaaaa groups")
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"error": "Method not allowed",
		})
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(string)

	// groups, err := h.service.GetJoinedGroups(userID)
	groups, err := app.GroupPostRepo.GetJoinedGroups(userID)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
			"error": err.Error(),
		})
		return
	}
	fmt.Println("___________________________________________________")
	fmt.Println("the grouuups that the user createeeed 🇲🇽 ",groups)
	for i := 0; i < len(groups); i++ {
		fmt.Println("the groups that we have ",groups[i])
	}
	
	fmt.Println("___________________________________________________")

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": groups,
	})
}

// func (h *GroupHandler) GetSuggestedGroupsHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodGet {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	userID := r.Context().Value("userID").(int)

// 	groups, err := h.service.GetSuggestedGroups(userID)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"data": groups,
// 	})
// }

// func (h *GroupHandler) GetGroupHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodGet {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	GroupID, err := utils.GetGroupId(r, "events")
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
// 			"error": "Invalid Url",
// 		})
// 		return
// 	}
// 	userId := r.Context().Value("userID").(int)

// 	groupinfo, errr := h.service.GetGroup(GroupID, userId)

// 	if errr != nil {
// 		utils.SendJSONResponse(w, errr.Code, map[string]any{
// 			"error": errr.Message,
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"data": groupinfo,
// 	})
// }

// func (h *GroupHandler) JoinGroupRequestHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	var groupRequest *models.GroupRequest
// 	if err := json.NewDecoder(r.Body).Decode(&groupRequest); err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 	}

// 	groupRequest.SenderID = r.Context().Value("userID").(int)

// 	reqID, err := h.service.SaveJoinGroupRequest(groupRequest)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"message":    "Request sended succesfully!",
// 		"request_id": reqID,
// 	})
// }

// func (h *GroupHandler) CancelGroupRequestHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	var groupRequest *models.GroupRequest
// 	if err := json.NewDecoder(r.Body).Decode(&groupRequest); err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 	}

// 	err := h.service.CancelGroupRequest(groupRequest.ID)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"message": "Request Cancled succesfully!",
// 	})
// }

// func (h *GroupHandler) GetGroupNotifsHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodGet {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"error": "Method not allowed",
// 		})
// 		return
// 	}

// 	requestedID := r.Context().Value("userID").(int)

// 	groupNotifs, err := h.service.GetGroupNotifs(requestedID)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{
// 			"error": err.Error(),
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
// 		"data": groupNotifs,
// 	})
// }