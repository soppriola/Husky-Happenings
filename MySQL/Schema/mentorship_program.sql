-- Author: Arianna Kelsey


USE HUSKYHAPPENINGS;

DROP TABLE IF EXISTS MentorshipProgram;

CREATE TABLE MentorshipProgram (
    ProgramID INT AUTO_INCREMENT PRIMARY KEY,
    CreatedByUserID INT UNSIGNED NOT NULL,

    Name VARCHAR(255) NOT NULL,
    FocusArea VARCHAR(255) NOT NULL,
    Description TEXT,
    PrivacyType ENUM('Public', 'Private') DEFAULT 'Public',
    IsActive BOOLEAN DEFAULT TRUE,

    CONSTRAINT FK_MENTORSHIP_PROGRAM_USER
        FOREIGN KEY (CreatedByUserID)
        REFERENCES USERS(USER_ID)
        ON DELETE CASCADE
);
