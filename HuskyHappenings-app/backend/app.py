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
    major = data.get("major")
    graduationYear = data.get("graduationYear")
    department = data.get("department")
    officeLocation = data.get("officeLocation")
    degreeEarned = data.get("degreeEarned")
    currentEmployer = data.get("currentEmployer")

    hashedPassword = generate_password_hash(password)

    cursor.execute("SELECT USER_ID FROM USERS WHERE USERNAME = %s OR EMAIL = %s", (username, email))
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

@app.post("/api/conversations")
@login_required
def create_conversation():
    data = request.get_json()
    user_id = g.user_id
    otherUsers = data.get("otherUsers")
    conversationName = data.get("conversationName")

    cursor.execute("INSERT INTO CONVERSATIONS (NAME) VALUES (%s)", (conversationName,))
    conversation = cursor.lastrowid

    cursor.execute("INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)", (conversation, user_id))
    for each in otherUsers:
        cursor.execute("INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)", (conversation, each))

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
    # Check if user is a member of the conversation
    cursor.execute("SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s", (conversation_id, g.user_id))
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
    # Check if user is a member of the conversation
    cursor.execute("SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s", (conversation_id, g.user_id))
    if not cursor.fetchone():
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json()
    body = data.get('body')
    if not body:
        return jsonify({"error": "Message body required"}), 400
    
    cursor.execute("INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (%s, %s, %s)", (conversation_id, g.user_id, body))
    db.commit()
    return jsonify({"message": "Message sent"}), 201


@app.get("/api/profile/<int:user_id>")
@login_required
def get_profile(user_id):
    cursor.execute("SELECT USER_ID, USERNAME, EMAIL, NAME, BIO, PICTURE_URL FROM USERS WHERE USER_ID = %s", (user_id,))
    user = cursor.fetchone()

    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "user_id": user["USER_ID"],
        "username": user["USERNAME"],
        "email": user["EMAIL"],
        "name": user["NAME"],
        "bio": user["BIO"],
        "picture_url": user["PICTURE_URL"]
    }), 200

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
    


if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('FRONTEND_CERT_PATH'), os.getenv('FRONTEND_KEY_PATH')),
        debug=True
    )