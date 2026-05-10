package posthandler

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"social/internal/app"
	groupshandler "social/internal/handlers/group"
	"social/internal/models"
	"social/pkg/middleware"
	"social/pkg/utils"

	"github.com/google/uuid"
	// "errors"
)

const maxUploadSize = 10 << 20 // 10 MB
var MAX_COMMENT_LENGTH = 50

func CreateComment(application *app.Application, res http.ResponseWriter, req *http.Request) {
	// handle like / dislike
	if strings.HasSuffix(req.URL.Path, "/like") || strings.HasSuffix(req.URL.Path, "/dislike") {
		RateCommentHandler(application, res, req)
		return
	}

	if !utils.ValidateRequest(req, res, "/comment/*", http.MethodPost) {
		return
	}

	pathParts := strings.Split(req.URL.Path, "/")
	if len(pathParts) < 3 {
		utils.HandleError(res, http.StatusBadRequest, "invalid URL")
		return
	}
	postID := pathParts[2]

	userInSession, _ := application.SessionRepo.GetUserFromSession(req)
	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "not connected")
		return
	}

	var commentInfo models.Comment
	commentInfo.AuthorID = userInSession.ID
	commentInfo.PostID = postID

	exist, err := application.GroupPostRepo.PostExistsInGroup(postID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, err.Error())
		return
	}

	if exist {
		groupshandler.AddGroupComment(application, res, req)

		// _, groupErr := application.GroupPostRepo.AddGroupComment(commentInfo, nil)
		// if groupErr.Code != http.StatusOK {
		// 	utils.HandleError(res, groupErr.Code, groupErr.Message)
		// 	return
		// }
		// fmt.Println("raah rjaa3 bghaa ziid ",commentInfo)

		// utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		// 	"message": "comment created successfully (group post)",
		// 	"comment": commentInfo,
		// })
		return
	} else {
		AddpostComment(application, res, req)
		return
		//  AddpostComment(application,res,req)
		// fmt.Println("khonaa ohbiibnaa")
		// var err error
		// req.Body = http.MaxBytesReader(res, req.Body, maxUploadSize)
		// fmt.Println("zaaaamel hada id," ,userId)
		// post, err := application.PostRepo.GetPostByID(postID)
		// if err != nil {
		// 	utils.HandleError(res, http.StatusNotFound, "post not found")
		// 	return
		// }

		// // 	defer file.Close()
		// // }
		// // fmt.Println("There is an imaage", img)
		// // if err := json.NewDecoder(req.Body).Decode(&commentInfo); err != nil {
		// 	// 	utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		// 	// 	return
		// 	// }

		// 	// if err := validateCommentInput(&commentInfo); err != nil {
		// 		// 	utils.HandleError(res, http.StatusBadRequest, err.Error())
		// 		// 	return
		// 		// }

		// 		// err = application.CommentRepo.CreateComment(&commentInfo,img)
		// 		// if err != nil {
		// 			// 	utils.HandleError(res, http.StatusInternalServerError, "Error creating comment: "+err.Error())
		// 			// 	return
		// 			// }

		// 			// notification
		// 			if post.AuthorID != "" && post.AuthorID != userInSession.ID {
		// 				notification := models.Notification{
		// 					UserID:     post.AuthorID,
		// 					ActorID:    userInSession.ID,
		// 					Type:       "comment",
		// 					EntityID:   postID,
		// 					EntityType: "post",
		// 					Content:    userInSession.Nickname + " commented on your post.",
		// 				}

		// 				_ = websockethandler.PushNotification(application, &notification, true)
		// 			}

		// 			utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		// 				"message": "comment created successfully",
		// 				"comment": commentInfo,
		// 			})
	}
}

func GetComments(application *app.Application, res http.ResponseWriter, req *http.Request) {
	if utils.ValidateRequest(req, res, "/comments/*", http.MethodGet) {
		if application.SessionRepo.ValidSession(req) {
			path := req.URL.Path
			pathPart := strings.Split(path, "/")
			postID := pathPart[2]
			comments, err := application.CommentRepo.GetCommentsOfPost(postID)
			if err != nil {
				utils.HandleError(res, http.StatusNotFound, err.Error())
				return
			}
			utils.SendJSONResponse(res, http.StatusOK, map[string]any{
				"message":  "comment list got successfully",
				"comments": comments,
			})
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "No active session")
		}
	}
}

// func validateCommentInput(comment *models.Comment) error {
// 	// Add any validation rules as needed
// 	if comment.Text == "" {
// 		return errors.New("ErrMissingRequiredFields")
// 	}
// 	length := len(comment.Text)
// 	if length > MAX_COMMENT_LENGTH || length == 0 {
// 		return errors.New("you input comment length is so big or to small")
// 	}
// 	comment.Text = html.EscapeString(comment.Text)
// 	return nil
// }

func AddpostComment(app *app.Application, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		utils.SendJSONResponse(w, http.StatusMethodNotAllowed, map[string]any{
			"message": "Method not allowed",
			"status":  http.StatusMethodNotAllowed,
		})
		return
	}
	userId := r.Context().Value(middleware.UserIDKey).(string)
	file, header, err := r.FormFile("image")
	if err != nil {
		fmt.Println("the file that the usdfdsfdsfsd ", err)
		// return
	}
	// fmt.Println("the file that the user sent ", file)
	text := r.FormValue("text")

	// fmt.Println("the text", text)
	if text == "" && file == nil {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "comment must contain text or image",
		})
		return
	}
	if len(text) > 1000 {
		utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
			"message": "comment must be under 1000 characters",
		})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	var img *models.Image
	if text != "" && err != nil {
		fmt.Println("onlyyyyyyy  the text ")
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
			Text:       text,
		}

		// fmt.Println("(9aaaahbaaa)")
		groupcomments.AuthorID = userId
		// fmt.Println("the comment all", groupcomments)
		comment, err := app.CommentRepo.CreateComment(&groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return // 	return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
		return
	}
	if err == nil && text == "" {
		fmt.Println("onlyyyy piccc ")
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
			if err := utils.CheckImage(img); err != nil {
				utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
					"message": "Invalid image type. Only JPEG, PNG, GIF allowed",
				})
				return
			}
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
		comment, err := app.CommentRepo.CreateComment(&groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return // 	return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
		return
	}
	if text != "" && err == nil {
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
			if err := utils.CheckImage(img); err != nil {
				utils.SendJSONResponse(w, http.StatusBadRequest, map[string]any{
					"message": "Invalid image type. Only JPEG, PNG, GIF allowed",
				})
				return
			}
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
			Text:       text,
		}

		// fmt.Println("the text howaa haaad a",text)
		groupcomments.AuthorID = userId
		// fmt.Println("the comment all", groupcomments)
		comment, err := app.CommentRepo.CreateComment(&groupcomments, img)
		if err != nil {
			utils.SendJSONResponse(w, http.StatusInternalServerError, map[string]any{"message": err.Error()})
			return // 	return
		}
		utils.SendJSONResponse(w, http.StatusOK, map[string]any{
			"message": "comment created successfully (group post)",
			"comment": comment,
		})
		return
	}
}
