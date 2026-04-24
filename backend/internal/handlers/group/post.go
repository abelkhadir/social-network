package groupshandler

import (
	"fmt"
	"net/http"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"
)

// import (
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// 	"strconv"
// 	"time"

// 	"social/internal/app"
// 	"social/internal/models"

// 	"social/pkg/utils"
// )

const maxUpload = 10 << 20

func AddGroupPost(app *app.Application, w http.ResponseWriter, r *http.Request) {
	fmt.Println("user daba bghaaaa ideer post fgrouuuup 🃏🃏🃏🃏🃏")
	if r.Method != http.MethodPost {
		fmt.Println("the methood is ", r.Method)
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}
	userId := r.Context().Value(middleware.UserIDKey).(string)
	fmt.Println(" 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 usrsefsdf 🃏🃏🃏🃏🃏 ", userId)
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
	groupIdstr="e458b682-8345-4e12-b4bf-d4b2560c711c"
	fmt.Println(" 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 groupid ", groupIdstr)
	if groupErr != nil {

		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
			"message": "Invalid URL",
			"status":  http.StatusNotFound,
		})
		return
	}

	// if err != nil || groupId <= 0 {
	// 	utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
	// 		"message": "Invalid URL",
	// 		"status":  http.StatusNotFound,
	// 	})
	// 	return
	// }
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
	fmt.Println(" 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 🃏🃏🃏🃏🃏 ", img, post)
	// savepost, ErrSavePost := h.service.SaveGroupePost(r.Context(), post, img)

	_, ErrSavePost := app.GroupPostRepo.SaveGroupPostRepo(r.Context(), post, img)

	if ErrSavePost.Code != http.StatusOK {
		utils.SendJSONResponse(w, ErrSavePost.Code, ErrSavePost)
		return
	}

	// utils.SendJSONResponse(w, http.StatusOK, savepost)
}

// func  GetGroupPosts(App *app.Application ,w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"message": "Method not allowed ",
// 			"status":  http.StatusMethodNotAllowed,
// 		})
// 		return
// 	}

// 	defer r.Body.Close()

// 	var req models.PaginationRequest
// 	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
// 		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
// 			"message": "Invalid JSON payload",
// 			"status":  http.StatusBadRequest,
// 		})
// 		return
// 	}
// 	groupIdstr, groupErr := utils.GetGroupId(r, "post")
// 	if groupErr != nil {
// 		utils.SendJSONResponse(w, http.StatusNotFound, map[string]any{
// 			"message": "Invalid URL",
// 			"status":  http.StatusNotFound,
// 		})
// 		return
// 	}
// 	posts, postsErr := h.service.GetGroupsPost(req, groupIdstr)
// 	if postsErr.Code != http.StatusOK {
// 		utils.SendJSONResponse(w, postsErr.Code, postsErr)
// 		return
// 	}
// 	utils.SendJSONResponse(w, postsErr.Code, posts)
// }

// func  AddGroupComment(App *app.Application ,w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"message": "Method not allowed",
// 			"status":  http.StatusMethodNotAllowed,
// 		})
// 		return
// 	}

// 	r.Body = http.MaxBytesReader(w, r.Body, maxUpload)
// 	err := r.ParseMultipartForm(maxUpload)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
// 			"message": "Bad Request",
// 			"status":  http.StatusBadRequest,
// 		})
// 		return
// 	}

// 	postIdStr := r.FormValue("post_id")
// 	postId, err := strconv.Atoi(postIdStr)
// 	fmt.Println("the post id", postId)
// 	if err != nil {
// 		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
// 			"message": "invalid multipart form",
// 			"status":  http.StatusBadRequest,
// 		})
// 		return
// 	}
// 	groupcomments := models.Comment{
// 		ID:         r.FormValue("comment"),
// 		PostID:     string(postId),
// 		CreateDate: time.Now().Format(time.RFC3339),
// 		AuthorID:  r.FormValue("comment"),
// 	}

// 	file, header, err := r.FormFile("image")

// 	var img *models.Image // nil unless file is provided
// 	if err == nil {
// 		img = &models.Image{
// 			ImgHeader:  header,
// 			ImgContent: file,
// 		}

// 		defer file.Close()
// 	}
// 	comment, SaveERR := h.service.SaveGroupeComment(groupcomments, img)
// 	if SaveERR.Code != http.StatusOK {
// 		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
// 			"message": "invalid multipart form",
// 			"status":  http.StatusBadRequest,
// 		})
// 		return
// 	}

// 	utils.SendJSONResponse(w, SaveERR.Code, comment)
// }

// func  GetGRoupComment(App *app.Application ,w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
// 			"message": "Method not allowed",
// 			"status":  http.StatusMethodNotAllowed,
// 		})
// 		return
// 	}

// 	var coment models.ComentPaginationRequest
// 	if err := json.NewDecoder(r.Body).Decode(&coment); err != nil {
// 		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
// 			"message": "Bad request",
// 			"status":  http.StatusBadRequest,
// 		})
// 		return
// 	}

// 	comments, err := h.service.GetGroupComment(coment.PostId)
// 	if err.Code != http.StatusOK {
// 		utils.SendJSONResponse(w, err.Code, err)
// 	}
// 	utils.SendJSONResponse(w, http.StatusOK, comments)
// }
