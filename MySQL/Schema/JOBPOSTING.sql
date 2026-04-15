USE HuskyHappenings;

DROP TABLE IF EXISTS JobPosting;

CREATE TABLE JobPosting (
    JobPostingID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PostedByUserID INT UNSIGNED NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Company VARCHAR(150) NOT NULL,
    Location VARCHAR(150) NOT NULL,
    Description TEXT NOT NULL,
    ApplicationMethod ENUM('External Link', 'Email', 'Platform') NOT NULL,
    ApplicationURL VARCHAR(500) NULL,
    ContactEmail VARCHAR(255) NULL,
    Deadline DATETIME NOT NULL,
    JobStatus ENUM('Active', 'Closed', 'Expired') NOT NULL DEFAULT 'Active',
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_jobposting
        PRIMARY KEY (JobPostingID),

    CONSTRAINT fk_jobposting_postedby
        FOREIGN KEY (PostedByUserID)
        REFERENCES USERS(USER_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_jobposting_title_not_blank
        CHECK (CHAR_LENGTH(TRIM(Title)) > 0),

    CONSTRAINT chk_jobposting_company_not_blank
        CHECK (CHAR_LENGTH(TRIM(Company)) > 0),

    CONSTRAINT chk_jobposting_location_not_blank
        CHECK (CHAR_LENGTH(TRIM(Location)) > 0),

    CONSTRAINT chk_jobposting_description_not_blank
        CHECK (CHAR_LENGTH(TRIM(Description)) > 0),

    CONSTRAINT chk_jobposting_method_requirements
        CHECK (
            (ApplicationMethod = 'External Link' AND ApplicationURL IS NOT NULL)
            OR
            (ApplicationMethod = 'Email' AND ContactEmail IS NOT NULL)
            OR
            (ApplicationMethod = 'Platform')
        )
);

CREATE INDEX idx_jobposting_title
    ON JobPosting (Title);

CREATE INDEX idx_jobposting_company
    ON JobPosting (Company);

CREATE INDEX idx_jobposting_deadline_status
    ON JobPosting (Deadline, JobStatus);

CREATE INDEX idx_jobposting_postedby
    ON JobPosting (PostedByUserID);
