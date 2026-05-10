package profile

import (
	"database/sql"
	"errors"
)

func (r *ProfileRepository) FollowUser(followerID, followingID string) error {
	var exists int
	err := r.db.QueryRow(`
		SELECT 1 FROM followers 
		WHERE follower_id = ? AND following_id = ?
		LIMIT 1`,
		followerID, followingID,
	).Scan(&exists)

	if err == nil {
		return nil
	}

	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	_, err = r.db.Exec(`
		INSERT INTO followers (follower_id, following_id, status)
		VALUES (?, ?, 'pending')`,
		followerID, followingID,
	)
	return err
}

func (r *ProfileRepository) UnfollowUser(followerID, followingID string) error {
	result, err := r.db.Exec(`
		DELETE FROM followers
		WHERE follower_id = ? AND following_id = ?`,
		followerID, followingID,
	)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("not following")
	}
	return nil
}

// CanChat returns true if there is an accepted follow in either direction.
func (r *ProfileRepository) CanChat(userA, userB string) (bool, error) {
	var exists int
	err := r.db.QueryRow(`
		SELECT 1 FROM followers
		WHERE status = 'accepted'
		  AND (
		        (follower_id = ? AND following_id = ?)
		     OR (follower_id = ? AND following_id = ?)
		  )
		LIMIT 1`,
		userA, userB, userB, userA,
	).Scan(&exists)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	return err == nil, err
}

func (r *ProfileRepository) IsFollowing(followerID, followingID string) (bool, error) {
	var exists int
	err := r.db.QueryRow(`
		SELECT 1 FROM followers
		WHERE follower_id = ? AND following_id = ? AND status = 'accepted'
		LIMIT 1`,
		followerID, followingID,
	).Scan(&exists)

	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *ProfileRepository) IsPending(followerID, followingID string) (bool, error) {
	var exists int
	err := r.db.QueryRow(`
		SELECT 1 FROM followers
		WHERE follower_id = ? AND following_id = ? AND status = 'pending'
		LIMIT 1`,
		followerID, followingID,
	).Scan(&exists)

	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return true, nil
}

func (r *ProfileRepository) AcceptFollow(followerID, followingID string) error {
	_, err := r.db.Exec(`
		UPDATE followers
		SET status = 'accepted'
		WHERE follower_id = ? AND following_id = ?`,
		followerID, followingID,
	)
	return err
}
