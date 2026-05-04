package groupshandler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

const maxUploadSize = 10 << 20 // 10 MB

func AddGroupComment(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}
	userId := r.Context().Value(middleware.UserIDKey).(string)
	r.Body = http.MaxBytesReader(w, r.Body, maxUpload)
	// fmt.Println("zaaaamel hada id," ,userId)
	err := r.ParseMultipartForm(maxUpload)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "Bad Request",
			"status":  http.StatusBadRequest,
		})
		return
	}

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 3 {
		utils.HandleError(w, http.StatusBadRequest, "invalid URL")
		return
	}
	postID := pathParts[2]

	groupcomments := models.Comment{
		ID:         userId,
		PostID:     postID,
		CreateDate: time.Now().Format(time.RFC3339),
		AuthorID:   r.FormValue("comment"),
	}

	file, header, err := r.FormFile("image")

	var img *models.Image // nil unless file is provided
	if err == nil {
		img = &models.Image{
			ImgHeader:  header,
			ImgContent: file,
		}

		defer file.Close()
	}

	// fmt.Println("(9aaaahbaaa)")
	groupcomments.AuthorID = userId
	// fmt.Println("the comment all", groupcomments)
	comment, err := app.GroupPostRepo.SaveGroupeComment(groupcomments, img)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
		return
	}

	utils.SendJSONResponse(w, http.StatusCreated, comment)
}

func GetGRoupComment(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}

	var coment models.ComentPaginationRequest
	if err := json.NewDecoder(r.Body).Decode(&coment); err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "Bad request",
			"status":  http.StatusBadRequest,
		})
		return
	}

	comments, err := app.GroupPostRepo.GetGRouupComment(coment.PostId)
	if err.Code != http.StatusOK {
		utils.SendJSONResponse(w, err.Code, err)
	}
	utils.SendJSONResponse(w, http.StatusOK, comments)
}
