from flask import Flask, jsonify, request, g
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import mysql.connector
import secrets

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://localhost:5173"])  # allows frontend to communicate with backend
socketio = SocketIO(app, cors_allowed_origins="https://localhost:5173")


# Connects the backend to the MySQL database
# Author: Ashley Pike
db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    ssl_ca=os.getenv("CA_PATH")
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

        cursor.execute(
            "SELECT USER_ID FROM SESSIONS WHERE TOKEN = %s AND EXPIRES_AT > %s",
            (token, now)
        )
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
    major = data.get("major")
    graduationYear = data.get("graduationYear")
    department = data.get("department")
    officeLocation = data.get("officeLocation")
    degreeEarned = data.get("degreeEarned")
    currentEmployer = data.get("currentEmployer")

    hashedPassword = generate_password_hash(password, method="pbkdf2:sha256")

    cursor.execute(
        "SELECT USER_ID FROM USERS WHERE USERNAME = %s OR EMAIL = %s",
        (username, email)
    )
    exists = cursor.fetchone()

    if exists:
        return jsonify({"error": "Username or email already exists."}), 401

    cursor.execute(
        "INSERT INTO USERS (USERNAME, PASS_WORD, EMAIL, NAME, PHONE_NUMBER, BIRTH_DATE, USER_TYPE) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (username, hashedPassword, email, name, phoneNumber, birthDate, userType)
    )
    user_id = cursor.lastrowid

    if userType == "Student":
        if not major or not graduationYear:
            return jsonify({"error": "Major and graduation year are required for students."}), 400
        cursor.execute(
            "INSERT INTO STUDENTS (USER_ID, MAJOR, GRADUATION_YEAR) VALUES (%s, %s, %s)",
            (user_id, major, graduationYear)
        )
    elif userType == "Faculty":
        if not department or not officeLocation:
            return jsonify({"error": "Department and office location are required for faculty."}), 400
        cursor.execute(
            "INSERT INTO FACULTY (USER_ID, DEPARTMENT, OFFICE_LOCATION) VALUES (%s, %s, %s)",
            (user_id, department, officeLocation)
        )
    elif userType == "Alumni":
        if not graduationYear or not degreeEarned or not currentEmployer:
            return jsonify({"error": "Graduation year, degree earned, and current employer are required for alumni."}), 400
        cursor.execute(
            "INSERT INTO ALUMNI (USER_ID, GRADUATION_YEAR, DEGREE_EARNED, CURRENT_EMPLOYER) VALUES (%s, %s, %s, %s)",
            (user_id, graduationYear, degreeEarned, currentEmployer)
        )
    else:
        return jsonify({"error": "Invalid user type."}), 400

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

    cursor.execute(
        "SELECT USER_ID, PASS_WORD FROM USERS WHERE USERNAME = %s",
        (username,)
    )
    user = cursor.fetchone()

    if not user or not check_password_hash(user["PASS_WORD"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = secrets.token_hex(32)
    userID = user["USER_ID"]
    createdAt = datetime.now(timezone.utc)
    expiresAt = createdAt + timedelta(days=1)

    response = jsonify({"message": "Login successful"})
    response.set_cookie(
        'token',
        token,
        expires=expiresAt,
        secure=True,
        httponly=True,
        samesite="None"
    )

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


@app.post("/api/conversations")
@login_required
def create_conversation():
    data = request.get_json()
    user_id = g.user_id
    otherUsers = data.get("otherUsers")
    conversationName = data.get("conversationName")

    cursor.execute("INSERT INTO CONVERSATIONS (NAME) VALUES (%s)", (conversationName,))
    conversation = cursor.lastrowid

    cursor.execute(
        "INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)",
        (conversation, user_id)
    )
    for each in otherUsers:
        cursor.execute(
            "INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)",
            (conversation, each)
        )

    response = jsonify({"message": "Conversation created"})
    db.commit()

    return response, 201


@app.get("/api/conversations")
@login_required
def get_conversations():
    cursor.execute("""
        SELECT
            c.CONVERSATION_ID AS conversation_id,
            CASE 
                WHEN c.NAME IS NOT NULL THEN c.NAME
                WHEN COUNT(cm2.USER_ID) = 1 THEN u.USERNAME
                ELSE CONCAT('Group (', COUNT(cm2.USER_ID), ' members)')
            END AS display_name,
            COALESCE(m.CONTENT, '') AS latest_message,
            COALESCE(m.TIMESTAMP, c.CREATED_AT) AS latest_time
        FROM CONVERSATION_MEMBERS cm1
        JOIN CONVERSATIONS c
            ON cm1.CONVERSATION_ID = c.CONVERSATION_ID
        LEFT JOIN CONVERSATION_MEMBERS cm2
            ON c.CONVERSATION_ID = cm2.CONVERSATION_ID
           AND cm2.USER_ID != cm1.USER_ID
        LEFT JOIN USERS u
            ON cm2.USER_ID = u.USER_ID
        LEFT JOIN (
            SELECT m1.CONVERSATION_ID, m1.CONTENT, m1.TIMESTAMP
            FROM MESSAGE m1
            JOIN (
                SELECT CONVERSATION_ID, MAX(TIMESTAMP) AS max_timestamp
                FROM MESSAGE
                GROUP BY CONVERSATION_ID
            ) latest
              ON m1.CONVERSATION_ID = latest.CONVERSATION_ID
             AND m1.TIMESTAMP = latest.max_timestamp
        ) m
            ON c.CONVERSATION_ID = m.CONVERSATION_ID
        WHERE cm1.USER_ID = %s
        GROUP BY c.CONVERSATION_ID, c.NAME, u.USERNAME, m.CONTENT, m.TIMESTAMP, c.CREATED_AT
        ORDER BY latest_time DESC
    """, (g.user_id,))

    conversations = cursor.fetchall()
    return jsonify(conversations), 200


@app.get("/api/conversations/<int:conversation_id>/messages")
@login_required
def get_messages(conversation_id):
    cursor.execute(
        "SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s",
        (conversation_id, g.user_id)
    )
    if not cursor.fetchone():
        return jsonify({"error": "Unauthorized"}), 403

    cursor.execute("""
        SELECT
            MESSAGE_ID AS message_id,
            SENDER_ID AS sender_id,
            CONTENT AS body,
            TIMESTAMP AS sent_at
        FROM MESSAGE
        WHERE CONVERSATION_ID = %s
        ORDER BY TIMESTAMP ASC
    """, (conversation_id,))
    messages = cursor.fetchall()
    return jsonify(messages), 200


@app.post("/api/conversations/<int:conversation_id>/messages")
@login_required
def send_message(conversation_id):
    cursor.execute(
        "SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s",
        (conversation_id, g.user_id)
    )
    if not cursor.fetchone():
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    body = data.get('body')
    if not body:
        return jsonify({"error": "Message body required"}), 400

    cursor.execute(
        "INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (%s, %s, %s)",
        (conversation_id, g.user_id, body)
    )
    db.commit()
    
    # Emit the message to all users in the conversation room
    cursor.execute("SELECT MESSAGE_ID FROM MESSAGE WHERE CONVERSATION_ID = %s AND SENDER_ID = %s ORDER BY TIMESTAMP DESC LIMIT 1", (conversation_id, g.user_id))
    message_record = cursor.fetchone()
    
    message_data = {
        "message_id": message_record["MESSAGE_ID"],
        "sender_id": g.user_id,
        "body": body,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    
    socketio.emit('receive_message', message_data, room=conversation_id)
    
    return jsonify({"message": "Message sent"}), 201


@socketio.on('join_conversation')
def handle_join_conversation(data):
    conversation_id = data.get('conversation_id')
    join_room(conversation_id)

@socketio.on('leave_conversation')
def handle_leave_conversation(data):
    conversation_id = data.get('conversation_id')
    leave_room(conversation_id)

@socketio.on('send_message')
def handle_send_message(data):
    conversation_id = data.get('conversation_id')
    body = data.get('body')
    user_id = data.get('user_id')
    
    if not body or not conversation_id:
        return False
    
    # Check if user is a member of the conversation
    cursor.execute("SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s", (conversation_id, user_id))
    if not cursor.fetchone():
        return False
    
    cursor.execute("INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (%s, %s, %s)", (conversation_id, user_id, body))
    db.commit()
    
    # Emit the message to all users in the conversation room
    cursor.execute("SELECT MESSAGE_ID FROM MESSAGE WHERE CONVERSATION_ID = %s AND SENDER_ID = %s ORDER BY TIMESTAMP DESC LIMIT 1", (conversation_id, user_id))
    message_record = cursor.fetchone()
    
    message_data = {
        "message_id": message_record["MESSAGE_ID"],
        "sender_id": user_id,
        "body": body,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }
    
    socketio.emit('receive_message', message_data, room=conversation_id)
    return True


@app.get("/api/profile/<int:user_id>")
@login_required
def get_profile(user_id):
    cursor.execute("SELECT USER_ID, USERNAME, EMAIL, NAME, BIO, PICTURE_URL, PHONE_NUMBER, BIRTH_DATE, USER_TYPE FROM USERS WHERE USER_ID = %s", (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    response = {
        "user_id": user["USER_ID"],
        "username": user["USERNAME"],
        "email": user["EMAIL"],
        "name": user["NAME"],
        "bio": user["BIO"],
        "picture_url": user["PICTURE_URL"],
        "phone_number": user["PHONE_NUMBER"],
        "birth_date": user["BIRTH_DATE"],
        "user_type": user["USER_TYPE"]
    }

    # Fetch role-specific data
    user_type = user["USER_TYPE"]
    if user_type == "Student":
        cursor.execute("SELECT MAJOR, GRADUATION_YEAR FROM STUDENTS WHERE USER_ID = %s", (user_id,))
        student = cursor.fetchone()
        if student:
            response["major"] = student["MAJOR"]
            response["graduation_year"] = student["GRADUATION_YEAR"]
    elif user_type == "Faculty":
        cursor.execute("SELECT DEPARTMENT, OFFICE_LOCATION FROM FACULTY WHERE USER_ID = %s", (user_id,))
        faculty = cursor.fetchone()
        if faculty:
            response["department"] = faculty["DEPARTMENT"]
            response["office_location"] = faculty["OFFICE_LOCATION"]
    elif user_type == "Alumni":
        cursor.execute("SELECT GRADUATION_YEAR, DEGREE_EARNED, CURRENT_EMPLOYER FROM ALUMNI WHERE USER_ID = %s", (user_id,))
        alumni = cursor.fetchone()
        if alumni:
            response["graduation_year"] = alumni["GRADUATION_YEAR"]
            response["degree_earned"] = alumni["DEGREE_EARNED"]
            response["current_employer"] = alumni["CURRENT_EMPLOYER"]

    return jsonify(response), 200


@app.post("/api/profile/edit/")
@login_required
def edit_profile():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    phoneNumber = data.get("phoneNumber")
    birthDate = data.get("birthDate")
    bio = data.get("bio")
    pictureUrl = data.get("pictureUrl")
    userType = data.get("userType")
    major = data.get("major")
    graduationYear = data.get("graduationYear")
    department = data.get("department")
    officeLocation = data.get("officeLocation")
    degreeEarned = data.get("degreeEarned")
    currentEmployer = data.get("currentEmployer")

    cursor.execute("""
        UPDATE USERS
        SET EMAIL = %s, NAME = %s, PHONE_NUMBER = %s, BIRTH_DATE = %s, bio = %s, PICTURE_URL = %s
        WHERE USER_ID = %s
    """, (email, name, phoneNumber, birthDate, bio, pictureUrl, g.user_id))

    if userType == "Student":
        cursor.execute("""
            UPDATE STUDENTS
            SET MAJOR = %s, GRADUATION_YEAR = %s
            WHERE USER_ID = %s
        """, (major, graduationYear, g.user_id))
    elif userType == "Faculty":
        cursor.execute("""
            UPDATE FACULTY
            SET DEPARTMENT = %s, OFFICE_LOCATION = %s
            WHERE USER_ID = %s
        """, (department, officeLocation, g.user_id))
    elif userType == "Alumni":
        cursor.execute("""
            UPDATE ALUMNI
            SET GRADUATION_YEAR = %s, DEGREE_EARNED = %s, CURRENT_EMPLOYER = %s
            WHERE USER_ID = %s
        """, (graduationYear, degreeEarned, currentEmployer, g.user_id))

    db.commit()

    return jsonify({"message": "Profile updated successfully."}), 200


# This functions returns all posts to the feed
# Author: Sophia Priola
@app.get("/api/posts")
def get_posts():
    local_cursor = db.cursor(dictionary=True)
    local_cursor.callproc("GET_POSTS")

    posts = []
    for result in local_cursor.stored_results():
        posts = result.fetchall()

    local_cursor.close()
    return jsonify(posts), 200

@app.post("/api/posts")
@login_required
def create_post():
    data = request.get_json()
    content = data.get("content")

    if not content or not content.strip():
        return jsonify({"error": "Post content is required"}), 400
    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        "INSERT INTO POSTS (AUTHOR_ID, CONTENT) VALUES (%s, %s)",
        (g.user_id, content)
    )
    db.commit()
    local_cursor.close()   
    return jsonify({"message": "Post created successfully"}), 201

# Like a post
@app.post("/api/posts/<int:post_id>/like")
@login_required
def like_post(post_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        "SELECT 1 FROM LIKES WHERE USER_ID = %s AND POST_ID = %s",
        (g.user_id, post_id)
    )
    existing = local_cursor.fetchone()

    if existing:
        local_cursor.close()
        return jsonify({"message": "Post already liked"}), 200

    local_cursor.execute(
        "INSERT INTO LIKES (USER_ID, POST_ID) VALUES (%s, %s)",
        (g.user_id, post_id)
    )
    db.commit()
    local_cursor.close()

    return jsonify({"message": "Post liked"}), 201


# Unlike a post
@app.delete("/api/posts/<int:post_id>/like")
@login_required
def unlike_post(post_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        "DELETE FROM LIKES WHERE USER_ID = %s AND POST_ID = %s",
        (g.user_id, post_id)
    )
    db.commit()
    local_cursor.close()

    return jsonify({"message": "Post unliked"}), 200
    
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
    socketio.run(
        app,
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('FRONTEND_CERT_PATH'), os.getenv('FRONTEND_KEY_PATH')),
        debug=True
    )
    