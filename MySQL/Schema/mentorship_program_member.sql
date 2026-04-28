-- Author: Arianna Kelsey

USE HUSKYHAPPENINGS;

DROP TABLE IF EXISTS MentorshipProgramMember;

CREATE TABLE MentorshipProgramMember (
    ProgramID INT NOT NULL,
    UserID INT UNSIGNED NOT NULL,
    RoleType ENUM('Member', 'Mentor') NOT NULL DEFAULT 'Member',
    MembershipStatus ENUM('Pending', 'Accepted', 'Declined') NOT NULL DEFAULT 'Pending',
    JoinedAt DATETIME NULL,

    PRIMARY KEY (ProgramID, UserID),

    CONSTRAINT FK_MENTORSHIP_MEMBER_PROGRAM
        FOREIGN KEY (ProgramID)
        REFERENCES MentorshipProgram(ProgramID)
        ON DELETE CASCADE,

    CONSTRAINT FK_MENTORSHIP_MEMBER_USER
        FOREIGN KEY (UserID)
        REFERENCES USERS(USER_ID)
        ON DELETE CASCADE
);
