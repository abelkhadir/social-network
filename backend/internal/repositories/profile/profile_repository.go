package profile

func (r *ProfileRepository) FollowUser(followerID string) error {

	query := `
	INSERT INTO followers (follower_id, following_id, status)
	VALUES (?, ?, 'pending')
	`

	_, err := r.db.Exec(query, followerID,"jawad")
	return err
}

func (r *ProfileRepository) UnfollowUser(followerID, followingID string) error {

	query := `
	DELETE FROM followers
	WHERE follower_id = ? AND following_id = ?
	`

	_, err := r.db.Exec(query, followerID, followingID)
	return err
}
