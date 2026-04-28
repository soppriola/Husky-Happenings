-- Author: Arianna Kelsey

USE HuskyHappenings;

DROP PROCEDURE IF EXISTS CreateJobPosting;
DROP PROCEDURE IF EXISTS UpdateJobPosting;
DROP PROCEDURE IF EXISTS CloseJobPosting;
DROP PROCEDURE IF EXISTS DeleteJobPosting;
DROP PROCEDURE IF EXISTS ApplyToJob;
DROP PROCEDURE IF EXISTS UpdateJobApplicationStatus;

DELIMITER $$

CREATE PROCEDURE CreateJobPosting(
    IN p_PostedByUserID INT UNSIGNED,
    IN p_Title VARCHAR(150),
    IN p_Company VARCHAR(150),
    IN p_Location VARCHAR(150),
    IN p_Description TEXT,
    IN p_ApplicationMethod VARCHAR(20),
    IN p_ApplicationURL VARCHAR(500),
    IN p_ContactEmail VARCHAR(255),
    IN p_Deadline DATETIME
)
BEGIN
    INSERT INTO JobPosting (
        PostedByUserID,
        Title,
        Company,
        Location,
        Description,
        ApplicationMethod,
        ApplicationURL,
        ContactEmail,
        Deadline
    )
    VALUES (
        p_PostedByUserID,
        p_Title,
        p_Company,
        p_Location,
        p_Description,
        p_ApplicationMethod,
        p_ApplicationURL,
        p_ContactEmail,
        p_Deadline
    );
END $$

CREATE PROCEDURE UpdateJobPosting(
    IN p_JobPostingID INT UNSIGNED,
    IN p_Title VARCHAR(150),
    IN p_Company VARCHAR(150),
    IN p_Location VARCHAR(150),
    IN p_Description TEXT,
    IN p_ApplicationMethod VARCHAR(20),
    IN p_ApplicationURL VARCHAR(500),
    IN p_ContactEmail VARCHAR(255),
    IN p_Deadline DATETIME,
    IN p_JobStatus VARCHAR(20)
)
BEGIN
    UPDATE JobPosting
    SET Title = p_Title,
        Company = p_Company,
        Location = p_Location,
        Description = p_Description,
        ApplicationMethod = p_ApplicationMethod,
        ApplicationURL = p_ApplicationURL,
        ContactEmail = p_ContactEmail,
        Deadline = p_Deadline,
        JobStatus = p_JobStatus
    WHERE JobPostingID = p_JobPostingID;
END $$

CREATE PROCEDURE CloseJobPosting(
    IN p_JobPostingID INT UNSIGNED
)
BEGIN
    UPDATE JobPosting
    SET JobStatus = 'Closed'
    WHERE JobPostingID = p_JobPostingID;
END $$

CREATE PROCEDURE DeleteJobPosting(
    IN p_JobPostingID INT UNSIGNED
)
BEGIN
    DELETE FROM JobPosting
    WHERE JobPostingID = p_JobPostingID;
END $$

CREATE PROCEDURE ApplyToJob(
    IN p_JobPostingID INT UNSIGNED,
    IN p_ApplicantUserID INT UNSIGNED,
    IN p_CoverLetter TEXT,
    IN p_ResumeURL VARCHAR(500)
)
BEGIN
    INSERT INTO JobApplication (
        JobPostingID,
        ApplicantUserID,
        CoverLetter,
        ResumeURL
    )
    VALUES (
        p_JobPostingID,
        p_ApplicantUserID,
        p_CoverLetter,
        p_ResumeURL
    );
END $$

CREATE PROCEDURE UpdateJobApplicationStatus(
    IN p_JobApplicationID INT UNSIGNED,
    IN p_ApplicationStatus VARCHAR(20)
)
BEGIN
    UPDATE JobApplication
    SET ApplicationStatus = p_ApplicationStatus
    WHERE JobApplicationID = p_JobApplicationID;
END $$

DELIMITER ;
