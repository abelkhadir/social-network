CREATE TABLE IF NOT EXISTS post_shared_users (
    post_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,

    PRIMARY KEY (post_id, user_id),

    FOREIGN KEY (post_id) REFERENCES post(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);