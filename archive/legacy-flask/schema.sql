-- M4: Users (Academic Directory)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orcid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    affiliation TEXT,
    msc_codes TEXT,
    email TEXT,
    coi_declaration TEXT,
    verified INTEGER DEFAULT 0
);

-- M1: Member Institutions
CREATE TABLE institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT,
    website TEXT,
    contact_email TEXT
);

-- M1: Events Calendar
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT,
    location TEXT,
    type TEXT,
    organizer TEXT
);

-- Seed sample data
INSERT INTO institutions (name, country, website)
VALUES ('National University of Singapore', 'Singapore', 'https://nus.edu.sg'),
       ('University of Tokyo', 'Japan', 'https://u-tokyo.ac.jp');

INSERT INTO events (title, date, location, type)
VALUES ('Asian Math Conference 2026', '2026-07-10', 'Seoul', 'Conference'),
       ('Summer School in Analysis', '2026-08-01', 'Bangkok', 'School');
