-- TITLE: INSERT_USER
-- AUTHOR: Ashley Pike
-- A simple stored procedure for inserting given values into a new user instance

DELIMITER $$

CREATE PROCEDURE INSERT_USER (
    -- Variables to be included
    IN p_USERNAME VARCHAR(50),
   	IN p_PASS_WORD VARCHAR(255),
	IN p_EMAIL VARCHAR(255),
    IN p_NAME varchar(200),
    IN p_PHONE_NUMBER VARCHAR(20),
    IN p_BIRTH_DATE DATE
)
BEGIN
    -- Inserting values
    INSERT INTO USERS (USERNAME, PASS_WORD, EMAIL, NAME, PHONE_NUMBER, BIRTH_DATE)
    VALUES (p_USERNAME, p_PASS_WORD, p_EMAIL, p_NAME, p_PHONE_NUMBER, p_BIRTH_DATE);

END$$

DELIMITER ;
