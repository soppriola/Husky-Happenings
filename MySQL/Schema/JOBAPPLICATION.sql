USE HuskyHappenings;

DROP TABLE IF EXISTS JobApplication;

CREATE TABLE JobApplication (
    JobApplicationID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    JobPostingID INT UNSIGNED NOT NULL,
    ApplicantUserID INT UNSIGNED NOT NULL,
    ApplicationStatus ENUM('Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn')
        NOT NULL DEFAULT 'Submitted',
    CoverLetter TEXT NULL,
    ResumeURL VARCHAR(500) NULL,
    AppliedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_jobapplication
        PRIMARY KEY (JobApplicationID),

    CONSTRAINT fk_jobapplication_jobposting
        FOREIGN KEY (JobPostingID)
        REFERENCES JobPosting(JobPostingID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_jobapplication_applicant
        FOREIGN KEY (ApplicantUserID)
        REFERENCES USERS(USER_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_jobapplication_job_user
        UNIQUE (JobPostingID, ApplicantUserID)
);

CREATE INDEX idx_jobapplication_applicant
    ON JobApplication (ApplicantUserID);

CREATE INDEX idx_jobapplication_job_status
    ON JobApplication (JobPostingID, ApplicationStatus);
