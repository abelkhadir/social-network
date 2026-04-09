package posthandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/utils"
	"strings"

	// "errors"
	"net/http"
)

var MAX_COMMENT_LENGTH = 50

func CreateComment(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Println("the user want send comments")
	if strings.HasSuffix(req.URL.Path, "/like") || strings.HasSuffix(req.URL.Path, "/dislike") {
		RateCommentHandler(application, res, req)
		return
	}
	if utils.ValidateRequest(req, res, "/comment/*", http.MethodPost) {
		userInSession, _ := application.SessionRepo.GetUserFromSession(req)
		isLogin := application.SessionRepo.ValidSession(req)
		path := req.URL.Path
		pathPart := strings.Split(path, "/")
		postID := pathPart[2]
		post, err := application.PostRepo.GetPostByID(postID)
		if err != nil {
			utils.HandleError(res, http.StatusNotFound, "post not found")
			return
		}
		if isLogin {
			var commentInfo models.Comment
			if err := json.NewDecoder(req.Body).Decode(&commentInfo); err != nil {
				utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
				return
			}
			if err := validateCommentInput(&commentInfo); err != nil {
				utils.HandleError(res, http.StatusBadRequest, err.Error())
				return
			}
			// fmt.Println("the comments details",commentInfo.PostID)
			// fmt.Println("the comments details",commentInfo.Text)

			commentInfo.AuthorID = userInSession.ID
			commentInfo.PostID = postID
			err = application.CommentRepo.CreateComment(&commentInfo)
			if err != nil {
				utils.HandleError(res, http.StatusInternalServerError, "Error creating comment : "+err.Error())
				return
			}
			if post.AuthorID != "" && post.AuthorID != userInSession.ID {
				notification := models.Notification{
					UserID:     post.AuthorID,
					ActorID:    userInSession.ID,
					Type:       "comment",
					EntityID:   postID,
					EntityType: "post",
					Content:    userInSession.Nickname + " commented on your post.",
				}
				if err := application.NotificationRepo.Create(&notification); err == nil {
					websockethandler.SendNotification(notification)
				}
			}
			// comment, err := models.CommentRepo.GetCommentByID(commentInfo.ID)
			// if err != nil {
			// 	utils.HandleError(res, http.StatusInternalServerError, "Error getting comment : "+err.Error())
			// 	return
			// }
			utils.SendJSONResponse(res, http.StatusOK, map[string]any{
				"message": "comment created successfully",
				"comment": "",
			})
			// SendComment(postID, comment)
		} else {
			utils.HandleError(res, http.StatusUnauthorized, "not connected")
		}
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

func validateCommentInput(comment *models.Comment) error {
	// Add any validation rules as needed
	if comment.Text == "" {
		return errors.New("ErrMissingRequiredFields")
	}
	length := len(comment.Text)
	if length > MAX_COMMENT_LENGTH || length == 0 {
		return errors.New("you input comment length is so big or to small")
	}
	comment.Text = html.EscapeString(comment.Text)
	return nil
}
