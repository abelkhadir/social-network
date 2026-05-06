package groupshandler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
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

func GetJoinedGroupsHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
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

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": groups,
	})
}

func GetSuggestedGroupsHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{"error": "Method not allowed"})
		return
	}
	userID := r.Context().Value(middleware.UserIDKey).(string)
	groups, err := app.GroupPostRepo.GetSuggestedGroups(userID)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"data": groups})
}

func JoinGroupRequestHandler(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{"error": "Method not allowed"})
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(string)
	var body struct {
		GroupID string `json:"group_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.GroupID == "" {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "group_id required"})
		return
	}

	exists, err := app.GroupPostRepo.IsMember(body.GroupID, userID)
	fmt.Println(err, exists)
	if err != nil || exists {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": "Already member"})
		return
	}

	if err := app.GroupPostRepo.SaveJoinRequest(body.GroupID, userID); err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	adminID, err := app.GroupPostRepo.GetGroupAdmin(body.GroupID)
	if err == nil && adminID != "" && adminID != userID {
		requesterName := userID
		if requester, userErr := app.UserRepo.GetUserByID(userID); userErr == nil && requester != nil && strings.TrimSpace(requester.Nickname) != "" {
			requesterName = strings.TrimSpace(requester.Nickname)
		}

		groupTitle := "your group"
		if groupInfo, groupErr := app.GroupMessage.GetInfoGroupeRepo(body.GroupID, 0); groupErr == nil && groupInfo != nil && strings.TrimSpace(groupInfo.Title) != "" {
			groupTitle = strings.TrimSpace(groupInfo.Title)
		}

		notification := models.Notification{
			UserID:     adminID,
			ActorID:    userID,
			Type:       "group_join_request",
			EntityID:   body.GroupID,
			EntityType: "group",
			Content:    requesterName + " requested to join " + groupTitle,
		}
		_ = websockethandler.PushNotification(app, &notification, true)
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"message": "Join request sent"})
}

func GetGroupPendingMembers(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{"error": "Method not allowed"})
		return
	}

	var err error
	var groupId string
	userID := r.Context().Value(middleware.UserIDKey).(string)

	groupId, err = utils.GetGroupIdA(r, "")

	if err != nil || groupId == "" {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "group_id required"})
		return
	}

	// Get admin from group id
	var adminId string

	if adminId, err = app.GroupPostRepo.GetGroupAdmin(groupId); err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	if userID != adminId {
		utils.HandleError(w, 403, "Unauthorized")
		return
	}

	var userIds []string
	if userIds, err = app.GroupPostRepo.GetPendingMembers(groupId); err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	pending := []*models.User{}

	for _, v := range userIds {
		user, err := app.UserRepo.GetUserByID(v)
		if err != nil {
			fmt.Println("Error fetching userid", err)
			continue
		}

		pending = append(pending, user)
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"members": pending})
}

func AcceptMemberGroup(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{"error": "Method not allowed"})
		return
	}

	userID := r.Context().Value(middleware.UserIDKey).(string)
	var body struct {
		GroupID      string `json:"group_id"`
		UserID       string `json:"user_id"`
		DecisionType string `json:"type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.UserID == "" || body.GroupID == "" || body.DecisionType == "" {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{"error": "group_id and user_id and DecisionType required"})
		return
	}

	// Get admin from group id
	var adminId string
	var err error
	if adminId, err = app.GroupPostRepo.GetGroupAdmin(body.GroupID); err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}

	if userID != adminId {
		utils.HandleError(w, 403, "Unauthorized")
		return
	}

	if body.DecisionType == "accept" {
		// save user to groups_members
		if err = app.GroupPostRepo.SaveMemberToGroup(body.GroupID, body.UserID); err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}

		if err = app.GroupPostRepo.CancelGroupRequest(body.GroupID, body.UserID); err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
	}

	if body.DecisionType == "reject" {
		// remove user form request
		if err = app.GroupPostRepo.CancelGroupRequest(body.GroupID, body.UserID); err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
	}

	actorName := userID
	if actor, userErr := app.UserRepo.GetUserByID(userID); userErr == nil && actor != nil && strings.TrimSpace(actor.Nickname) != "" {
		actorName = strings.TrimSpace(actor.Nickname)
	}

	groupTitle := "your group"
	if groupInfo, groupErr := app.GroupMessage.GetInfoGroupeRepo(body.GroupID, 0); groupErr == nil && groupInfo != nil && strings.TrimSpace(groupInfo.Title) != "" {
		groupTitle = strings.TrimSpace(groupInfo.Title)
	}

	notificationType := "group_request_rejected"
	content := actorName + " rejected your request to join " + groupTitle
	if body.DecisionType == "accept" {
		notificationType = "group_request_accepted"
		content = actorName + " accepted your request to join " + groupTitle
	}

	notification := models.Notification{
		UserID:     body.UserID,
		ActorID:    userID,
		Type:       notificationType,
		EntityID:   body.GroupID,
		EntityType: "group",
		Content:    content,
	}
	_ = websockethandler.PushNotification(app, &notification, true)

	// add unsend request
	utils.SendJSONResponse(w, http.StatusOK, map[string]any{"message": "Desision made"})
}

func GetGroupInfo(app *app.Application, w http.ResponseWriter, r *http.Request) {
	groupid, err0 := utils.GetGroupIdA(r, "groups")
	if err0 != nil {
		fmt.Println("Group ID not found", groupid)
		return
	}
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)

	if !ok {
		fmt.Println("userID not found in context")
		utils.SendJSONResponse(w, http.StatusUnauthorized, map[string]any{
			"error": "Unauthorized",
		})
		return
	}
	info, err := app.GroupPostRepo.GetGroup(groupid, userID)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"error": "An error occured",
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, map[string]any{
		"data": info,
	})
}
