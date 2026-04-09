package posthandler

import (
	"fmt"
	"net/http"
	"social/internal/app"
	"social/pkg/utils"
	"strings"
)

func RateCommentHandler(application *app.Application, res http.ResponseWriter, req *http.Request) {
	fmt.Print("the user like the comment")
	if req.Method != http.MethodPost {
		utils.HandleError(res, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if !application.SessionRepo.ValidSession(req) {
		utils.HandleError(res, http.StatusUnauthorized, "You must be logged in to vote")
		return
	}

	userInSession, err := application.SessionRepo.GetUserFromSession(req)
	if err != nil {
		utils.HandleError(res, http.StatusUnauthorized, "Invalid session")
		return
	}

	pathParts := strings.Split(req.URL.Path, "/")
	if len(pathParts) < 4 {
		utils.HandleError(res, http.StatusBadRequest, "Invalid URL format")
		return
	}
	commentID := pathParts[2]
	action := pathParts[3]

	voteValue := 1
	if action == "dislike" {
		voteValue = 0
	} else if action != "like" {
		utils.HandleError(res, http.StatusBadRequest, "Invalid action")
		return
	}

	err = application.CommentRepo.RateComment(commentID, userInSession.ID, voteValue)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to save vote: "+err.Error())
		return
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "Vote successfully recorded",
	})
}
