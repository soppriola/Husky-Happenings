USE HuskyHappenings;

DROP PROCEDURE IF EXISTS CreateEvent;
DROP PROCEDURE IF EXISTS UpdateEvent;
DROP PROCEDURE IF EXISTS CancelEvent;
DROP PROCEDURE IF EXISTS DeleteEvent;
DROP PROCEDURE IF EXISTS RegisterForEvent;
DROP PROCEDURE IF EXISTS UpdateEventRegistration;

DELIMITER $$

CREATE PROCEDURE CreateEvent(
    IN p_CreatedByUserID INT UNSIGNED,
    IN p_GroupID INT UNSIGNED,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_Location VARCHAR(255),
    IN p_StartDateTime DATETIME,
    IN p_EndDateTime DATETIME,
    IN p_PrivacyType VARCHAR(20)
)
BEGIN
    INSERT INTO Event (
        CreatedByUserID,
        GroupID,
        Title,
        Description,
        Location,
        StartDateTime,
        EndDateTime,
        PrivacyType
    )
    VALUES (
        p_CreatedByUserID,
        p_GroupID,
        p_Title,
        p_Description,
        p_Location,
        p_StartDateTime,
        p_EndDateTime,
        p_PrivacyType
    );
END $$

CREATE PROCEDURE UpdateEvent(
    IN p_EventID INT UNSIGNED,
    IN p_GroupID INT UNSIGNED,
    IN p_Title VARCHAR(150),
    IN p_Description TEXT,
    IN p_Location VARCHAR(255),
    IN p_StartDateTime DATETIME,
    IN p_EndDateTime DATETIME,
    IN p_PrivacyType VARCHAR(20)
)
BEGIN
    UPDATE Event
    SET GroupID = p_GroupID,
        Title = p_Title,
        Description = p_Description,
        Location = p_Location,
        StartDateTime = p_StartDateTime,
        EndDateTime = p_EndDateTime,
        PrivacyType = p_PrivacyType
    WHERE EventID = p_EventID;
END $$

CREATE PROCEDURE CancelEvent(
    IN p_EventID INT UNSIGNED,
    IN p_CancellationReason VARCHAR(255)
)
BEGIN
    UPDATE Event
    SET EventStatus = 'Cancelled',
        CancellationReason = p_CancellationReason
    WHERE EventID = p_EventID;
END $$

CREATE PROCEDURE DeleteEvent(
    IN p_EventID INT UNSIGNED
)
BEGIN
    DELETE FROM Event
    WHERE EventID = p_EventID;
END $$

CREATE PROCEDURE RegisterForEvent(
    IN p_EventID INT UNSIGNED,
    IN p_UserID INT UNSIGNED,
    IN p_RSVPStatus VARCHAR(20)
)
BEGIN
    INSERT INTO EventRegistration (
        EventID,
        UserID,
        RSVPStatus,
        RegistrationStatus
    )
    VALUES (
        p_EventID,
        p_UserID,
        p_RSVPStatus,
        'Responded'
    );
END $$

CREATE PROCEDURE UpdateEventRegistration(
    IN p_EventID INT UNSIGNED,
    IN p_UserID INT UNSIGNED,
    IN p_RSVPStatus VARCHAR(20),
    IN p_RegistrationStatus VARCHAR(20)
)
BEGIN
    UPDATE EventRegistration
    SET RSVPStatus = p_RSVPStatus,
        RegistrationStatus = p_RegistrationStatus,
        RespondedAt = CURRENT_TIMESTAMP
    WHERE EventID = p_EventID
      AND UserID = p_UserID;
END $$

DELIMITER ;