package authandler

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gofrs/uuid"
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
	contentType := req.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := req.ParseMultipartForm(20 * 1024 * 1024); err != nil {
			utils.HandleError(res, http.StatusBadRequest, "Invalid multipart form")
			log.Printf("Error parsing multipart form: %v", err)
			return
		}

		user.Nickname = req.FormValue("nickname")
		user.Firstname = req.FormValue("firstname")
		user.Lastname = req.FormValue("lastname")
		user.DateOfBirth = req.FormValue("date")

		user.Gender = req.FormValue("gender")
		user.Email = req.FormValue("email")
		user.Password = req.FormValue("password")
		user.ConfirmPassword = req.FormValue("confirmpassword")

		user.AboutMe = req.FormValue("about")

		// Handle avatar file upload
		file, header, fileErr := req.FormFile("avatar")
		if fileErr == nil {
			defer file.Close()
			buf := make([]byte, 512)
			n, err := file.Read(buf)
			if err != nil && err != io.EOF {
				utils.HandleError(res, http.StatusBadRequest, "Failed to read avatar")
				return
			}
			mimeType := http.DetectContentType(buf[:n])
			ext := ""
			switch mimeType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			default:
				utils.HandleError(res, http.StatusBadRequest, "Invalid image type. Only JPEG, PNG, GIF allowed")
				return
			}
			if header.Size > 5<<20 {
				utils.HandleError(res, http.StatusBadRequest, "Avatar must be under 5MB")
				return
			}
			if err := os.MkdirAll("./uploads/avatars", 0o755); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to prepare uploads directory")
				return
			}
			imageID, err := uuid.NewV4()
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to generate avatar id")
				return
			}
			filename := imageID.String() + ext
			dstPath := filepath.Join("./uploads/avatars", filename)
			dstFile, err := os.Create(dstPath)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to save avatar")
				return
			}
			defer dstFile.Close()
			reader := io.MultiReader(bytes.NewReader(buf[:n]), file)
			if _, err := io.Copy(dstFile, reader); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to write avatar")
				return
			}
			user.AvatarURL = "/uploads/avatars/" + filename
		} else if fileErr != http.ErrMissingFile {
			utils.HandleError(res, http.StatusBadRequest, "Invalid avatar upload")
			return
		}

	} else {
		if err := json.NewDecoder(req.Body).Decode(&user); err != nil {
			utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
			log.Printf("Error decoding JSON: %v", err)
			return
		}
	}
	if user.Password != user.ConfirmPassword {
		utils.HandleError(res, http.StatusBadRequest, "Passwords do not match")
		return
	}
	if user.DateOfBirth != "" {
		age, err := CalculateAge(user.DateOfBirth)
		if err != nil {
			utils.HandleError(res, http.StatusBadRequest, "Invalid date format")
			log.Printf("Error calculating age: %v", err)
			return
		}
		user.Age = age
		if age < 18 || age > 100 {
			utils.HandleError(res, http.StatusBadRequest, "Age must be between 18 and 100")
			return
		}
	}
	if err := validateSignUpInput(&user); err != nil {
		utils.HandleError(res, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "samething went wrong")
		log.Printf("Error hashing password: %v", err)
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

	err = app.SessionRepo.NewSessionToken(res, user.ID)
	if err != nil {
		fmt.Println("Error making session token")
		utils.HandleError(res, http.StatusInternalServerError, "something went wrong")
		return
	}

	notification := models.Notification{
		UserID:  user.ID,
		Type:    "welcome",
		Content: "Welcome to social! Your account is ready.",
	}
	_ = websockethandler.PushNotification(app, &notification, false)

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
	_ = websockethandler.PushNotification(app, &loginNotification, false)

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
var (
	ErrMissingRequiredFields = errors.New("missing required fields")
	emailRegex               = regexp.MustCompile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
	NicknameRegex            = regexp.MustCompile("^[a-zA-Z0-9_-]{3,20}$")
	nameRegex                = regexp.MustCompile("^[a-zA-Z]+$")
)

func validateSignUpInput(user *models.User) error {
	if strings.TrimSpace(user.Email) == "" || strings.TrimSpace(user.Password) == "" || strings.TrimSpace(user.Firstname) == "" || strings.TrimSpace(user.Lastname) == "" {
		return ErrMissingRequiredFields
	}
	if !emailRegex.MatchString(user.Email) {
		return errors.New("invalid email format")
	}
	if len(user.Nickname) > 0 && !NicknameRegex.MatchString(user.Nickname) {
		return errors.New("invalid nickname format must be 3-20 characters containing letters, numbers, underscores or hyphens")
	}
	if !nameRegex.MatchString(user.Firstname) {
		return errors.New("invalid first name format must contain only letters")
	}
	if !nameRegex.MatchString(user.Lastname) {
		return errors.New("invalid last name format must contain only letters")
	}
	if len(user.AboutMe) > 1000 {
		return errors.New("about me must be under 1000 characters")
	}
	user.Nickname = html.EscapeString(user.Nickname)
	user.Email = html.EscapeString(user.Email)
	user.AboutMe = html.EscapeString(user.AboutMe)
	return nil
}

func validateSignInInput(login models.UserSignIn) error {
	if strings.TrimSpace(login.Identifiant) == "" || strings.TrimSpace(login.Password) == "" {
		return ErrMissingRequiredFields
	}
	return nil
}

func CalculateAge(dateStr string) (int, error) {
	layout := "2006-01-02"
	birthdate, err := time.Parse(layout, dateStr)
	if err != nil {
		return 0, errors.New("invalid date format")
	}

	now := time.Now()

	age := now.Year() - birthdate.Year()

	if now.Month() < birthdate.Month() ||
		(now.Month() == birthdate.Month() && now.Day() < birthdate.Day()) {
		age--
	}

	return age, nil
}
