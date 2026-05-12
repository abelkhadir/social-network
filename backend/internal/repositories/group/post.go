package groupsrepos

import (
	"database/sql"

	"social/internal/models"
)

func (r *GroupRepository) PostExistsInGroup(postgroupid string) (bool, error) {
	var exists bool

	query := `
        SELECT EXISTS(
            SELECT 1
            FROM group_posts
            WHERE id = ?
        );
    `

	err := r.db.QueryRow(query, postgroupid).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

func (pr *GroupRepository) GetPostdetails(postID string, viewerID string) (*models.CompletePost, error) {
	var post models.CompletePost

	row := pr.db.QueryRow(`
        SELECT
            gp.id,
            gp.member_id,
            u.nickname,
            COALESCE(u.avatarURL, ''),
            gp.title,
            gp.content,
            COALESCE(gp.image, ''),
            gp.created_at,
            (SELECT COUNT(*) FROM post_vote WHERE post_id = gp.id AND vote = 1) AS likes,
            (SELECT COUNT(*) FROM post_vote WHERE post_id = gp.id AND vote = 0) AS dislikes,
            (SELECT CASE WHEN vote = 1 THEN 'like' WHEN vote = 0 THEN 'dislike' END
             FROM post_vote WHERE post_id = gp.id AND user_id = ?) AS user_vote
        FROM group_posts gp
        JOIN user u ON u.id = gp.member_id
        WHERE gp.id = ?
    `, viewerID, postID)

	var userVote sql.NullString
	err := row.Scan(
		&post.ID,
		&post.AuthorID,
		&post.AuthorName,
		&post.AuthorAvatar,
		&post.Title,
		&post.Description,
		&post.Image,
		&post.CreateDate,
		&post.Likes,
		&post.Dislikes,
		&userVote,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err
		}
		return nil, err
	}
	if userVote.Valid {
		post.UserVote = &userVote.String
	}

	return &post, nil
}
