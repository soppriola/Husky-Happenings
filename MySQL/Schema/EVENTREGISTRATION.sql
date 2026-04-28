-- Author: Arianna Kelsey

USE HuskyHappenings;

DROP TABLE IF EXISTS EventRegistration;

CREATE TABLE EventRegistration (
    EventRegistrationID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    EventID INT UNSIGNED NOT NULL,
    UserID INT UNSIGNED NOT NULL,
    RSVPStatus ENUM('Going', 'Not Going', 'Interested') NOT NULL,
    RegistrationStatus ENUM('Invited', 'Responded') NOT NULL DEFAULT 'Responded',
    RespondedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_eventregistration
        PRIMARY KEY (EventRegistrationID),

    CONSTRAINT fk_eventregistration_event
        FOREIGN KEY (EventID)
        REFERENCES Event(EventID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_eventregistration_user
        FOREIGN KEY (UserID)
        REFERENCES USERS(USER_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_eventregistration_event_user
        UNIQUE (EventID, UserID)
);

CREATE INDEX idx_eventregistration_user
    ON EventRegistration (UserID);

CREATE INDEX idx_eventregistration_event_rsvp
    ON EventRegistration (EventID, RSVPStatus);
