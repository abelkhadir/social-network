package authandler

import (
	"net/http"
	"social/internal/app"
	"social/internal/models"
	"social/pkg/utils"
)

// GetUser returns the logged-in user's info
func GetUser(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/profile", http.MethodGet) {
		return
	}

	if !app.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	user, err := app.SessionRepo.GetUserFromSession(req)
	if err != nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	authUser := models.AuthUser{
		ID:         user.ID,
		Nickname:   user.Nickname,
		Username:   user.Nickname,
		Firstname:  user.Firstname,
		Lastname:   user.Lastname,
		Age:        user.Age,
		IsLoggedIn: true,
		Gender:     user.Gender,
		Email:      user.Email,
		AvatarURL:  user.AvatarURL,
		Avatar:     user.AvatarURL,
		AboutMe:    user.AboutMe,
		IsPrivate:  user.IsPrivate == 1,
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "User retrieved successfully",
		"user":    authUser,
	})
}
