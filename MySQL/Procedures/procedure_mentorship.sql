USE HuskyHappenings;

DROP PROCEDURE IF EXISTS CreateGroup;
DROP PROCEDURE IF EXISTS UpdateGroup;
DROP PROCEDURE IF EXISTS DeactivateGroup;
DROP PROCEDURE IF EXISTS DeleteGroup;
DROP PROCEDURE IF EXISTS AddGroupMember;
DROP PROCEDURE IF EXISTS UpdateGroupMemberStatus;
DROP PROCEDURE IF EXISTS RemoveGroupMember;

DELIMITER $$

CREATE PROCEDURE CreateGroup(
    IN p_CreatedByUserID INT UNSIGNED,
    IN p_GroupName VARCHAR(100),
    IN p_StudyCategory VARCHAR(100),
    IN p_Description TEXT,
    IN p_PrivacyType VARCHAR(20)
)
BEGIN
    INSERT INTO HGroup (
        CreatedByUserID,
        GroupName,
        StudyCategory,
        Description,
        PrivacyType
    )
    VALUES (
        p_CreatedByUserID,
        p_GroupName,
        p_StudyCategory,
        p_Description,
        p_PrivacyType
    );
END $$

CREATE PROCEDURE UpdateGroup(
    IN p_GroupID INT UNSIGNED,
    IN p_GroupName VARCHAR(100),
    IN p_StudyCategory VARCHAR(100),
    IN p_Description TEXT,
    IN p_PrivacyType VARCHAR(20),
    IN p_IsActive BOOLEAN
)
BEGIN
    UPDATE HGroup
    SET GroupName = p_GroupName,
        StudyCategory = p_StudyCategory,
        Description = p_Description,
        PrivacyType = p_PrivacyType,
        IsActive = p_IsActive
    WHERE GroupID = p_GroupID;
END $$

CREATE PROCEDURE DeactivateGroup(
    IN p_GroupID INT UNSIGNED
)
BEGIN
    UPDATE HGroup
    SET IsActive = FALSE
    WHERE GroupID = p_GroupID;
END $$

CREATE PROCEDURE DeleteGroup(
    IN p_GroupID INT UNSIGNED
)
BEGIN
    DELETE FROM HGroup
    WHERE GroupID = p_GroupID;
END $$

CREATE PROCEDURE AddGroupMember(
    IN p_GroupID INT UNSIGNED,
    IN p_UserID INT UNSIGNED,
    IN p_RoleType VARCHAR(20),
    IN p_MembershipStatus VARCHAR(20)
)
BEGIN
    INSERT INTO GroupMember (
        GroupID,
        UserID,
        RoleType,
        MembershipStatus,
        JoinedAt
    )
    VALUES (
        p_GroupID,
        p_UserID,
        p_RoleType,
        p_MembershipStatus,
        CASE
            WHEN p_MembershipStatus = 'Accepted' THEN CURRENT_TIMESTAMP
            ELSE NULL
        END
    );
END $$

CREATE PROCEDURE UpdateGroupMemberStatus(
    IN p_GroupID INT UNSIGNED,
    IN p_UserID INT UNSIGNED,
    IN p_RoleType VARCHAR(20),
    IN p_MembershipStatus VARCHAR(20)
)
BEGIN
    UPDATE GroupMember
    SET RoleType = p_RoleType,
        MembershipStatus = p_MembershipStatus,
        JoinedAt = CASE
            WHEN p_MembershipStatus = 'Accepted' AND JoinedAt IS NULL THEN CURRENT_TIMESTAMP
            WHEN p_MembershipStatus <> 'Accepted' THEN NULL
            ELSE JoinedAt
        END
    WHERE GroupID = p_GroupID
      AND UserID = p_UserID;
END $$

CREATE PROCEDURE RemoveGroupMember(
    IN p_GroupID INT UNSIGNED,
    IN p_UserID INT UNSIGNED
)
BEGIN
    DELETE FROM GroupMember
    WHERE GroupID = p_GroupID
      AND UserID = p_UserID;
END $$

DELIMITER ;