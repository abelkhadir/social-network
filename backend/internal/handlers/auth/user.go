package authandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"

	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/utils"
)

// SignUp registers a new user
func SignUp(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/sign-up", http.MethodPost) {
		return
	}
	
	var user models.User
	if err := json.NewDecoder(req.Body).Decode(&user); err != nil {
		// fmt.Println("fomat user now good")
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}
	// fmt.Println("the user id is ", user.ID)
	if err := validateSignUpInput(&user); err != nil {
		utils.HandleError(res, http.StatusBadRequest, err.Error())
		return
	}
	
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Error hashing password")
		return
	}
	user.Password = hashedPassword
	
	if err := app.UserRepo.CreateUser(&user); err != nil {
		// Check for SQLite constraint error (duplicate nickname/email)
		if sqliteErr, ok := err.(interface{ Code() int }); ok && sqliteErr.Code() == 19 {
			utils.HandleError(res, http.StatusConflict, "Nickname or Email already exists")
			return
		}
		utils.HandleError(res, http.StatusInternalServerError, "Error creating user")
		return
	}
	
	err=app.SessionRepo.NewSessionToken(res, user.ID)
	if err!=nil{
		fmt.Println("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	}

	notification := models.Notification{
		UserID:  user.ID,
		Type:    "welcome",
		Content: "Welcome to social! Your account is ready.",
	}
	if err := app.NotificationRepo.Create(&notification); err == nil {
		websockethandler.SendNotification(notification)
	}

	authUser := models.AuthUser{
		ID:        user.ID,
		Nickname:  user.Nickname,
		Username:  user.Nickname,
		Firstname: user.Firstname,
		Lastname:  user.Lastname,
		Age:       user.Age,
		Gender:    user.Gender,
		Email:     user.Email,
		AvatarURL: user.AvatarURL,
		Avatar:    user.AvatarURL,
		AboutMe:   user.AboutMe,
		IsPrivate: user.IsPrivate == 1,
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "User created successfully",
		"user":    authUser,
	})
}

// SignIn logs in a user
func SignIn(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/sign-in", http.MethodPost) {
		return
	}

	var login models.UserSignIn
	if err := json.NewDecoder(req.Body).Decode(&login); err != nil {
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if err := validateSignInInput(login); err != nil {
		utils.HandleError(res, http.StatusBadRequest, err.Error())
		return
	}

	user, exists := app.UserRepo.IsExistedByIdentifiant(login.Identifiant)
	if !exists || user == nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if !utils.CheckPasswordHash(login.Password, user.Password) {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	app.SessionRepo.NewSessionToken(res, user.ID)
	loginNotification := models.Notification{
		UserID:  user.ID,
		Type:    "login",
		Content: "You logged in successfully.",
	}
	if err := app.NotificationRepo.Create(&loginNotification); err == nil {
		websockethandler.SendNotification(loginNotification)
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
		"message": "Login successful",
		"user":    authUser,
	})
}

// Logout ends the user's session
func Logout(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/logout", http.MethodDelete) {
		return
	}

	if app.SessionRepo.ValidSession(req) {
		app.SessionRepo.DeleteSession(req)
		utils.SendJSONResponse(res, http.StatusOK, map[string]string{"message": "Logout successful"})
	} else {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
	}
}

// Me returns the currently logged-in user's info
func Me(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !utils.ValidateRequest(req, res, "/me", http.MethodGet) {
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
		"message": "Get me successful",
		"user":    authUser,
	})
}

// Validation helpers
var ErrMissingRequiredFields = errors.New("missing required fields")

func validateSignUpInput(user *models.User) error {
	if user.Nickname == "" || user.Email == "" || user.Password == "" {
		return ErrMissingRequiredFields
	}
	user.Nickname = html.EscapeString(user.Nickname)
	user.Email = html.EscapeString(user.Email)
	user.Password = html.EscapeString(user.Password)
	return nil
}

func validateSignInInput(login models.UserSignIn) error {
	if login.Identifiant == "" || login.Password == "" {
		return ErrMissingRequiredFields
	}
	return nil
}
