USE HuskyHappenings;

DROP TABLE IF EXISTS GroupMember;

CREATE TABLE GroupMember (
    GroupMemberID INT UNSIGNED NOT NULL AUTO_INCREMENT,
    GroupID INT UNSIGNED NOT NULL,
    UserID INT UNSIGNED NOT NULL,
    RoleType ENUM('Owner','Moderator','Member','Mentor','Mentee') NOT NULL DEFAULT 'Member',
    MembershipStatus ENUM('Invited', 'Pending', 'Accepted', 'Declined', 'Left', 'Removed')
        NOT NULL DEFAULT 'Pending',
    JoinedAt TIMESTAMP NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_groupmember
        PRIMARY KEY (GroupMemberID),

    CONSTRAINT fk_groupmember_group
        FOREIGN KEY (GroupID)
        REFERENCES HGroup(GroupID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_groupmember_user
        FOREIGN KEY (UserID)
        REFERENCES USERS(USER_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_groupmember_group_user
        UNIQUE (GroupID, UserID),

    CONSTRAINT chk_groupmember_joinedat_required_if_accepted
        CHECK (
            (MembershipStatus = 'Accepted' AND JoinedAt IS NOT NULL)
            OR
            (MembershipStatus <> 'Accepted')
        )
);

CREATE INDEX idx_groupmember_user
    ON GroupMember (UserID);

CREATE INDEX idx_groupmember_group_status
    ON GroupMember (GroupID, MembershipStatus);

CREATE INDEX idx_groupmember_group_role
    ON GroupMember (GroupID, RoleType);
