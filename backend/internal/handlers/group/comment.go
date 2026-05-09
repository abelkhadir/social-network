package groupshandler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"social/internal/app"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"

	"github.com/google/uuid"
)

const maxUploadSize = 0 << 20 // 10 MB

func AddGroupComment(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}
	userId := r.Context().Value(middleware.UserIDKey).(string)
	file, header, err := r.FormFile("image")
	if err!=nil{
	fmt.Println("the file that the usdfdsfdsfsd ",err)
	return 
	}
	fmt.Println("the file that the user sent ",file)
	text := r.FormValue("text")

	// fmt.Println("the text", text)
	if text == "" && file == nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "comment must contain text or image",
		})
		return
	}
	fmt.Println("the text", text)
	r.Body = http.MaxBytesReader(w, r.Body, maxUpload)
	var img *models.Image // nil unless file is provided
	if text != ""&&err!=nil {
		// fmt.Println("i don't knooooow ")
		pathParts := strings.Split(r.URL.Path, "/")
		if len(pathParts) < 3 {
			utils.HandleError(w, http.StatusBadRequest, "invalid URL")
			return
		}
		postID := pathParts[2]

		groupcomments := models.Comment{
			ID:         uuid.New().String(),
			PostID:     postID,
			CreateDate: time.Now().Format(time.RFC3339),
			AuthorID:   r.FormValue("comment"),
			Text: text,
		}

		// fmt.Println("(9aaaahbaaa)")
		groupcomments.AuthorID = userId
		// fmt.Println("the comment all", groupcomments)
		comment, err := app.GroupPostRepo.SaveGroupeComment(groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
		return
	}
	if err == nil && text=="" {
		fmt.Println("zaaaamel hada id," ,userId)
		err = r.ParseMultipartForm(maxUploadSize)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
				"message": "Bad Request",
				"status":  http.StatusBadRequest,
			})
			return
		}
		if err == nil {
			img = &models.Image{
				ImgHeader:  header,
				ImgContent: file,
			}

			defer file.Close()
		}

		pathParts := strings.Split(r.URL.Path, "/")
		if len(pathParts) < 3 {
			utils.HandleError(w, http.StatusBadRequest, "invalid URL")
			return
		}
		postID := pathParts[2]

		groupcomments := models.Comment{
			ID:         uuid.New().String(),
			PostID:     postID,
			CreateDate: time.Now().Format(time.RFC3339),
			AuthorID:   r.FormValue("comment"),
		}

		groupcomments.AuthorID = userId
		// fmt.Println("the comment all", groupcomments)
		comment, err := app.GroupPostRepo.SaveGroupeComment(groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
	}
	if (text!=""&&err==nil){
				fmt.Println("imaage and the text dosn't emty")
		err = r.ParseMultipartForm(maxUploadSize)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
				"message": "Bad Request",
				"status":  http.StatusBadRequest,
			})
			return
		}
		if err == nil {
			img = &models.Image{
				ImgHeader:  header,
				ImgContent: file,
			}

			defer file.Close()
		}

		pathParts := strings.Split(r.URL.Path, "/")
		if len(pathParts) < 3 {
			utils.HandleError(w, http.StatusBadRequest, "invalid URL")
			return
		}
		postID := pathParts[2]

		groupcomments := models.Comment{
			ID:         uuid.New().String(),
			PostID:     postID,
			CreateDate: time.Now().Format(time.RFC3339),
			AuthorID:   r.FormValue("comment"),
			Text: text,
		}

		// fmt.Println("the text howaa haaad a",text)
		groupcomments.AuthorID = userId
		// fmt.Println("the comment all", groupcomments)
		comment, err := app.GroupPostRepo.SaveGroupeComment(groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
	}
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
