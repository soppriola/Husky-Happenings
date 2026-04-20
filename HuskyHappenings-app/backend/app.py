from flask import Flask, jsonify, request, g
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import mysql.connector
import secrets

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://localhost:5173"])  # allows frontend to communicate with backend


# Connects the backend to the MySQL database
# Author: Ashley Pike
db = mysql.connector.connect(
    host = os.getenv("DB_HOST"),
    user = os.getenv("DB_USER"),
    password = os.getenv("DB_PASSWORD"),
    database = os.getenv("DB_NAME"),
    ssl_ca = os.getenv("CA_PATH")
)
cursor = db.cursor(dictionary=True)

# This decorator wraps a function with a check to see if the user has a valid token before proceeding
# Author: Ashley Pike
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get('token')

        if not token:
            return jsonify({"error": "Session cookie not found."}), 401
        
        now = datetime.now(timezone.utc)

        cursor.execute("SELECT USER_ID FROM SESSIONS WHERE TOKEN = %s AND EXPIRES_AT > %s", (token, now))
        session_data = cursor.fetchone()

        if not session_data:
            return jsonify({"error": "Invalid or expired session."}), 401
        
        g.user_id = session_data["USER_ID"]

        return f(*args, **kwargs)
    return decorated_function

# Signup allows a new user to be added to the database corresponding to the provided user data
# Author: Ashley Pike
@app.post("/api/signup")
def signup():
    data = request.get_json()
    username = data["username"]
    password = data["password"]
    email = data["email"]
    name = data["name"]
    phoneNumber = data["phoneNumber"]
    birthDate = data["birthDate"]
    userType = data["userType"]

    hashedPassword = generate_password_hash(password)

    cursor.execute("SELECT USER_ID FROM USERS WHERE USERNAME = %s OR EMAIL = %s", (username, email))
    exists = cursor.fetchone()

    if exists:
        return jsonify({"error": "Failed to create user"}), 401

    parameters = (username, hashedPassword, email, name, phoneNumber, birthDate)
    cursor.callproc("INSERT_USER", parameters)
   
    db.commit()

    return jsonify({"message": "User created successfully"}), 201

# This function checks supplied username and password against the database
# and provides a session token to the user for authentication
# Author: Ashley Pike
@app.post("/api/login")
def login():
    data = request.get_json()
    username = data["username"]
    password = data["password"]

    cursor.execute("SELECT USER_ID, PASS_WORD FROM USERS WHERE USERNAME = %s", (username,))
    user = cursor.fetchone()

    if not user or not check_password_hash(user["PASS_WORD"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = secrets.token_hex(32)
    userID = user["USER_ID"]
    createdAt = datetime.now(timezone.utc)
    expiresAt = createdAt + timedelta(days=1)

    response = jsonify({"message": "Login successful"})
    response.set_cookie('token', token, expires=expiresAt, secure=True, httponly=True, samesite="None")

    parameters = (token, userID, createdAt, expiresAt)
    cursor.callproc("INSERT_SESSION", parameters)

    db.commit()

    return response, 200


# This function removes the session from the database
# and removes the token from cookies when user logs out
# Author: Ashley Pike
@app.post("/api/logout")
@login_required
def logout():
    token = request.cookies.get("token")

    if token:
        cursor.execute("DELETE FROM SESSIONS WHERE TOKEN = %s", (token,))
        db.commit()

    response = jsonify({"message": "Logged out"})
    response.set_cookie("token", "", expires=0, secure=True, httponly=True, samesite="None")
    return response, 200

# This functions returns information about logged in user
# Author: Ashley Pike
@app.get("/api/me")
@login_required
def me():
    user_id = g.user_id
    
    cursor.execute(
        "SELECT USER_ID, USERNAME, EMAIL FROM USERS WHERE USER_ID = %s",
        (user_id,)
    )
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "user_id": user["USER_ID"],
        "username": user["USERNAME"],
        "email": user["EMAIL"]
    }), 200

# =========================================================
# ARIANNA: EVENTS FEATURE
# =========================================================

@app.get("/api/events")
def get_events():
    cursor.execute("""
        SELECT
            EventID AS id,
            Title AS title,
            Description AS description,
            Location AS location,
            DATE_FORMAT(StartDateTime, '%Y-%m-%d %H:%i:%s') AS startDateTime,
            DATE_FORMAT(EndDateTime, '%Y-%m-%d %H:%i:%s') AS endDateTime,
            PrivacyType AS privacyType,
            EventStatus AS status,
            CancellationReason AS cancellationReason
        FROM Event
        ORDER BY StartDateTime ASC
    """)
    events = cursor.fetchall()
    return jsonify(events), 200


@app.post("/api/events")
@login_required
def create_event():
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    startDateTime = data.get("startDateTime")
    endDateTime = data.get("endDateTime")
    privacyType = data.get("privacyType", "Public")

    if not title or not location or not startDateTime or not endDateTime:
        return jsonify({"error": "Missing required event fields."}), 400

    try:
        start_dt = datetime.fromisoformat(startDateTime)
        end_dt = datetime.fromisoformat(endDateTime)
    except ValueError:
        return jsonify({"error": "Invalid event date format."}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "End date/time must be after start date/time."}), 400

    parameters = (
        g.user_id,
        None,
        title,
        description,
        location,
        start_dt,
        end_dt,
        privacyType
    )

    cursor.callproc("CreateEvent", parameters)
    db.commit()

    return jsonify({"message": "Event created successfully"}), 201


@app.put("/api/events/<int:event_id>")
@login_required
def update_event(event_id):
    data = request.get_json()

    title = data.get("title")
    description = data.get("description")
    location = data.get("location")
    startDateTime = data.get("startDateTime")
    endDateTime = data.get("endDateTime")
    privacyType = data.get("privacyType", "Public")

    if not title or not location or not startDateTime or not endDateTime:
        return jsonify({"error": "Missing required event fields."}), 400

    try:
        start_dt = datetime.fromisoformat(startDateTime)
        end_dt = datetime.fromisoformat(endDateTime)
    except ValueError:
        return jsonify({"error": "Invalid event date format."}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "End date/time must be after start date/time."}), 400

    parameters = (
        event_id,
        None,
        title,
        description,
        location,
        start_dt,
        end_dt,
        privacyType
    )

    cursor.callproc("UpdateEvent", parameters)
    db.commit()

    return jsonify({"message": "Event updated successfully"}), 200


@app.put("/api/events/<int:event_id>/cancel")
@login_required
def cancel_event(event_id):
    data = request.get_json() or {}
    cancellationReason = data.get("cancellationReason", "Cancelled by user")

    parameters = (
        event_id,
        cancellationReason
    )

    cursor.callproc("CancelEvent", parameters)
    db.commit()

    return jsonify({"message": "Event cancelled successfully"}), 200


@app.delete("/api/events/<int:event_id>")
@login_required
def delete_event(event_id):
    parameters = (event_id,)
    cursor.callproc("DeleteEvent", parameters)
    db.commit()

    return jsonify({"message": "Event deleted successfully"}), 200


@app.post("/api/events/<int:event_id>/register")
@login_required
def register_for_event(event_id):
    data = request.get_json()
    rsvpStatus = data.get("rsvpStatus", "Going")

    parameters = (
        event_id,
        g.user_id,
        rsvpStatus
    )

    cursor.callproc("RegisterForEvent", parameters)
    db.commit()

    return jsonify({"message": "Registered for event successfully"}), 201


@app.put("/api/events/<int:event_id>/register")
@login_required
def update_event_registration(event_id):
    data = request.get_json()
    rsvpStatus = data.get("rsvpStatus")
    registrationStatus = data.get("registrationStatus", "Responded")

    if not rsvpStatus:
        return jsonify({"error": "Missing RSVP status."}), 400

    parameters = (
        event_id,
        g.user_id,
        rsvpStatus,
        registrationStatus
    )

    cursor.callproc("UpdateEventRegistration", parameters)
    db.commit()

    return jsonify({"message": "Event registration updated successfully"}), 200



# =========================================================
# ARIANNA: JOB BOARD FEATURE
# =========================================================

@app.get("/api/jobs")
def get_jobs():
    cursor.execute("""
        SELECT
            JobPostingID AS id,
            Title AS title,
            Company AS company,
            Location AS location,
            Description AS description,
            ApplicationMethod AS applicationMethod,
            ApplicationURL AS applicationURL,
            ContactEmail AS contactEmail,
            DATE_FORMAT(Deadline, '%Y-%m-%d %H:%i:%s') AS deadline,
            JobStatus AS status
        FROM JobPosting
        ORDER BY Deadline ASC
    """)
    jobs = cursor.fetchall()
    return jsonify(jobs), 200


@app.post("/api/jobs")
@login_required
def create_job():
    data = request.get_json()

    title = data.get("title")
    company = data.get("company")
    location = data.get("location")
    description = data.get("description")
    applicationMethod = data.get("applicationMethod")
    applicationURL = data.get("applicationURL")
    contactEmail = data.get("contactEmail")
    deadline = data.get("deadline")

    if not title or not company or not location or not description or not applicationMethod or not deadline:
        return jsonify({"error": "Missing required job fields."}), 400

    if applicationMethod == "Email" and not contactEmail:
        return jsonify({"error": "Contact email is required for Email applications."}), 400

    if applicationMethod == "External Link" and not applicationURL:
        return jsonify({"error": "Application URL is required for External Link applications."}), 400

    try:
        deadline_dt = datetime.fromisoformat(deadline)
    except ValueError:
        return jsonify({"error": "Invalid deadline format."}), 400

    parameters = (
        g.user_id,
        title,
        company,
        location,
        description,
        applicationMethod,
        applicationURL,
        contactEmail,
        deadline_dt
    )

    cursor.callproc("CreateJobPosting", parameters)
    db.commit()

    return jsonify({"message": "Job created successfully"}), 201


@app.put("/api/jobs/<int:job_id>")
@login_required
def update_job(job_id):
    data = request.get_json()

    title = data.get("title")
    company = data.get("company")
    location = data.get("location")
    description = data.get("description")
    applicationMethod = data.get("applicationMethod")
    applicationURL = data.get("applicationURL")
    contactEmail = data.get("contactEmail")
    deadline = data.get("deadline")
    status = data.get("status", "Active")

    if not title or not company or not location or not description or not applicationMethod or not deadline:
        return jsonify({"error": "Missing required job fields."}), 400

    if applicationMethod == "Email" and not contactEmail:
        return jsonify({"error": "Contact email is required for Email applications."}), 400

    if applicationMethod == "External Link" and not applicationURL:
        return jsonify({"error": "Application URL is required for External Link applications."}), 400

    try:
        deadline_dt = datetime.fromisoformat(deadline)
    except ValueError:
        return jsonify({"error": "Invalid deadline format."}), 400

    parameters = (
        job_id,
        title,
        company,
        location,
        description,
        applicationMethod,
        applicationURL,
        contactEmail,
        deadline_dt,
        status
    )

    cursor.callproc("UpdateJobPosting", parameters)
    db.commit()

    return jsonify({"message": "Job updated successfully"}), 200


@app.put("/api/jobs/<int:job_id>/close")
@login_required
def close_job(job_id):
    parameters = (job_id,)
    cursor.callproc("CloseJobPosting", parameters)
    db.commit()

    return jsonify({"message": "Job closed successfully"}), 200


@app.delete("/api/jobs/<int:job_id>")
@login_required
def delete_job(job_id):
    parameters = (job_id,)
    cursor.callproc("DeleteJobPosting", parameters)
    db.commit()

    return jsonify({"message": "Job deleted successfully"}), 200


@app.post("/api/jobs/<int:job_id>/apply")
@login_required
def apply_to_job(job_id):
    data = request.get_json()

    coverLetter = data.get("coverLetter", "")
    resumeURL = data.get("resumeURL", "")

    parameters = (
        job_id,
        g.user_id,
        coverLetter,
        resumeURL
    )

    cursor.callproc("ApplyToJob", parameters)
    db.commit()

    return jsonify({"message": "Applied to job successfully"}), 201


@app.put("/api/job-applications/<int:application_id>")
@login_required
def update_job_application_status(application_id):
    data = request.get_json()
    applicationStatus = data.get("applicationStatus")

    if not applicationStatus:
        return jsonify({"error": "Missing application status."}), 400

    parameters = (
        application_id,
        applicationStatus
    )

    cursor.callproc("UpdateJobApplicationStatus", parameters)
    db.commit()

    return jsonify({"message": "Job application status updated successfully"}), 200


# =========================================================
# ARIANNA: MENTORSHIP FEATURE
# Database-backed using HGroup / GroupMember
# =========================================================

@app.get("/api/mentorships")
def get_mentorships():
    cursor.execute("""
        SELECT
            GroupID AS id,
            GroupName AS name,
            StudyCategory AS focusArea,
            Description AS description,
            PrivacyType AS privacyType,
            IsActive AS isActive
        FROM HGroup
        ORDER BY GroupID ASC
    """)
    groups = cursor.fetchall()
    return jsonify(groups), 200


@app.post("/api/mentorships")
@login_required
def create_mentorship():
    data = request.get_json()

    name = data.get("name")
    focusArea = data.get("focusArea")
    description = data.get("description")
    privacyType = data.get("privacyType", "Public")

    if not name or not focusArea or not description:
        return jsonify({"error": "Missing required mentorship fields."}), 400

    parameters = (
        g.user_id,
        name,
        focusArea,
        description,
        privacyType
    )

    cursor.callproc("CreateGroup", parameters)
    db.commit()

    return jsonify({"message": "Mentorship program created successfully"}), 201


@app.put("/api/mentorships/<int:group_id>")
@login_required
def update_mentorship(group_id):
    data = request.get_json()

    name = data.get("name")
    focusArea = data.get("focusArea")
    description = data.get("description")
    privacyType = data.get("privacyType", "Public")
    isActive = data.get("isActive", True)

    if not name or not focusArea or not description:
        return jsonify({"error": "Missing required mentorship fields."}), 400

    parameters = (
        group_id,
        name,
        focusArea,
        description,
        privacyType,
        isActive
    )

    cursor.callproc("UpdateGroup", parameters)
    db.commit()

    return jsonify({"message": "Mentorship program updated successfully"}), 200


@app.put("/api/mentorships/<int:group_id>/deactivate")
@login_required
def deactivate_mentorship(group_id):
    parameters = (group_id,)
    cursor.callproc("DeactivateGroup", parameters)
    db.commit()

    return jsonify({"message": "Mentorship program deactivated successfully"}), 200


@app.delete("/api/mentorships/<int:group_id>")
@login_required
def delete_mentorship(group_id):
    parameters = (group_id,)
    cursor.callproc("DeleteGroup", parameters)
    db.commit()

    return jsonify({"message": "Mentorship program deleted successfully"}), 200

@app.get("/api/mentorship-requests")
@login_required
def get_mentor_requests():
    cursor.execute("""
        SELECT
            gm.GroupID AS groupId,
            gm.UserID AS userId,
            u.NAME AS userName,
            hg.GroupName AS groupName,
            gm.RoleType AS roleType,
            gm.MembershipStatus AS membershipStatus,
            DATE_FORMAT(gm.JoinedAt, '%Y-%m-%d %H:%i:%s') AS joinedAt
        FROM GroupMember gm
        JOIN USERS u
            ON gm.UserID = u.USER_ID
        JOIN HGroup hg
            ON gm.GroupID = hg.GroupID
        ORDER BY gm.GroupID ASC, gm.UserID ASC
    """)
    requests_data = cursor.fetchall()
    return jsonify(requests_data), 200


@app.post("/api/mentorship-requests")
@login_required
def create_mentor_request():
    data = request.get_json()

    groupID = data.get("groupID")
    roleType = data.get("roleType", "Member")
    membershipStatus = data.get("membershipStatus", "Pending")

    if not groupID:
        return jsonify({"error": "Missing groupID for mentorship request."}), 400

    parameters = (
        int(groupID),
        g.user_id,
        roleType,
        membershipStatus
    )

    cursor.callproc("AddGroupMember", parameters)
    db.commit()

    return jsonify({"message": "Mentorship request submitted successfully"}), 201


@app.put("/api/mentorship-requests")
@login_required
def update_mentor_request():
    data = request.get_json()

    groupID = data.get("groupID")
    userID = data.get("userID")
    roleType = data.get("roleType", "Member")
    membershipStatus = data.get("membershipStatus")

    if not groupID or not userID or not membershipStatus:
        return jsonify({"error": "Missing required mentorship request fields."}), 400

    parameters = (
        int(groupID),
        int(userID),
        roleType,
        membershipStatus
    )

    cursor.callproc("UpdateGroupMemberStatus", parameters)
    db.commit()

    return jsonify({"message": "Mentorship request updated successfully"}), 200


@app.delete("/api/mentorship-requests")
@login_required
def remove_mentor_request():
    data = request.get_json()

    groupID = data.get("groupID")
    userID = data.get("userID")

    if not groupID or not userID:
        return jsonify({"error": "Missing groupID or userID."}), 400

    parameters = (
        int(groupID),
        int(userID)
    )

    cursor.callproc("RemoveGroupMember", parameters)
    db.commit()

    return jsonify({"message": "Mentorship request removed successfully"}), 200



@app.get("/api/health")
def health_check():
    return jsonify({"message": "Backend is running"}), 200

if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('FRONTEND_CERT_PATH'), os.getenv('FRONTEND_KEY_PATH')),
        debug=True
    )
