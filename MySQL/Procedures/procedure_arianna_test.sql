USE HuskyHappenings;

-- Make sure these users exist first:
-- USER_ID 1 = ariannak147
-- USER_ID 2 = studentuser2
-- USER_ID 3 = studentuser3

SELECT USER_ID, USERNAME, EMAIL, NAME
FROM USERS;

-- =====================================================
-- EVENTS
-- =====================================================

CALL CreateEvent(
    1,
    NULL,
    'Career Fair',
    'Networking event for students',
    'USM Portland Campus',
    '2026-04-25 14:00:00',
    '2026-04-25 16:00:00',
    'Public'
);

CALL UpdateEvent(
    1,
    NULL,
    'Spring Career Fair',
    'Updated event description',
    'USM Gorham Campus',
    '2026-04-25 15:00:00',
    '2026-04-25 17:00:00',
    'Public'
);

-- user 2 registers for event 1
CALL RegisterForEvent(1, 2, 'Going');

-- user 2 changes RSVP
CALL UpdateEventRegistration(1, 2, 'Interested', 'Responded');

-- optional cancel test
CALL CancelEvent(1, 'Weather issues');

SELECT * FROM Event;
SELECT * FROM EventRegistration;

-- =====================================================
-- JOB BOARD
-- =====================================================

CALL CreateJobPosting(
    1,
    'Software Intern',
    'Tech Corp',
    'Portland, ME',
    'Summer internship for CS students',
    'Email',
    NULL,
    'hr@techcorp.com',
    '2026-05-01 23:59:00'
);

CALL UpdateJobPosting(
    1,
    'Software Engineering Intern',
    'Tech Corp',
    'Remote',
    'Updated internship description',
    'Email',
    NULL,
    'hr@techcorp.com',
    '2026-05-15 23:59:00',
    'Active'
);

-- user 3 applies to job posting 1
CALL ApplyToJob(
    1,
    3,
    'I am very interested in this opportunity and would love to be considered.',
    'https://example.com/resume-student3.pdf'
);

CALL UpdateJobApplicationStatus(1, 'Under Review');

-- optional close test
CALL CloseJobPosting(1);

SELECT * FROM JobPosting;
SELECT * FROM JobApplication;

-- =====================================================
-- GROUP / MENTORSHIP
-- =====================================================

CALL CreateGroup(
    1,
    'Computer Science Mentors',
    'Computer Science',
    'A group for mentoring and collaboration',
    'Public'
);

CALL UpdateGroup(
    1,
    'CS Mentors',
    'Computer Science',
    'Updated group description',
    'Public',
    TRUE
);

-- add user 2 to the group
CALL AddGroupMember(
    1,
    2,
    'Member',
    'Accepted'
);

-- promote user 2
CALL UpdateGroupMemberStatus(
    1,
    2,
    'Moderator',
    'Accepted'
);

-- add user 3 to the group
CALL AddGroupMember(
    1,
    3,
    'Member',
    'Accepted'
);

SELECT * FROM HGroup;
SELECT * FROM GroupMember;

 -- Optional cleanup tests
 CALL RemoveGroupMember(1, 3);
 CALL DeleteGroup(1);
 CALL DeleteJobPosting(1);
 CALL DeleteEvent(1);