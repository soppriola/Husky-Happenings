USE HuskyHappenings;

DROP TABLE IF EXISTS HGroup;

CREATE TABLE HGroup (
    GroupID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    CreatedByUserID INT UNSIGNED NOT NULL,
    GroupName VARCHAR(100) NOT NULL,
    StudyCategory VARCHAR(100) NOT NULL,
    Description TEXT,
    PrivacyType ENUM('Public', 'Private') NOT NULL DEFAULT 'Public',
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_hgroup
        PRIMARY KEY (GroupID),

    CONSTRAINT fk_hgroup_createdby
        FOREIGN KEY (CreatedByUserID)
        REFERENCES USERS(USER_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_hgroup_name_category
        UNIQUE (GroupName, StudyCategory),

    CONSTRAINT chk_hgroup_name_not_blank
        CHECK (CHAR_LENGTH(TRIM(GroupName)) > 0),

    CONSTRAINT chk_hgroup_category_not_blank
        CHECK (CHAR_LENGTH(TRIM(StudyCategory)) > 0)
);

CREATE INDEX idx_hgroup_name
    ON HGroup (GroupName);

CREATE INDEX idx_hgroup_category
    ON HGroup (StudyCategory);

CREATE INDEX idx_hgroup_privacy_active
    ON HGroup (PrivacyType, IsActive);
