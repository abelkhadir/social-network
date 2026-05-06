CREATE TABLE IF NOT EXIST (
    follower_id INTEGER NON NULL,
    following_id INTEGER NON NULL,
    created_at DATETIME DEFAULT  CURRENT_TIMESTAMP,

    PRIMARY KEY (folower_id, following_id),
   
   
    FOREIGN KEY (follower_id) REFERENCES user_id ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES user_id ON DELETE CASCADE
)