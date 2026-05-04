package groupshandler

import (
	"encoding/json"
	"net/http"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

const maxUpload = 10 << 20

func AddGroupPost(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}
	userId := r.Context().Value(middleware.UserIDKey).(string)
	r.Body = http.MaxBytesReader(w, r.Body, maxUpload)
	err := r.ParseMultipartForm(maxUpload)
	if err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "Bad Request",
			"status":  http.StatusBadRequest,
		})
		return
	}
	groupIdstr, groupErr := utils.GetGroupId(r, "post")
	if groupErr != nil {
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"message": "Invalid URL",
			"status":  http.StatusNotFound,
		})
		return
	}

	post := &models.GroupPost{
		GroupId: groupIdstr,
		Post: models.Post{
			AuthorID:    string(userId),
			Title:       r.FormValue("title"),
			Description: r.FormValue("content"),
		},
	}

	file, header, err := r.FormFile("image")
	var img *models.Image
	if err == nil {
		img = &models.Image{
			ImgHeader:  header,
			ImgContent: file,
		}

		defer file.Close()
	}

	_, ErrSavePost := app.GroupPostRepo.SaveGroupPostRepo(r.Context(), post, img)

	if ErrSavePost.Code != http.StatusOK {
		utils.SendJSONResponse(w, ErrSavePost.Code, ErrSavePost)
		return
	}
}

func GetGroupPosts(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed ",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}

	defer r.Body.Close()

	var req models.PaginationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "Invalid JSON payload",
			"status":  http.StatusBadRequest,
		})
		return
	}
	groupIdstr, groupErr := utils.GetGroupIdA(r, "post")

	if groupErr != nil {
		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"message": "Invalid URL",
			"status":  http.StatusNotFound,
		})
		return
	}
	posts, postsErr := app.GroupPostRepo.GetGroupPosts(req, groupIdstr)
	if postsErr.Code != http.StatusOK {
		utils.SendJSONResponse(w, postsErr.Code, postsErr)
		return
	}

	utils.SendJSONResponse(w, postsErr.Code, posts)
}

