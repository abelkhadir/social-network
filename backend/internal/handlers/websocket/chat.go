package websockethandler

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"social/internal/app"
	"social/internal/models"
	"social/pkg/utils"
	"strings"
	"sync"
	"time"
)

var (
	avatarOnce    sync.Once
	avatarChoices []string
	avatarRand    = rand.New(rand.NewSource(time.Now().UnixNano()))
	avatarRandMu  sync.Mutex
)

func loadAvatarChoices() {
	entries, err := os.ReadDir("frontend/img/profile")
	if err != nil {
		avatarChoices = []string{"/img/profile/33fd017ee746e5f89d1dcf412fedf746f9c63078e839f66378041102c23d3fff.jpeg"}
		return
	}

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		ext := strings.ToLower(filepath.Ext(name))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
			continue
		}
		avatarChoices = append(avatarChoices, "/img/profile/"+name)
	}

	if len(avatarChoices) == 0 {
		avatarChoices = []string{"/img/profile/33fd017ee746e5f89d1dcf412fedf746f9c63078e839f66378041102c23d3fff.jpeg"}
	}
}

func randomProfileAvatar() string {
	avatarOnce.Do(loadAvatarChoices)
	if len(avatarChoices) == 0 {
		return ""
	}
	avatarRandMu.Lock()
	idx := avatarRand.Intn(len(avatarChoices))
	avatarRandMu.Unlock()
	return avatarChoices[idx]
}

func GetUsers(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("the user bgha userd for chat okay")

	if !utils.ValidateRequest(req, res, "/chat/users", http.MethodGet) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	currentUser, _ := application.SessionRepo.GetUserFromSession(req)

	users, err := application.UserRepo.SelectAllUsers(currentUser.ID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	type chatUser struct {
		ID          string `json:"id"`
		Nickname    string `json:"nickname"`
		AvatarURL   string `json:"avatar_url"`
		IsConnected bool   `json:"is_connected"`
	}

	var response []chatUser
	for _, u := range users {
		avatarURL := u.AvatarURL
		if avatarURL == "" {
			avatarURL = randomProfileAvatar()
		}
		response = append(response, chatUser{
			ID:          u.ID,
			Nickname:    u.Nickname,
			AvatarURL:   avatarURL,
			IsConnected: IsUserConnected(u.ID),
		})
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "users retrieved successfully",
		"users":   response,
	})
}

func GetMessages(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/chat/messages/*", http.MethodGet) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	currentUser, _ := application.SessionRepo.GetUserFromSession(req)
	pathParts := strings.Split(req.URL.Path, "/")
	if len(pathParts) < 4 {
		utils.HandleError(res, http.StatusBadRequest, "Invalid URL format")
		return
	}
	otherUserID := pathParts[3]

	talker, err := application.UserRepo.GetUserByID(otherUserID)
	if err != nil || talker == nil {
		utils.HandleError(res, http.StatusNotFound, "User not found")
		return
	}

	messages, err := application.MessageRepo.GetMessagesBetween(currentUser.ID, otherUserID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	type talkerInfo struct {
		ID          string `json:"id"`
		Nickname    string `json:"nickname"`
		AvatarURL   string `json:"avatar_url"`
		IsConnected bool   `json:"is_connected"`
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "messages retrieved successfully",
		"talker": talkerInfo{
			ID:          talker.ID,
			Nickname:    talker.Nickname,
			AvatarURL:   talker.AvatarURL,
			IsConnected: IsUserConnected(talker.ID),
		},
		"messages": messages,
	})
}

func SendChatMessage(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/chat/new", http.MethodPost) {
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	currentUser, _ := application.SessionRepo.GetUserFromSession(req)

	var payload struct {
		ReceiverID string `json:"receiverID"`
		Text       string `json:"text"`
	}
	if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	payload.Text = strings.TrimSpace(payload.Text)
	if payload.ReceiverID == "" || payload.Text == "" {
		utils.HandleError(res, http.StatusBadRequest, "Missing receiver or message text")
		return
	}

	message := models.Message{
		SenderID:   currentUser.ID,
		ReceiverID: payload.ReceiverID,
		Text:       payload.Text,
	}

	if err := application.MessageRepo.CreateMessage(&message); err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to save message")
		return
	}

	saved, err := application.MessageRepo.GetMessageByID(message.ID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to load saved message")
		return
	}

	SendMessage(*saved)

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "message sent successfully",
		"data":    saved,
	})
}
