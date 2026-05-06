package profile

func (r *ProfileRepository) FollowUser(followerID string, followingID string) error {
	var exists int
	err := r.db.QueryRow(`
		SELECT 1 FROM followers 
		WHERE follower_id = ? AND following_id = ?
	`, followerID, followingID).Scan(&exists)

	if err == nil {
		_, err = r.db.Exec(`
			DELETE FROM followers 
			WHERE follower_id = ? AND following_id = ?
		`, followerID, followingID)
		return err
	}

	var isPrivate int
	err = r.db.QueryRow(`
		SELECT is_private FROM user WHERE id = ?
	`, followingID).Scan(&isPrivate)
	if err != nil {
		return err
	}

	status := "accepted"
	if isPrivate == 1 {
		status = "pending"
	}

	_, err = r.db.Exec(`
		INSERT INTO followers (follower_id, following_id, status)
		VALUES (?, ?, ?)
	`, followerID, followingID, status)

	return err
}
