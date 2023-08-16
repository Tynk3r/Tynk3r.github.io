
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

--create your tables with SQL commands here (watch out for slight syntactical differences with SQLite)

-- CREATE TABLE IF NOT EXISTS testUsers (
--     test_user_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_name TEXT NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS testUserRecords (
--     test_record_id INTEGER PRIMARY KEY AUTOINCREMENT,
--     test_record_value TEXT NOT NULL,
--     test_user_id  INT, --the user that the record belongs to
--     FOREIGN KEY (test_user_id) REFERENCES testUsers(test_user_id)
-- );

CREATE TABLE IF NOT EXISTS user (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name VARCHAR(50),
    user_email VARCHAR(50),
    user_password VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS folder (
    folder_id INTEGER PRIMARY KEY AUTOINCREMENT,
    folder_name VARCHAR(50),
    user_id INT, 
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);

CREATE TABLE IF NOT EXISTS note (
    note_id INTEGER PRIMARY KEY AUTOINCREMENT,
    note_title VARCHAR(50),
    note_subtitle VARCHAR(50),
    note_content TEXT,
    note_template TEXT,
    note_font TEXT,
    note_cdatetime DATETIME DEFAULT (datetime('now','localtime')),
    note_mdatetime DATETIME DEFAULT (datetime('now','localtime')),
    note_bookmarked BOOLEAN, 
    user_id INT,
    folder_id INT, 
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folder(folder_id)
);

--insert default data (if necessary here)

-- INSERT INTO testUsers ("test_name") VALUES ('Simon Star');
-- INSERT INTO testUserRecords ("test_record_value", "test_user_id") VALUES( 'Lorem ipsum dolor sit amet', 1); --try changing the test_user_id to a different number and you will get an error
INSERT INTO user ('user_name', 'user_email', 'user_password') VALUES ('jolene', 'j@gmail.com', '123');
INSERT INTO folder('folder_name', 'user_id') VALUES ('agile', 1);
INSERT INTO note ('note_title', 'note_subtitle', 'note_content','note_template', 'note_font', 'note_cdatetime', 'note_mdatetime','note_bookmarked', 'user_id', 'folder_id') VALUES ('title', 'subtitle','content','blank', 'Arial', '20230702 08:40:40', '20230702 08:40:40','no', 1, 1);

COMMIT;


