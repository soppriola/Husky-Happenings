-- Author: Arianna Kelsey

USE HUSKYHAPPENINGS;

DELIMITER $$

DROP PROCEDURE IF EXISTS CreateMentorshipProgram $$
CREATE PROCEDURE CreateMentorshipProgram(
    IN p_userID INT,
    IN p_name VARCHAR(255),
    IN p_focusArea VARCHAR(255),
    IN p_description TEXT,
    IN p_privacyType VARCHAR(50)
)
BEGIN
    INSERT INTO MentorshipProgram (
        CreatedByUserID,
        Name,
        FocusArea,
        Description,
        PrivacyType
    )
    VALUES (
        p_userID,
        p_name,
        p_focusArea,
        p_description,
        p_privacyType
    );
END $$

DROP PROCEDURE IF EXISTS CreateMentorshipProgram $$
CREATE PROCEDURE CreateMentorshipProgram(
    IN p_userID INT UNSIGNED,
    IN p_name VARCHAR(255),
    IN p_focusArea VARCHAR(255),
    IN p_description TEXT,
    IN p_privacyType VARCHAR(50)
)
BEGIN
    INSERT INTO MentorshipProgram (
        CreatedByUserID,
        Name,
        FocusArea,
        Description,
        PrivacyType
    )
    VALUES (
        p_userID,
        p_name,
        p_focusArea,
        p_description,
        p_privacyType
    );
END $$


DROP PROCEDURE IF EXISTS UpdateMentorshipProgram $$
CREATE PROCEDURE UpdateMentorshipProgram(
    IN p_programID INT,
    IN p_name VARCHAR(255),
    IN p_focusArea VARCHAR(255),
    IN p_description TEXT,
    IN p_privacyType VARCHAR(50),
    IN p_isActive BOOLEAN
)
BEGIN
    UPDATE MentorshipProgram
    SET
        Name = p_name,
        FocusArea = p_focusArea,
        Description = p_description,
        PrivacyType = p_privacyType,
        IsActive = p_isActive
    WHERE ProgramID = p_programID;
END $$


DROP PROCEDURE IF EXISTS DeactivateMentorshipProgram $$
CREATE PROCEDURE DeactivateMentorshipProgram(
    IN p_programID INT
)
BEGIN
    UPDATE MentorshipProgram
    SET IsActive = FALSE
    WHERE ProgramID = p_programID;
END $$


DROP PROCEDURE IF EXISTS DeleteMentorshipProgram $$
CREATE PROCEDURE DeleteMentorshipProgram(
    IN p_programID INT
)
BEGIN
    DELETE FROM MentorshipProgram
    WHERE ProgramID = p_programID;
END $$


DROP PROCEDURE IF EXISTS AddMentorshipMember $$
CREATE PROCEDURE AddMentorshipMember(
    IN p_programID INT,
    IN p_userID INT UNSIGNED,
    IN p_roleType VARCHAR(50),
    IN p_membershipStatus VARCHAR(50)
)
BEGIN
    INSERT INTO MentorshipProgramMember (
        ProgramID,
        UserID,
        RoleType,
        MembershipStatus,
        JoinedAt
    )
    VALUES (
        p_programID,
        p_userID,
        p_roleType,
        p_membershipStatus,
        CASE
            WHEN p_membershipStatus = 'Accepted' THEN NOW()
            ELSE NULL
        END
    );
END $$


DROP PROCEDURE IF EXISTS UpdateMentorshipMemberStatus $$
CREATE PROCEDURE UpdateMentorshipMemberStatus(
    IN p_programID INT,
    IN p_userID INT UNSIGNED,
    IN p_roleType VARCHAR(50),
    IN p_membershipStatus VARCHAR(50)
)
BEGIN
    UPDATE MentorshipProgramMember
    SET
        RoleType = p_roleType,
        MembershipStatus = p_membershipStatus,
        JoinedAt = CASE
            WHEN p_membershipStatus = 'Accepted' THEN NOW()
            ELSE JoinedAt
        END
    WHERE ProgramID = p_programID
      AND UserID = p_userID;
END $$


DROP PROCEDURE IF EXISTS RemoveMentorshipMember $$
CREATE PROCEDURE RemoveMentorshipMember(
    IN p_programID INT,
    IN p_userID INT UNSIGNED
)
BEGIN
    DELETE FROM MentorshipProgramMember
    WHERE ProgramID = p_programID
      AND UserID = p_userID;
END $$

DELIMITER ;
