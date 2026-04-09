PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO category (id, name) VALUES
  ('cat-tech', 'Tech'),
  ('cat-golang', 'Golang'),
  ('cat-javascript', 'JavaScript'),
  ('cat-devops', 'DevOps'),
  ('cat-design', 'Design'),
  ('cat-ai', 'AI');

INSERT OR IGNORE INTO user (id, nickname, firstname, lastname, age, gender, email, password, avatarURL) VALUES
  ('11111111-1111-1111-1111-111111111111', 'younsse', 'Younsse', 'Admin', 25, 'male', 'younsse@example.com', '$2a$04$lkTkeHf.2zenBH8SqHhzPOOJIEsBfzSU77x5vDubxpiz88y4Gd5Aq', NULL),
  ('22222222-2222-2222-2222-222222222222', 'meryem', 'Meryem', 'User', 23, 'female', 'meryem@example.com', '$2a$04$wPfHjQPieRPjWwfcnVnqrOeKGQtrgRrxTo.PzipSliTwX7ZBPiMgG', NULL),
  ('33333333-3333-3333-3333-333333333333', 'hamza', 'Hamza', 'User', 27, 'male', 'hamza@example.com', '$2a$04$wPfHjQPieRPjWwfcnVnqrOeKGQtrgRrxTo.PzipSliTwX7ZBPiMgG', NULL);
