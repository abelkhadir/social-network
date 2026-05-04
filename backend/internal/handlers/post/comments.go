package posthandler

import (
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"strings"

	"social/internal/app"
	groupshandler "social/internal/handlers/group"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/utils"
	// "errors"
)

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
	
	fmt.Println("khonaa dkhaal")
	if exist {
		groupshandler.AddGroupComment(application, res, req)
		// _, groupErr := application.GroupPostRepo.AddGroupComment(commentInfo, nil)
		// if groupErr.Code != http.StatusOK {
			// 	utils.HandleError(res, groupErr.Code, groupErr.Message)
		// 	return
		// }

		// utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		// 	"message": "comment created successfully (group post)",
		// 	"comment": commentInfo,
		// })
		// return
	}
	
	if err := json.NewDecoder(req.Body).Decode(&commentInfo); err != nil {
		utils.HandleError(res, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if err := validateCommentInput(&commentInfo); err != nil {
		utils.HandleError(res, http.StatusBadRequest, err.Error())
		return
	}
	post, err := application.PostRepo.GetPostByID(postID)
	if err != nil {
		utils.HandleError(res, http.StatusNotFound, "post not found")
		return
	}

	err = application.CommentRepo.CreateComment(&commentInfo)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Error creating comment: "+err.Error())
		return
	}

	// notification
	if post.AuthorID != "" && post.AuthorID != userInSession.ID {
		notification := models.Notification{
			UserID:     post.AuthorID,
			ActorID:    userInSession.ID,
			Type:       "comment",
			EntityID:   postID,
			EntityType: "post",
			Content:    userInSession.Nickname + " commented on your post.",
		}

		_ = websockethandler.PushNotification(application, &notification, true)
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "comment created successfully",
		"comment": commentInfo,
	})
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
