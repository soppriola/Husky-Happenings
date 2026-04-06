USE HuskyHappenings;

DROP TABLE IF EXISTS Event;

CREATE TABLE Event (
    EventID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    CreatedByUserID INT UNSIGNED NOT NULL,
    GroupID INT UNSIGNED NULL,
    Title VARCHAR(150) NOT NULL,
    Description TEXT,
    Location VARCHAR(255) NOT NULL,
    StartDateTime DATETIME NOT NULL,
    EndDateTime DATETIME NOT NULL,
    PrivacyType ENUM('Public', 'Private') NOT NULL DEFAULT 'Public',
    EventStatus ENUM('Active', 'Past', 'Cancelled') NOT NULL DEFAULT 'Active',
    CancellationReason VARCHAR(255) NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_event
        PRIMARY KEY (EventID),

    CONSTRAINT fk_event_createdby
        FOREIGN KEY (CreatedByUserID)
        REFERENCES USERS(USER_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_event_group
        FOREIGN KEY (GroupID)
        REFERENCES HGroup(GroupID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_event_title_not_blank
        CHECK (CHAR_LENGTH(TRIM(Title)) > 0),

    CONSTRAINT chk_event_location_not_blank
        CHECK (CHAR_LENGTH(TRIM(Location)) > 0),

    CONSTRAINT chk_event_time_order
        CHECK (EndDateTime > StartDateTime),

    CONSTRAINT chk_event_cancel_reason_required
        CHECK (
            (EventStatus = 'Cancelled' AND CancellationReason IS NOT NULL AND CHAR_LENGTH(TRIM(CancellationReason)) > 0)
            OR
            (EventStatus <> 'Cancelled')
        )
);

CREATE INDEX idx_event_startdatetime
    ON Event (StartDateTime);

CREATE INDEX idx_event_privacy_status
    ON Event (PrivacyType, EventStatus);

CREATE INDEX idx_event_group
    ON Event (GroupID);

CREATE INDEX idx_event_creator
    ON Event (CreatedByUserID);
