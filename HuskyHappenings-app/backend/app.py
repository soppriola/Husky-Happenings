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
            StartDateTime AS startDateTime,
            EndDateTime AS endDateTime,
            PrivacyType AS privacyType,
            EventStatus AS status
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

    cursor.execute("""
        INSERT INTO Event (
            CreatedByUserID,
            GroupID,
            Title,
            Description,
            Location,
            StartDateTime,
            EndDateTime,
            PrivacyType,
            EventStatus,
            CancellationReason
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Active', NULL)
    """, (
        g.user_id,
        None,
        title,
        description,
        location,
        start_dt,
        end_dt,
        privacyType
    ))

    db.commit()

    return jsonify({"message": "Event created successfully"}), 201


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
            Deadline AS deadline,
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

    cursor.execute("""
        INSERT INTO JobPosting (
            PostedByUserID,
            Title,
            Company,
            Location,
            Description,
            ApplicationMethod,
            ApplicationURL,
            ContactEmail,
            Deadline,
            JobStatus
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Active')
    """, (
        g.user_id,
        title,
        company,
        location,
        description,
        applicationMethod,
        applicationURL,
        contactEmail,
        deadline_dt
    ))

    db.commit()

    return jsonify({"message": "Job created successfully"}), 201


# =========================================================
# ARIANNA: MENTORSHIP FEATURE
# Temporary in-memory version for now
# =========================================================

mentorships = [
    {
        "id": 1,
        "name": "Women in Tech Mentorship",
        "mentorName": "Professor Smith",
        "focusArea": "Software Engineering",
        "description": "Connects students with faculty mentors.",
        "meetingStyle": "Virtual"
    }
]

mentor_requests = []


@app.get("/api/mentorships")
def get_mentorships():
    return jsonify(mentorships), 200


@app.post("/api/mentorships")
@login_required
def create_mentorship():
    data = request.get_json()

    name = data.get("name")
    mentorName = data.get("mentorName")
    focusArea = data.get("focusArea")
    description = data.get("description")
    meetingStyle = data.get("meetingStyle")

    if not name or not mentorName or not focusArea or not description or not meetingStyle:
        return jsonify({"error": "Missing required mentorship fields."}), 400

    new_mentorship = {
        "id": len(mentorships) + 1,
        "name": name,
        "mentorName": mentorName,
        "focusArea": focusArea,
        "description": description,
        "meetingStyle": meetingStyle
    }

    mentorships.append(new_mentorship)
    return jsonify(new_mentorship), 201


@app.get("/api/mentorship-requests")
@login_required
def get_mentor_requests():
    return jsonify(mentor_requests), 200


@app.post("/api/mentorship-requests")
@login_required
def create_mentor_request():
    data = request.get_json()

    studentName = data.get("studentName")
    interestArea = data.get("interestArea")
    goal = data.get("goal")

    if not studentName or not interestArea or not goal:
        return jsonify({"error": "Missing required mentorship request fields."}), 400

    new_request = {
        "id": len(mentor_requests) + 1,
        "studentName": studentName,
        "interestArea": interestArea,
        "goal": goal,
        "status": "Pending"
    }

    mentor_requests.append(new_request)
    return jsonify(new_request), 201


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
