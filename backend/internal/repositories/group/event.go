package groupsrepos

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"social/internal/models"

	"github.com/google/uuid"
)

func (r *GroupRepository) SaveEvent(c context.Context, event *models.Event) (models.Event, *models.GroupError) {
	// fmt.Println("---------------------------------------")
	// fmt.Println("dakhaaaal bghaaaa save event ")
	// fmt.Println("---------------------------------------")

	eventID := uuid.New().String()
	query := `
		INSERT INTO group_events(id, group_id,  member_id, title, description, event_date, created_at,total_going, total_not_going) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	tx, err := r.db.BeginTx(c, nil)
	if err != nil {
		return models.Event{}, &models.GroupError{
			Message: "Internal server eroor",
			Code:    http.StatusInternalServerError,
		}
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	_, err = tx.Exec(query, eventID, event.GroupId, event.UserID, event.Title, event.Description, event.EventDate, time.Now(), 0, 0)
	if err != nil {
		return models.Event{}, &models.GroupError{
			Message: err.Error(),
			Code:    http.StatusInternalServerError,
		}
	}
	// eventID, _ := res.LastInsertId()

	tx.Commit()
	return models.Event{ID: string(eventID)}, &models.GroupError{
		Message: "succefully craetd event",
		Code:    http.StatusOK,
	}
}

func (r *GroupRepository) GetGroupEvents(userID, groupID string) ([]*models.Event, models.GroupError) {
	// fmt.Println("---------------------------------------")
	// fmt.Println("eveeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeent")
	query := `
	SELECT 
	e.id, 
	e.title, 
	e.description, 
	e.event_date, 
	e.created_at,
	e.total_going,
	e.total_not_going, 
	ev.status,
	u.id,
	u.firstname,
	u.lastname,
	u.nickname,
	u.avatarURL
	FROM group_events AS e
	LEFT JOIN group_events_votes ev 
	ON ev.event_id = e.id AND ev.member_id = $1
	INNER JOIN user AS u 
	ON u.id = e.member_id
	WHERE e.group_id = $2
	ORDER BY e.created_at DESC;
	`

	fmt.Println("---------------------------------------")
	fmt.Println("---------------------------------------")
	fmt.Println(query)
	fmt.Println("---------------------------------------")
	rows, err := r.db.Query(query, userID, groupID)
	if err != nil {
		return nil, models.GroupError{
			Message: "Internal Server Error",
			Code:    http.StatusInternalServerError,
		}
	}
	defer rows.Close()

	var events []*models.Event
	// var unused int

	for rows.Next() {
		var event models.Event
		var vote sql.NullString
err := rows.Scan(
    &event.ID,
    &event.Title,
    &event.Description,
    &event.EventDate,
    &event.CreatedAt,
    &event.TotalGoing,
    &event.TotalNotGoing,
    &vote,
    &event.Author.ID,
    &event.Author.Firstname,
    &event.Author.Lastname,
    &event.Author.Nickname,
    &event.Author.Avatar,
)
		if err != nil {
			return nil, models.GroupError{
				Message: "Internal Server Error",
				Code:    http.StatusInternalServerError,
			}
		}
		if vote.Valid {
    event.UserVote = vote.String
}

		events = append(events, &event)
	}

	if err := rows.Err(); err != nil {
		return nil, models.GroupError{
			Message: "Internal Server Error",
			Code:    http.StatusInternalServerError,
		}
	}

	return events, models.GroupError{
		Message: "Successfully fetched events",
		Code:    http.StatusOK,
	}
}

func (r *GroupRepository) VoteOnEvent(ctx context.Context, vote models.EventVote) models.GroupError {
	var (
		query string
		args  []any
		msg   string
	)

	if vote.Vote == "remove" {
		query = `
			DELETE FROM group_events_votes
			WHERE event_id = ? AND member_id = ?
		`
		args = []any{vote.ID, vote.UserID}
		msg = "Vote removed successfully"
	} else {
		query = `
			INSERT INTO group_events_votes (event_id, member_id, status)
			VALUES (?, ?, ?)
		`
		args = []any{vote.ID, vote.UserID, vote.Vote}
		msg = "Vote registered successfully"
	}

	_, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return models.GroupError{
			Message: "Failed to process vote",
			Code:    http.StatusInternalServerError,
		}
	}

	return models.GroupError{
		Message: msg,
		Code:    http.StatusOK,
	}
}
