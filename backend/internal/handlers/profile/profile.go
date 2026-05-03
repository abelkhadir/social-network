package profile

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"html"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/utils"

	"github.com/gofrs/uuid"
)

const maxAvatarSize = int64(5 << 20)

type updateProfilePayload struct {
	Nickname  *string `json:"nickname"`
	AboutMe   *string `json:"aboutMe"`
	IsPrivate *bool   `json:"isPrivate"`
}

func Profile(app *app.Application, res http.ResponseWriter, req *http.Request) {
	switch req.Method {
	case http.MethodGet:
		GetProfile(app, res, req)
	case http.MethodPut:
		UpdateProfile(app, res, req)
	default:
		utils.HandleError(res, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func GetProfile(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !app.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	viewer, err := app.SessionRepo.GetUserFromSession(req)
	if err != nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	profileID := resolveProfileID(req, viewer.ID)
	profile, err := app.ProfileRepo.GetProfile(viewer.ID, profileID)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.HandleError(res, http.StatusNotFound, "Profile not found")
			return
		}
		utils.HandleError(res, http.StatusInternalServerError, "Failed to load profile")
		return
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "Profile retrieved successfully",
		"profile": profile,
	})
}

func UpdateProfile(app *app.Application, res http.ResponseWriter, req *http.Request) {
	if !app.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "No active session")
		return
	}

	currentUser, err := app.SessionRepo.GetUserFromSession(req)
	if err != nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	nickname := currentUser.Nickname
	aboutMe := currentUser.AboutMe
	avatarURL := currentUser.AvatarURL
	isPrivate := currentUser.IsPrivate

	contentType := req.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "multipart/form-data") {
		if err := req.ParseMultipartForm(maxAvatarSize + (1 << 20)); err != nil {
			utils.HandleError(res, http.StatusBadRequest, "Invalid multipart form")
			return
		}

		if values, ok := req.MultipartForm.Value["nickname"]; ok && len(values) > 0 {
			candidate := strings.TrimSpace(values[0])
			if candidate != "" {
				nickname = strings.ToLower(html.EscapeString(candidate))
			}
		}
		if values, ok := req.MultipartForm.Value["aboutMe"]; ok && len(values) > 0 {
			aboutMe = strings.TrimSpace(values[0])
		}
		if values, ok := req.MultipartForm.Value["isPrivate"]; ok && len(values) > 0 {
			if parsed, ok := parseBoolParam(values[0]); ok {
				if parsed {
					isPrivate = 1
				} else {
					isPrivate = 0
				}
			} else {
				utils.HandleError(res, http.StatusBadRequest, "Invalid isPrivate value")
				return
			}
		}

		file, header, err := req.FormFile("avatar")
		if err == http.ErrMissingFile {
			file, header, err = req.FormFile("updateImage")
		}
		if err != nil && err != http.ErrMissingFile {
			utils.HandleError(res, http.StatusBadRequest, "Failed to read avatar")
			return
		}

		if header != nil && file != nil {
			defer file.Close()
			if header.Size > maxAvatarSize {
				utils.HandleError(res, http.StatusBadRequest, "Avatar must be under 5MB")
				return
			}

			headerBytes := make([]byte, 512)
			n, err := file.Read(headerBytes)
			if err != nil && err != io.EOF {
				utils.HandleError(res, http.StatusBadRequest, "Failed to read avatar")
				return
			}

			mimeType := http.DetectContentType(headerBytes[:n])
			ext := ""
			switch mimeType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			default:
				utils.HandleError(res, http.StatusBadRequest, "Invalid avatar type. Only JPEG, PNG, GIF allowed")
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

			reader := io.MultiReader(bytes.NewReader(headerBytes[:n]), file)
			if _, err := io.Copy(dstFile, reader); err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Failed to write avatar")
				return
			}

			if strings.HasPrefix(currentUser.AvatarURL, "/uploads/avatars/") && currentUser.AvatarURL != "" {
				_ = os.Remove("." + currentUser.AvatarURL)
			}

			avatarURL = "/uploads/avatars/" + filename
		}
	} else {
		var payload updateProfilePayload
		if err := json.NewDecoder(req.Body).Decode(&payload); err != nil {
			utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
			return
		}

		if payload.Nickname != nil {
			candidate := strings.TrimSpace(*payload.Nickname)
			if candidate != "" {
				nickname = strings.ToLower(html.EscapeString(candidate))
			}
		}
		if payload.AboutMe != nil {
			aboutMe = strings.TrimSpace(*payload.AboutMe)
		}
		if payload.IsPrivate != nil {
			if *payload.IsPrivate {
				isPrivate = 1
			} else {
				isPrivate = 0
			}
		}
	}

	if err := app.ProfileRepo.UpdateProfile(currentUser.ID, nickname, aboutMe, avatarURL, isPrivate); err != nil {
		if sqliteErr, ok := err.(interface{ Code() int }); ok && sqliteErr.Code() == 19 {
			utils.HandleError(res, http.StatusConflict, "Nickname already exists")
			return
		}
		utils.HandleError(res, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	updatedUser := models.AuthUser{
		ID:         currentUser.ID,
		Nickname:   nickname,
		Username:   nickname,
		Firstname:  currentUser.Firstname,
		Lastname:   currentUser.Lastname,
		Age:        currentUser.Age,
		Gender:     currentUser.Gender,
		Email:      currentUser.Email,
		AvatarURL:  avatarURL,
		Avatar:     avatarURL,
		AboutMe:    aboutMe,
		IsPrivate:  isPrivate == 1,
		IsLoggedIn: true,
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "Profile updated successfully",
		"user":    updatedUser,
	})
}

func resolveProfileID(req *http.Request, fallback string) string {
	if id := strings.TrimSpace(req.URL.Query().Get("id")); id != "" {
		return id
	}

	path := strings.TrimPrefix(req.URL.Path, "/profile")
	path = strings.TrimPrefix(path, "/")
	if path != "" {
		return path
	}

	return fallback
}

func parseBoolParam(value string) (bool, bool) {
	value = strings.TrimSpace(value)
	if value == "" {
		return false, false
	}

	switch value {
	case "1":
		return true, true
	case "0":
		return false, true
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return false, false
	}
	return parsed, true
}
