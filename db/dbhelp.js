const sqlite3 = require("sqlite3");


// db
const db = new sqlite3.Database("played-database.db");
db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
        "id" INTEGER ,
        "username" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        PRIMARY KEY("id" AUTOINCREMENT)
    )
    `,
    function (error) {
        if (error) console.log(error);
        }
    );

db.run(
    `
    CREATE TABLE IF NOT EXISTS "playlist" (
        "id" INTEGER,
        "name" TEXT
        "user_id"	INTEGER,
        "status" TEXT
        "date" TEXT
        "songs"	TEXT,
        PRIMARY KEY("id" AUTOINCREMENT),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    `,
    function (error) {
        if (error) console.log(error);
    }
);

db.run(
    `
    CREATE TABLE IF NOT EXISTS "music" (
        "id" INTEGER,
        "music_name" TEXT,
        "album_art"	TEXT,
        "artist_name" TEXT ,
        PRIMARY KEY("id" AUTOINCREMENT)
    );
    `,
    function (error) {
        if (error) console.log(error);
    }
);

