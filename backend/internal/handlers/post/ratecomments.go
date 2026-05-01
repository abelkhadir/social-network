package posthandler

import (
	"database/sql"
	"net/http"
	"strings"

	"social/internal/app"
	websockethandler "social/internal/handlers/websocket"
	"social/internal/models"
	"social/pkg/utils"
)

func getExistingCommentVote(db *sql.DB, commentID, userID string) (int, bool, error) {
	var vote int
	err := db.QueryRow("SELECT vote FROM comment_vote WHERE comment_id = ? AND user_id = ?", commentID, userID).Scan(&vote)
	if err == sql.ErrNoRows {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return vote, true, nil
}

func RateCommentHandler(application *app.Application, res http.ResponseWriter, req *http.Request) {
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

	existingVote, hasExistingVote, err := getExistingCommentVote(application.DB, commentID, userInSession.ID)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to inspect vote state")
		return
	}

	err = application.CommentRepo.RateComment(commentID, userInSession.ID, voteValue)
	if err != nil {
		utils.HandleError(res, http.StatusInternalServerError, "Failed to save vote: "+err.Error())
		return
	}

	if action == "like" && (!hasExistingVote || existingVote != 1) {
		comment, commentErr := application.CommentRepo.GetCommentByID(commentID)
		if commentErr == nil && comment.AuthorID != "" && comment.AuthorID != userInSession.ID {
			notification := models.Notification{
				UserID:     comment.AuthorID,
				ActorID:    userInSession.ID,
				Type:       "like",
				EntityID:   commentID,
				EntityType: "comment",
				Content:    userInSession.Nickname + " liked your comment.",
			}
			_ = websockethandler.PushNotification(application, &notification, true)
		}
	}

	utils.SendJSONResponse(res, http.StatusOK, map[string]any{
		"message": "Vote successfully recorded",
	})
}
