-- ========================
-- USERS
-- ========================
INSERT INTO user(id, nickname, firstname, lastname, age, gender, email, password, avatarURL) VALUES
('1', 'alice', 'Alice', 'Smith', 28, 'female', 'alice@example.com', 'hashedpassword1', 'https://example.com/avatars/alice.png'),
('2', 'bob', 'Bob', 'Johnson', 32, 'male', 'bob@example.com', 'hashedpassword2', 'https://example.com/avatars/bob.png'),
('3', 'carol', 'Carol', 'Williams', 25, 'female', 'carol@example.com', 'hashedpassword3', 'https://example.com/avatars/carol.png'),
('4', 'dave', 'Dave', 'Brown', 40, 'male', 'dave@example.com', 'hashedpassword4', 'https://example.com/avatars/dave.png'),
('5', 'eve', 'Eve', 'Davis', 30, 'female', 'eve@example.com', 'hashedpassword5', 'https://example.com/avatars/eve.png');

-- ========================
-- SESSIONS
-- ========================
INSERT INTO sessions(token, user_id, expire_at) VALUES
('token_abc123', '1', '2026-03-04 00:00:00'),
('token_def456', '2', '2026-03-04 00:00:00'),
('token_ghi789', '3', '2026-03-04 00:00:00');

-- ========================
-- CATEGORIES
-- ========================
INSERT INTO category(id, name) VALUES
('1', 'Painting'),
('2', 'Sculpture'),
('3', 'Photography'),
('4', 'Digital Art'),
('5', 'Drawing'),
('6', 'Mixed Media'),
('7', 'Printmaking'),
('8', 'Ceramics'),
('9', 'Sport'),
('10', 'Performance Art');

-- ========================
-- POSTS
-- ========================
INSERT INTO post(id, title, description, authorID, imageURL, createDate) VALUES
('1', 'Sunset Landscape', 'A beautiful sunset landscape painting.', '1', '', '2023-06-10 19:59:44'),
('2', 'Abstract Expression', 'An abstract expressionist painting with bold colors.', '2', '', '2023-04-27 03:39:42'),
('11', 'Bronze Sculpture', 'A classical bronze sculpture of a figure.', '3', '', '2023-01-26 21:14:26'),
('12', 'Modern Sculpture', 'A contemporary abstract sculpture made from metal and wood.', '4', '', '2023-08-01 04:55:25'),
('21', 'Cityscape at Night', 'A stunning cityscape photograph captured at night.', '5', '', '2023-04-23 04:40:53'),
('22', 'Nature Close-up', 'A macro photograph of a flower in nature.', '1', '', '2023-02-16 19:52:49'),
('31', 'Digital Painting', 'A digital painting created using a graphics tablet.', '1', '', '2023-06-04 15:24:12'),
('32', 'Sci-Fi Concept Art', 'A concept art of a futuristic city in a sci-fi world.', '1', '', '2023-08-02 20:18:47'),
('41', 'Charcoal Portrait', 'A realistic charcoal portrait of a person.', '2', '', '2023-04-17 15:47:47'),
('42',  'Ink Sketch', 'An ink sketch of a cityscape.', '2', '', '2023-06-03 17:01:39'),
('51',  'Collage Art', 'A collage artwork combining various materials.', '5', '', '2023-06-04 05:23:54'),
('52',  'Assemblage', 'An assemblage art piece created from found objects.', '4', '', '2023-01-24 22:35:27'),
('61', 'Linocut Print', 'A linocut print of a nature scene.', '4', '', '2023-03-28 03:03:30'),
('62', 'An etching print with intricate details.', '4', '', '2022-09-20 09:12:45'),
('71', 'Porcelain Vase', 'A delicate porcelain vase with intricate patterns.', '3', '', '2022-12-01 15:38:42'),
('72', 'Stoneware Sculpture', 'A stoneware sculpture of an animal.', '4', '', '2023-08-06 09:34:15'),
('81', 'Interactive Installation', 'An interactive art installation involving lights and sound.', '5', '', '2023-01-08 02:16:15'),
('82', 'Sculptural Installation', 'A large-scale sculptural installation in a public space.', '4', '', CURRENT_TIMESTAMP),
('91', 'Live Art Performance', 'A live art performance involving movement and expression.', '1', '', CURRENT_TIMESTAMP),
('92', 'Body Painting Show', 'A body painting performance with intricate designs.', '4', '', CURRENT_TIMESTAMP);

-- ========================
-- POST VOTES
-- ========================
INSERT INTO post_vote(user_id, post_id, vote) VALUES
('1', '82', 1),
('2', '82', 1),
('3', '82', 1),
('4', '2', 1),
('5', '2',1);

INSERT INTO post_category(category_id, post_id) VALUES
('1','1'),  -- Post 1 is in category 1 (Painting)
('1','2'),  -- Post 2 is also in Painting
('2','11'), -- Post 11 is in Sculpture
('2','12'), -- Post 12 is in Sculpture
('3','21'), -- Post 21 is Photography
('3','22'), -- Post 22 is Photography
('4','31'), -- Post 31 is Digital Art
('4','32'), -- Post 32 is Digital Art
('5','41'), -- Post 41 is Drawing
('5','42'), -- Post 42 is Drawing
('6','51'), -- Post 51 is Mixed Media
('6','52'), -- Post 52 is Mixed Media
('7','61'), -- Post 61 is Printmaking
('7','62'), -- Post 62 is Printmaking
('8','71'), -- Post 71 is Ceramics
('8','72'), -- Post 72 is Ceramics
('10','81'), -- Post 81 is Performance Art
('10','82'), -- Post 82 is Performance Art
('10','91'), -- Post 91 is Performance Art
('10','92'); -- Post 92 is Performance Art


INSERT INTO comment(id, text, authorID, postID, createDate)
VALUES
    ("0", "beautiful", "4", "1",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("01", "beautiful", "5", "1",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("02", "beautiful", "2", "1",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("03", "beautiful", "5", "1",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("04", "beautiful", "5", "11",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("1", "waouh!", "3", "12",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("11", "waouh!", "4", "12",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("12", "waouh!", "5", "21",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("13", "waouh!", "5", "22",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("14", "waouh!", "1", "32",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("2", "nice", "4", "41",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("21", "nickel", "5", "51",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("22", "niceuh", "1", "52",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("3", "respect!", "4", "72",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("31", "respect!", "5", "72",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("4", "beautiful", "4", "72",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("5", "beautiful", "1", "82",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("6", "beautiful", "2", "82",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("7", "beautiful", "2", "91",  strftime('%Y-%m-%d %H:%M:%S', datetime('now'))),
    ("8", "beautiful", "3", "91",  strftime('%Y-%m-%d %H:%M:%S', datetime('now')));
