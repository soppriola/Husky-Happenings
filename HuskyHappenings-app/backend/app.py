from flask import Flask, jsonify, request, g
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from flask_socketio import SocketIO, join_room, leave_room
import os
import mysql.connector
import secrets

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173")


# Connects the backend to the MySQL database
# Author: Ashley Pike
db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)
cursor = db.cursor(dictionary=True)


# This decorator wraps a function with a check to see if the user has a valid token before proceeding
# Author: Ashley Pike
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.cookies.get("token")

        if not token:
            return jsonify({"error": "Session cookie not found."}), 401

        now = datetime.now(timezone.utc)

        local_cursor = db.cursor(dictionary=True)
        local_cursor.execute(
            "SELECT USER_ID FROM SESSIONS WHERE TOKEN = %s AND EXPIRES_AT > %s",
            (token, now)
        )
        session_data = local_cursor.fetchone()
        local_cursor.close()

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
    user_id = user["USER_ID"]
    created_at = datetime.now(timezone.utc)
    expires_at = created_at + timedelta(days=1)

    response = jsonify({"message": "Login successful"})
    response.set_cookie(
        "token",
        token,
        expires=expires_at,
        secure=False,
        httponly=True,
        samesite="Lax"
    )

    parameters = (token, user_id, created_at, expires_at)
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
    response.set_cookie("token", "", expires=0, secure=False, httponly=True, samesite="Lax")
    return response, 200


# This function returns information about logged in user
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
    body = data.get("body")
    if not body:
        return jsonify({"error": "Message body required"}), 400

    cursor.execute(
        "INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (%s, %s, %s)",
        (conversation_id, g.user_id, body)
    )

    cursor.execute(
        "SELECT USERNAME FROM USERS WHERE USER_ID = %s",
        (g.user_id,)
    )
    sender = cursor.fetchone()

    cursor.execute(
        """
        SELECT USER_ID
        FROM CONVERSATION_MEMBERS
        WHERE CONVERSATION_ID = %s
          AND USER_ID != %s
        """,
        (conversation_id, g.user_id)
    )
    recipients = cursor.fetchall()

    db.commit()

    if sender:
        for recipient in recipients:
            create_notification(
                recipient_user_id=recipient["USER_ID"],
                trigger_user_id=g.user_id,
                notification_type="message",
                message=f'{sender["USERNAME"]} sent you a message',
                related_post_id=None
            )

    # Emit the message to all users in the conversation room
    cursor.execute(
        """
        SELECT MESSAGE_ID
        FROM MESSAGE
        WHERE CONVERSATION_ID = %s AND SENDER_ID = %s
        ORDER BY TIMESTAMP DESC
        LIMIT 1
        """,
        (conversation_id, g.user_id)
    )
    message_record = cursor.fetchone()

    message_data = {
        "message_id": message_record["MESSAGE_ID"],
        "sender_id": g.user_id,
        "body": body,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }

    socketio.emit("receive_message", message_data, room=str(conversation_id))

    return jsonify({"message": "Message sent"}), 201


@socketio.on("join_conversation")
def handle_join_conversation(data):
    conversation_id = data.get("conversation_id")
    join_room(str(conversation_id))


@socketio.on("leave_conversation")
def handle_leave_conversation(data):
    conversation_id = data.get("conversation_id")
    leave_room(str(conversation_id))


@socketio.on("send_message")
def handle_send_message(data):
    conversation_id = data.get("conversation_id")
    body = data.get("body")
    user_id = data.get("user_id")

    if not body or not conversation_id or not user_id:
        return False

    cursor.execute(
        "SELECT 1 FROM CONVERSATION_MEMBERS WHERE CONVERSATION_ID = %s AND USER_ID = %s",
        (conversation_id, user_id)
    )
    if not cursor.fetchone():
        return False

    cursor.execute(
        "INSERT INTO MESSAGE (CONVERSATION_ID, SENDER_ID, CONTENT) VALUES (%s, %s, %s)",
        (conversation_id, user_id, body)
    )
    db.commit()

    cursor.execute(
        """
        SELECT MESSAGE_ID
        FROM MESSAGE
        WHERE CONVERSATION_ID = %s AND SENDER_ID = %s
        ORDER BY TIMESTAMP DESC
        LIMIT 1
        """,
        (conversation_id, user_id)
    )
    message_record = cursor.fetchone()

    message_data = {
        "message_id": message_record["MESSAGE_ID"],
        "sender_id": user_id,
        "body": body,
        "sent_at": datetime.now(timezone.utc).isoformat()
    }

    socketio.emit("receive_message", message_data, room=str(conversation_id))
    return True

@app.post("/api/conversations")
@login_required
def create_conversation():
    data = request.get_json()
    user_id = g.user_id
    other_users = data.get("otherUsers")
    conversation_name = data.get("conversationName")

    cursor.execute(
        "INSERT INTO CONVERSATIONS (NAME) VALUES (%s)",
        (conversation_name,)
    )
    conversation = cursor.lastrowid

    cursor.execute(
        "INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)",
        (conversation, user_id)
    )

    for each in other_users:
        cursor.execute(
            "INSERT INTO CONVERSATION_MEMBERS (CONVERSATION_ID, USER_ID) VALUES (%s, %s)",
            (conversation, each)
        )

    db.commit()
    return jsonify({"message": "Conversation created"}), 201


@app.get("/api/profile/<int:user_id>")
@login_required
def get_profile(user_id):
    cursor.execute(
        """
        SELECT USER_ID, USERNAME, EMAIL, NAME, BIO, PICTURE_URL,
               PHONE_NUMBER, BIRTH_DATE, USER_TYPE
        FROM USERS
        WHERE USER_ID = %s
        """,
        (user_id,)
    )
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

    user_type = user["USER_TYPE"]

    if user_type == "Student":
        cursor.execute(
            "SELECT MAJOR, GRADUATION_YEAR FROM STUDENTS WHERE USER_ID = %s",
            (user_id,)
        )
        student = cursor.fetchone()
        if student:
            response["major"] = student["MAJOR"]
            response["graduation_year"] = student["GRADUATION_YEAR"]

    elif user_type == "Faculty":
        cursor.execute(
            "SELECT DEPARTMENT, OFFICE_LOCATION FROM FACULTY WHERE USER_ID = %s",
            (user_id,)
        )
        faculty = cursor.fetchone()
        if faculty:
            response["department"] = faculty["DEPARTMENT"]
            response["office_location"] = faculty["OFFICE_LOCATION"]

    elif user_type == "Alumni":
        cursor.execute(
            "SELECT GRADUATION_YEAR, DEGREE_EARNED, CURRENT_EMPLOYER FROM ALUMNI WHERE USER_ID = %s",
            (user_id,)
        )
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
    phone_number = data.get("phoneNumber")
    birth_date = data.get("birthDate")
    bio = data.get("bio")
    picture_url = data.get("pictureUrl")
    user_type = data.get("userType")
    major = data.get("major")
    graduation_year = data.get("graduationYear")
    department = data.get("department")
    office_location = data.get("officeLocation")
    degree_earned = data.get("degreeEarned")
    current_employer = data.get("currentEmployer")

    cursor.execute("""
        UPDATE USERS
        SET EMAIL = %s, NAME = %s, PHONE_NUMBER = %s, BIRTH_DATE = %s, BIO = %s, PICTURE_URL = %s
        WHERE USER_ID = %s
    """, (email, name, phone_number, birth_date, bio, picture_url, g.user_id))

    if user_type == "Student":
        cursor.execute("""
            UPDATE STUDENTS
            SET MAJOR = %s, GRADUATION_YEAR = %s
            WHERE USER_ID = %s
        """, (major, graduation_year, g.user_id))
    elif user_type == "Faculty":
        cursor.execute("""
            UPDATE FACULTY
            SET DEPARTMENT = %s, OFFICE_LOCATION = %s
            WHERE USER_ID = %s
        """, (department, office_location, g.user_id))
    elif user_type == "Alumni":
        cursor.execute("""
            UPDATE ALUMNI
            SET GRADUATION_YEAR = %s, DEGREE_EARNED = %s, CURRENT_EMPLOYER = %s
            WHERE USER_ID = %s
        """, (graduation_year, degree_earned, current_employer, g.user_id))

    db.commit()
    return jsonify({"message": "Profile updated successfully."}), 200


# This function returns all posts visible to the logged-in user's groups
# and also the user's own personal posts
# Author: Sophia Priola
@app.get("/api/posts")
@login_required
def get_posts():
    local_cursor = db.cursor(dictionary=True)
    local_cursor.callproc("GET_POSTS", (g.user_id,))

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
    group_id = data.get("groupId")

    if not content or not content.strip():
        return jsonify({"error": "Post content is required"}), 400

    local_cursor = db.cursor(dictionary=True)

    if group_id:
        local_cursor.execute(
            """
            SELECT 1
            FROM GroupMember
            WHERE GroupID = %s AND UserID = %s AND MembershipStatus = 'Accepted'
            """,
            (group_id, g.user_id)
        )
        member = local_cursor.fetchone()

        if not member:
            local_cursor.close()
            return jsonify({"error": "You are not a member of this group"}), 403

        local_cursor.execute(
            "INSERT INTO POSTS (AUTHOR_ID, CONTENT, GroupID) VALUES (%s, %s, %s)",
            (g.user_id, content, group_id)
        )
    else:
        local_cursor.execute(
            "INSERT INTO POSTS (AUTHOR_ID, CONTENT, GroupID) VALUES (%s, %s, NULL)",
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

    local_cursor.execute(
        """
        SELECT p.AUTHOR_ID, u.USERNAME
        FROM POSTS p
        JOIN USERS u ON u.USER_ID = %s
        WHERE p.POST_ID = %s
        """,
        (g.user_id, post_id)
    )
    post_info = local_cursor.fetchone()

    db.commit()
    local_cursor.close()

    if post_info:
        create_notification(
            recipient_user_id=post_info["AUTHOR_ID"],
            trigger_user_id=g.user_id,
            notification_type="like",
            message=f'{post_info["USERNAME"]} liked your post',
            related_post_id=post_id
        )

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


# Share a post
@app.post("/api/posts/<int:post_id>/share")
@login_required
def share_post(post_id):
    data = request.get_json() or {}
    content = data.get("content", "")

    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT p.POST_ID, p.AUTHOR_ID, p.GroupID, u.USERNAME
        FROM POSTS p
        JOIN USERS u ON u.USER_ID = %s
        WHERE p.POST_ID = %s
        """,
        (g.user_id, post_id)
    )
    original_post = local_cursor.fetchone()

    if not original_post:
        local_cursor.close()
        return jsonify({"error": "Original post not found"}), 404

    local_cursor.execute(
        """
        INSERT INTO POSTS (AUTHOR_ID, CONTENT, SHARED_POST_ID, GroupID)
        VALUES (%s, %s, %s, %s)
        """,
        (g.user_id, content, post_id, original_post["GroupID"])
    )

    db.commit()
    local_cursor.close()

    create_notification(
        recipient_user_id=original_post["AUTHOR_ID"],
        trigger_user_id=g.user_id,
        notification_type="share",
        message=f'{original_post["USERNAME"]} shared your post',
        related_post_id=post_id
    )

    return jsonify({"message": "Post shared successfully"}), 201


# Get comments for a post
@app.get("/api/posts/<int:post_id>/comments")
@login_required
def get_comments(post_id):
    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute("""
        SELECT
            C.COMMENT_ID,
            C.POST_ID,
            C.AUTHOR_ID,
            U.USERNAME,
            C.CONTENT,
            C.TIMESTAMP
        FROM COMMENTS C
        JOIN USERS U ON C.AUTHOR_ID = U.USER_ID
        WHERE C.POST_ID = %s
        ORDER BY C.TIMESTAMP ASC
    """, (post_id,))

    comments = local_cursor.fetchall()
    local_cursor.close()
    return jsonify(comments), 200


# Create a comment on a post
@app.post("/api/posts/<int:post_id>/comments")
@login_required
def create_comment(post_id):
    data = request.get_json()
    content = data.get("content")

    if not content or not content.strip():
        return jsonify({"error": "Comment content is required"}), 400

    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        "INSERT INTO COMMENTS (POST_ID, AUTHOR_ID, CONTENT) VALUES (%s, %s, %s)",
        (post_id, g.user_id, content)
    )

    local_cursor.execute(
        """
        SELECT p.AUTHOR_ID, p.GroupID, u.USERNAME
        FROM POSTS p
        JOIN USERS u ON u.USER_ID = %s
        WHERE p.POST_ID = %s
        """,
        (g.user_id, post_id)
    )
    post_info = local_cursor.fetchone()

    db.commit()
    local_cursor.close()

    if post_info and post_info["GroupID"] is not None:
        create_notification(
            recipient_user_id=post_info["AUTHOR_ID"],
            trigger_user_id=g.user_id,
            notification_type="comment",
            message=f'{post_info["USERNAME"]} commented on your post',
            related_post_id=post_id
        )

    return jsonify({"message": "Comment created successfully"}), 201


# =========================================================
# ARIANNA: EVENTS FEATURE
# =========================================================

# Returns events
# Author: Arianna Kelsey
@app.get("/api/events")
@login_required
def get_events():
    cursor.execute("""
        SELECT
            e.EventID AS id,
            e.CreatedByUserID AS createdBy,
            (e.CreatedByUserID = %s) AS canManage,
            e.Title AS title,
            e.Description AS description,
            e.Location AS location,
            CAST(e.StartDateTime AS CHAR) AS startDateTime,
            CAST(e.EndDateTime AS CHAR) AS endDateTime,
            e.PrivacyType AS privacyType,
            e.EventStatus AS status,
            e.CancellationReason AS cancellationReason,
            e.GroupID AS groupID
        FROM Event e
        WHERE
            e.PrivacyType = 'Public'
            OR e.GroupID IN (
                SELECT gm.GroupID
                FROM GroupMember gm
                WHERE gm.UserID = %s
                  AND gm.MembershipStatus = 'Accepted'
            )
        ORDER BY e.StartDateTime ASC
    """, (g.user_id, g.user_id))

    events = cursor.fetchall()
    return jsonify(events), 200

# Create Event
# Author: Arianna Kelsey
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
    groupID = data.get("groupID")

    if groupID == "":
        groupID = None

    if not title or not location or not startDateTime or not endDateTime:
        return jsonify({"error": "Missing required event fields."}), 400

    try:
        start_dt = datetime.fromisoformat(startDateTime)
        end_dt = datetime.fromisoformat(endDateTime)
    except ValueError:
        return jsonify({"error": "Invalid event date format."}), 400

    if end_dt <= start_dt:
        return jsonify({"error": "End date/time must be after start date/time."}), 400

    if start_dt <= datetime.now():
        return jsonify({"error": "Event must be in the future."}), 400

    # If PRIVATE → must have group
    if privacyType == "Private" and not groupID:
        return jsonify({"error": "Private events must belong to a group"}), 400

    parameters = (
        g.user_id,
        groupID,   
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

# Check if the user is the event creator
# Author: Arianna Kelsey
def is_event_creator(event_id, user_id):
    cursor.execute(
        """
        SELECT CreatedByUserID
        FROM Event
        WHERE EventID = %s
        """,
        (event_id,)
    )

    event = cursor.fetchone()

    if not event:
        return False

    return str(event["CreatedByUserID"]) == str(user_id)

# Updates Events
# Author: Arianna Kelsey
@app.put("/api/events/<int:event_id>")
@login_required
def update_event(event_id):
    if not is_event_creator(event_id, g.user_id):
        return jsonify({"error": "Only the creator can edit this event."}), 403

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
        return jsonify({"error": "End must be after start."}), 400

    if start_dt <= datetime.now():
        return jsonify({"error": "Event must be scheduled in the future."}), 400

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

# Cancels an event
# Author: Arianna Kelsey
@app.put("/api/events/<int:event_id>/cancel")
@login_required
def cancel_event(event_id):
    if not is_event_creator(event_id, g.user_id):
        return jsonify({"error": "Only the creator can cancel this event."}), 403

    data = request.get_json() or {}
    cancellationReason = data.get("cancellationReason", "Cancelled by user")

    cursor.callproc("CancelEvent", (event_id, cancellationReason))
    db.commit()

    return jsonify({"message": "Event cancelled successfully"}), 200

# Deletes a posted event
# Author: Arianna Kelsey
@app.delete("/api/events/<int:event_id>")
@login_required
def delete_event(event_id):
    if not is_event_creator(event_id, g.user_id):
        return jsonify({"error": "Only the creator can delete this event."}), 403

    cursor.callproc("DeleteEvent", (event_id,))
    db.commit()

    return jsonify({"message": "Event deleted successfully"}), 200

# Register for Event
# Author: Arianna Kelsey
@app.post("/api/events/<int:event_id>/register")
@login_required
def register_for_event(event_id):
    data = request.get_json() or {}
    rsvpStatus = data.get("rsvpStatus", "Going")

    # Get event info
    cursor.execute("""
        SELECT PrivacyType, GroupID
        FROM Event
        WHERE EventID = %s
    """, (event_id,))
    event = cursor.fetchone()

    if not event:
        return jsonify({"error": "Event not found"}), 404

    # PRIVATE EVENT CHECK
    if event["PrivacyType"] == "Private":
        cursor.execute("""
            SELECT 1 FROM GroupMember
            WHERE GroupID = %s
              AND UserID = %s
              AND MembershipStatus = 'Accepted'
        """, (event["GroupID"], g.user_id))

        member = cursor.fetchone()

        if not member:
            return jsonify({"error": "You are not allowed to join this private event"}), 403

    # existing logic
    cursor.execute("""
        SELECT EventRegistrationID
        FROM EventRegistration
        WHERE EventID = %s AND UserID = %s
    """, (event_id, g.user_id))

    existing = cursor.fetchone()

    if existing:
        cursor.execute("""
            UPDATE EventRegistration
            SET RSVPStatus = %s,
                RegistrationStatus = 'Responded'
            WHERE EventID = %s AND UserID = %s
        """, (rsvpStatus, event_id, g.user_id))
    else:
        cursor.execute("""
            INSERT INTO EventRegistration
                (EventID, UserID, RSVPStatus, RegistrationStatus)
            VALUES
                (%s, %s, %s, 'Responded')
        """, (event_id, g.user_id, rsvpStatus))

    db.commit()

    return jsonify({"message": "Event RSVP saved successfully"}), 201

# Update Event Registration
# Author: Arianna Kelsey
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

# Checks if user is the job creator
# Author: Arianna Kelsey
def is_job_creator(job_id, user_id):
    cursor.execute(
        """
        SELECT PostedByUserID
        FROM JobPosting
        WHERE JobPostingID = %s
        """,
        (job_id,)
    )
    job = cursor.fetchone()

    if not job:
        return False

    return str(job["PostedByUserID"]) == str(user_id)

# Returns posted jobs
# Author: Arianna Kelsey
@app.get("/api/jobs")
@login_required
def get_jobs():
    cursor.execute("""
        SELECT
            JobPostingID AS id,
            PostedByUserID AS createdBy,
            (PostedByUserID = %s) AS canManage,
            Title AS title,
            Company AS company,
            Location AS location,
            Description AS description,
            ApplicationMethod AS applicationMethod,
            ApplicationURL AS applicationURL,
            ContactEmail AS contactEmail,
            CAST(Deadline AS CHAR) AS deadline,
            JobStatus AS status
        FROM JobPosting
        ORDER BY Deadline ASC
    """, (g.user_id,))

    jobs = cursor.fetchall()

    for job in jobs:
        if job["canManage"] == 1 or job["canManage"] is True:
            cursor.execute("""
                SELECT
                    ja.JobApplicationID AS applicationId,
                    ja.JobPostingID AS jobId,
                    ja.ApplicantUserID AS applicantUserId,
                    u.NAME AS applicantName,
                    u.EMAIL AS applicantEmail,
                    ja.ApplicationStatus AS applicationStatus,
                    ja.CoverLetter AS coverLetter,
                    ja.ResumeURL AS resumeURL,
                    CAST(ja.AppliedAt AS CHAR) AS appliedAt
                FROM JobApplication ja
                JOIN USERS u
                    ON ja.ApplicantUserID = u.USER_ID
                WHERE ja.JobPostingID = %s
                ORDER BY ja.AppliedAt DESC
            """, (job["id"],))
            job["applications"] = cursor.fetchall()
        else:
            job["applications"] = []

    return jsonify(jobs), 200

# Returns job application that have been applied for
# Author: Arianna Kelsey
@app.get("/api/my-job-applications")
@login_required
def get_my_job_applications():
    cursor.execute("""
        SELECT
            ja.JobApplicationID AS applicationId,
            ja.JobPostingID AS jobId,
            jp.Title AS jobTitle,
            jp.Company AS company,
            ja.ApplicationStatus AS applicationStatus,
            ja.CoverLetter AS coverLetter,
            ja.ResumeURL AS resumeURL,
            CAST(ja.AppliedAt AS CHAR) AS appliedAt
        FROM JobApplication ja
        JOIN JobPosting jp
            ON ja.JobPostingID = jp.JobPostingID
        WHERE ja.ApplicantUserID = %s
        ORDER BY ja.AppliedAt DESC
    """, (g.user_id,))

    applications = cursor.fetchall()
    return jsonify(applications), 200

# Creates a job posting
# Author: Arianna Kelsey
@app.post("/api/jobs")
@login_required
def create_job():
    data = request.get_json()

    title = data.get("title")
    company = data.get("company")
    location = data.get("location")
    description = data.get("description")
    contactEmail = data.get("contactEmail")
    deadline = data.get("deadline")

    applicationMethod = "Email"
    applicationURL = None

    if not title or not company or not location or not description or not contactEmail or not deadline:
        return jsonify({"error": "Missing required job fields."}), 400

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

# Update job description and features
# Author: Arianna Kelsey
@app.put("/api/jobs/<int:job_id>")
@login_required
def update_job(job_id):
    if not is_job_creator(job_id, g.user_id):
        return jsonify({"error": "Only the creator can edit this job posting."}), 403

    data = request.get_json()

    title = data.get("title")
    company = data.get("company")
    location = data.get("location")
    description = data.get("description")
    contactEmail = data.get("contactEmail")
    deadline = data.get("deadline")
    status = data.get("status", "Active")

    applicationMethod = "Email"
    applicationURL = None

    if not title or not company or not location or not description or not contactEmail or not deadline:
        return jsonify({"error": "Missing required job fields."}), 400

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

# Close a job posting from submissions
# Author: Arianna Kelsey
@app.put("/api/jobs/<int:job_id>/close")
@login_required
def close_job(job_id):
    if not is_job_creator(job_id, g.user_id):
        return jsonify({"error": "Only the creator can close this job posting."}), 403

    cursor.callproc("CloseJobPosting", (job_id,))
    db.commit()

    return jsonify({"message": "Job closed successfully"}), 200

# Delete a job posting entirely
# Author: Arianna Kelsey
@app.delete("/api/jobs/<int:job_id>")
@login_required
def delete_job(job_id):
    if not is_job_creator(job_id, g.user_id):
        return jsonify({"error": "Only the creator can delete this job posting."}), 403

    cursor.callproc("DeleteJobPosting", (job_id,))
    db.commit()

    return jsonify({"message": "Job deleted successfully"}), 200

# Apply to a job
# Author: Arianna Kelsey
@app.post("/api/jobs/<int:job_id>/apply")
@login_required
def apply_to_job(job_id):
    data = request.get_json()

    coverLetter = data.get("coverLetter", "")
    resumeURL = data.get("resumeURL", "")

    cursor.execute("""
        SELECT JobStatus
        FROM JobPosting
        WHERE JobPostingID = %s
    """, (job_id,))

    job = cursor.fetchone()

    if not job:
        return jsonify({"error": "Job posting not found."}), 404

    if job["JobStatus"] == "Closed":
        return jsonify({"error": "This job is closed and no longer accepting applications."}), 400

    if is_job_creator(job_id, g.user_id):
        return jsonify({"error": "You cannot apply to your own job posting."}), 400

    parameters = (
        job_id,
        g.user_id,
        coverLetter,
        resumeURL
    )

    try:
        cursor.callproc("ApplyToJob", parameters)
        db.commit()
    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({"error": "You already applied to this job."}), 400
        return jsonify({"error": str(err)}), 500

    return jsonify({"message": "Applied to job successfully"}), 201

# Update Job Application status
# Author: Arianna Kelsey
@app.put("/api/job-applications/<int:application_id>")
@login_required
def update_job_application_status(application_id):
    data = request.get_json()
    applicationStatus = data.get("applicationStatus")

    if not applicationStatus:
        return jsonify({"error": "Missing application status."}), 400

    cursor.execute("""
        SELECT jp.PostedByUserID
        FROM JobApplication ja
        JOIN JobPosting jp
            ON ja.JobPostingID = jp.JobPostingID
        WHERE ja.JobApplicationID = %s
    """, (application_id,))

    application = cursor.fetchone()

    if not application:
        return jsonify({"error": "Application not found."}), 404

    if str(application["PostedByUserID"]) != str(g.user_id):
        return jsonify({"error": "Only the job creator can update this application status."}), 403

    cursor.callproc("UpdateJobApplicationStatus", (application_id, applicationStatus))
    db.commit()

    return jsonify({"message": "Job application status updated successfully"}), 200

# Delete job application
# Author: Arianna Kelsey
@app.delete("/api/job-applications/<int:application_id>")
@login_required
def delete_job_application(application_id):
    cursor.execute("""
        SELECT jp.PostedByUserID, ja.ApplicationStatus
        FROM JobApplication ja
        JOIN JobPosting jp
            ON ja.JobPostingID = jp.JobPostingID
        WHERE ja.JobApplicationID = %s
    """, (application_id,))

    application = cursor.fetchone()

    if not application:
        return jsonify({"error": "Application not found."}), 404

    if str(application["PostedByUserID"]) != str(g.user_id):
        return jsonify({"error": "Only the job creator can delete this application."}), 403

    if application["ApplicationStatus"] not in ["Rejected", "Declined"]:
        return jsonify({"error": "Only declined applications can be deleted."}), 400

    cursor.execute(
        "DELETE FROM JobApplication WHERE JobApplicationID = %s",
        (application_id,)
    )
    db.commit()

    return jsonify({"message": "Application deleted successfully"}), 200


# =========================================================
# ARIANNA: MENTORSHIP FEATURE
# Database-backed using HGroup / GroupMember
# =========================================================

# Checks if indiviual is group owner
# Author: Arianna Kelsey
def is_group_owner(group_id, user_id):
    cursor.execute("""
        SELECT CreatedByUserID
        FROM HGroup
        WHERE GroupID = %s
    """, (group_id,))

    group = cursor.fetchone()

    if not group:
        return False

    return str(group["CreatedByUserID"]) == str(user_id)

# Returns available mentorships
# Author: Arianna Kelsey
@app.get("/api/mentorships")
@login_required
def get_mentorships():
    cursor.execute("""
        SELECT
            hg.GroupID AS id,
            hg.CreatedByUserID AS createdBy,
            (hg.CreatedByUserID = %s) AS canManage,
            hg.GroupName AS name,
            hg.StudyCategory AS focusArea,
            hg.Description AS description,
            hg.PrivacyType AS privacyType,
            hg.IsActive AS isActive
        FROM HGroup hg
        WHERE
            hg.PrivacyType = 'Public'
            OR hg.CreatedByUserID = %s
            OR hg.GroupID IN (
                SELECT GroupID
                FROM GroupMember
                WHERE UserID = %s
                  AND MembershipStatus = 'Accepted'
            )
        ORDER BY hg.GroupID ASC
    """, (g.user_id, g.user_id, g.user_id))

    return jsonify(cursor.fetchall()), 200

# Gets requests for mentorships
# Author: Arianna Kelsey
@app.get("/api/my-mentorship-requests")
@login_required
def get_my_requests():
    cursor.execute("""
        SELECT
            gm.GroupID AS groupId,
            hg.GroupName AS groupName,
            gm.RoleType AS roleType,
            gm.MembershipStatus AS membershipStatus,
            CAST(gm.JoinedAt AS CHAR) AS joinedAt,
            u.NAME AS creatorName,
            u.EMAIL AS creatorEmail
        FROM GroupMember gm
        JOIN HGroup hg ON gm.GroupID = hg.GroupID
        JOIN USERS u ON hg.CreatedByUserID = u.USER_ID
        WHERE gm.UserID = %s
    """, (g.user_id,))

    return jsonify(cursor.fetchall()), 200

# Create a mentorship program posting 
# Author: Arianna Kelsey
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

# Update mentorship
# Author: Arianna Kelsey
@app.put("/api/mentorships/<int:group_id>")
@login_required
def update_mentorship(group_id):
    if not is_group_owner(group_id, g.user_id):
        return jsonify({"error": "Only the creator can modify this mentorship program."}), 403

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

# Deactivate Mentorship posting
# Author: Arianna Kelsey
@app.put("/api/mentorships/<int:group_id>/deactivate")
@login_required
def deactivate_mentorship(group_id):
    if not is_group_owner(group_id, g.user_id):
        return jsonify({"error": "Only the creator can modify this mentorship program."}), 403

    cursor.callproc("DeactivateGroup", (group_id,))
    db.commit()

    return jsonify({"message": "Mentorship program deactivated successfully"}), 200

# Delete mentorship program
# Arianna Kelsey
@app.delete("/api/mentorships/<int:group_id>")
@login_required
def delete_mentorship(group_id):
    if not is_group_owner(group_id, g.user_id):
        return jsonify({"error": "Only the creator can modify this mentorship program."}), 403

    cursor.callproc("DeleteGroup", (group_id,))
    db.commit()

    return jsonify({"message": "Mentorship program deleted successfully"}), 200

# Returns the requests for a mentor from a program
# Author: Arianna Kelsey
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
            CAST(gm.JoinedAt AS CHAR) AS joinedAt
        FROM GroupMember gm
        JOIN USERS u
            ON gm.UserID = u.USER_ID
        JOIN HGroup hg
            ON gm.GroupID = hg.GroupID
        WHERE hg.CreatedByUserID = %s
          AND gm.UserID != %s
        ORDER BY gm.GroupID ASC, gm.UserID ASC
    """, (g.user_id, g.user_id))

    requests_data = cursor.fetchall()
    return jsonify(requests_data), 200

# Create a mentor request
# Author: Arianna Kelsey
@app.post("/api/mentorship-requests")
@login_required
def create_mentor_request():
    data = request.get_json()

    groupID = data.get("groupID")
    roleType = data.get("roleType", "Member")
    membershipStatus = "Pending"

    if not groupID:
        return jsonify({"error": "Missing groupID for mentorship request."}), 400

    if is_group_owner(groupID, g.user_id):
        return jsonify({"error": "You cannot request your own mentorship program."}), 400

    try:
        parameters = (
            int(groupID),
            g.user_id,
            roleType,
            membershipStatus
        )

        cursor.callproc("AddGroupMember", parameters)
        db.commit()

    except mysql.connector.Error as err:
        if err.errno == 1062:
            return jsonify({"error": "You already requested this mentorship program."}), 400
        return jsonify({"error": str(err)}), 500

    return jsonify({"message": "Mentorship request submitted successfully"}), 201

# Update mentor requests
# Author: Arianna Kelsey
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

    if not is_group_owner(groupID, g.user_id):
        return jsonify({"error": "Only the program creator can accept requests."}), 403

    parameters = (
        int(groupID),
        int(userID),
        roleType,
        membershipStatus
    )

    cursor.callproc("UpdateGroupMemberStatus", parameters)
    db.commit()

    return jsonify({"message": "Mentorship request updated successfully"}), 200

# Remove a mentorship request
# Author: Arianna Kelsey
@app.delete("/api/mentorship-requests")
@login_required
def remove_mentor_request():
    data = request.get_json()

    groupID = data.get("groupID")
    userID = data.get("userID")

    if not groupID or not userID:
        return jsonify({"error": "Missing groupID or userID."}), 400

    if not is_group_owner(groupID, g.user_id):
        return jsonify({"error": "Only the program creator can remove requests."}), 403

    parameters = (
        int(groupID),
        int(userID)
    )

    cursor.callproc("RemoveGroupMember", parameters)
    db.commit()

    return jsonify({"message": "Mentorship request removed successfully"}), 200


# Get notifications for the logged-in user
@app.get("/api/notifications")
@login_required
def get_notifications():
    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        """
        SELECT
            n.NotificationID,
            n.RecipientUserID,
            n.TriggerUserID,
            n.Type,
            n.Message,
            n.IsRead,
            n.RelatedPostID,
            n.CreatedAt,
            u.USERNAME AS TriggerUsername
        FROM NOTIFICATION n
        JOIN USERS u
            ON n.TriggerUserID = u.USER_ID
        WHERE n.RecipientUserID = %s
        ORDER BY n.CreatedAt DESC
        """,
        (g.user_id,)
    )
    notifications = local_cursor.fetchall()
    local_cursor.close()

    return jsonify(notifications), 200


# Mark one notification as read
@app.post("/api/notifications/<int:notification_id>/read")
@login_required
def mark_notification_read(notification_id):
    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        """
        UPDATE NOTIFICATION
        SET IsRead = TRUE
        WHERE NotificationID = %s AND RecipientUserID = %s
        """,
        (notification_id, g.user_id)
    )
    db.commit()
    local_cursor.close()

    return jsonify({"message": "Notification marked as read"}), 200


# Mark all notifications as read
@app.post("/api/notifications/read-all")
@login_required
def mark_all_notifications_read():
    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        """
        UPDATE NOTIFICATION
        SET IsRead = TRUE
        WHERE RecipientUserID = %s
        """,
        (g.user_id,)
    )
    db.commit()
    local_cursor.close()

    return jsonify({"message": "All notifications marked as read"}), 200


@app.get("/api/health")
def health_check():
    return jsonify({"message": "Backend is running"}), 200


# Create a new group and make the creator the owner
# Author: Sophia Priola
@app.post("/api/groups")
@login_required
def create_group():
    data = request.get_json()
    group_name = data.get("groupName", "").strip()
    description = data.get("description", "").strip()
    study_category = data.get("studyCategory", "").strip()
    privacy_type = data.get("privacyType", "Public").strip()

    if not group_name or not description or not study_category:
        return jsonify({"error": "Please fill out all fields"}), 400

    if privacy_type not in ["Public", "Private"]:
        return jsonify({"error": "Privacy type must be Public or Private"}), 400

    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        INSERT INTO HGroup
        (CreatedByUserID, GroupName, StudyCategory, Description, PrivacyType)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (g.user_id, group_name, study_category, description, privacy_type)
    )

    group_id = local_cursor.lastrowid

    local_cursor.execute(
        """
        INSERT INTO GroupMember
        (GroupID, UserID, RoleType, MembershipStatus, JoinedAt)
        VALUES (%s, %s, 'Owner', 'Accepted', NOW())
        """,
        (group_id, g.user_id)
    )

    db.commit()
    local_cursor.close()

    return jsonify({"message": "Group created successfully", "groupId": group_id}), 201


# Get groups the current user is already in
# Author: Sophia Priola
@app.get("/api/groups/my")
@login_required
def get_my_groups_page():
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT
            hg.GroupID,
            hg.GroupName,
            hg.StudyCategory,
            hg.Description,
            hg.PrivacyType,
            gm.RoleType,
            gm.MembershipStatus
        FROM GroupMember gm
        JOIN HGroup hg
            ON gm.GroupID = hg.GroupID
        WHERE gm.UserID = %s
          AND gm.MembershipStatus = 'Accepted'
          AND hg.IsActive = TRUE
        ORDER BY hg.GroupName ASC
        """,
        (g.user_id,)
    )

    groups = local_cursor.fetchall()
    local_cursor.close()

    return jsonify(groups), 200


# Search existing groups by title or category
# Author: Sophia Priola
@app.get("/api/groups/search")
@login_required
def search_groups():
    query = request.args.get("q", "").strip()

    if not query:
        return jsonify([]), 200

    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT
            hg.GroupID,
            hg.GroupName,
            hg.StudyCategory,
            hg.Description,
            hg.PrivacyType,
            gm.MembershipStatus AS CurrentUserStatus
        FROM HGroup hg
        LEFT JOIN GroupMember gm
            ON hg.GroupID = gm.GroupID
           AND gm.UserID = %s
        WHERE hg.IsActive = TRUE
          AND (
            hg.GroupName LIKE %s
            OR hg.StudyCategory LIKE %s
          )
        ORDER BY hg.GroupName ASC
        """,
        (g.user_id, f"%{query}%", f"%{query}%")
    )

    groups = local_cursor.fetchall()
    local_cursor.close()

    return jsonify(groups), 200


# Join a public group or request to join a private group
# Author: Sophia Priola
@app.post("/api/groups/<int:group_id>/join")
@login_required
def join_group(group_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT GroupID, GroupName, PrivacyType, CreatedByUserID
        FROM HGroup
        WHERE GroupID = %s AND IsActive = TRUE
        """,
        (group_id,)
    )
    group = local_cursor.fetchone()

    if not group:
        local_cursor.close()
        return jsonify({"error": "Group not found"}), 404

    local_cursor.execute(
        """
        SELECT MembershipStatus
        FROM GroupMember
        WHERE GroupID = %s AND UserID = %s
        """,
        (group_id, g.user_id)
    )
    existing = local_cursor.fetchone()

    if existing:
        status = existing["MembershipStatus"]
        local_cursor.close()

        if status == "Accepted":
            return jsonify({"message": "Already a member of this group"}), 200

        if status == "Pending":
            return jsonify({"message": "Join request already pending"}), 200

        return jsonify({"message": f"Current membership status: {status}"}), 200

    if group["PrivacyType"] == "Public":
        local_cursor.execute(
            """
            INSERT INTO GroupMember
            (GroupID, UserID, RoleType, MembershipStatus, JoinedAt)
            VALUES (%s, %s, 'Member', 'Accepted', NOW())
            """,
            (group_id, g.user_id)
        )

        db.commit()
        local_cursor.close()

        return jsonify({"message": "Joined group successfully"}), 201

    local_cursor.execute(
        """
        INSERT INTO GroupMember
        (GroupID, UserID, RoleType, MembershipStatus)
        VALUES (%s, %s, 'Member', 'Pending')
        """,
        (group_id, g.user_id)
    )

    db.commit()
    local_cursor.close()

    create_notification(
        recipient_user_id=group["CreatedByUserID"],
        trigger_user_id=g.user_id,
        notification_type="group_request",
        message=f'Someone requested to join {group["GroupName"]}',
        related_post_id=None
    )

    return jsonify({"message": "Join request sent"}), 201


# Get pending requests for a group
# Author: Sophia Priola
@app.get("/api/groups/<int:group_id>/requests")
@login_required
def get_group_requests(group_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT 1
        FROM GroupMember
        WHERE GroupID = %s
          AND UserID = %s
          AND RoleType = 'Owner'
          AND MembershipStatus = 'Accepted'
        """,
        (group_id, g.user_id)
    )
    owner = local_cursor.fetchone()

    if not owner:
        local_cursor.close()
        return jsonify({"error": "Only the group owner can view requests"}), 403

    local_cursor.execute(
        """
        SELECT
            gm.UserID,
            u.USERNAME,
            u.NAME,
            gm.CreatedAt
        FROM GroupMember gm
        JOIN USERS u
            ON gm.UserID = u.USER_ID
        WHERE gm.GroupID = %s
          AND gm.MembershipStatus = 'Pending'
        ORDER BY gm.CreatedAt ASC
        """,
        (group_id,)
    )

    requests = local_cursor.fetchall()
    local_cursor.close()

    return jsonify(requests), 200


# Approve a pending request
# Author: Sophia Priola
@app.post("/api/groups/<int:group_id>/requests/<int:user_id>/approve")
@login_required
def approve_group_request(group_id, user_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT 1
        FROM GroupMember
        WHERE GroupID = %s
          AND UserID = %s
          AND RoleType = 'Owner'
          AND MembershipStatus = 'Accepted'
        """,
        (group_id, g.user_id)
    )
    owner = local_cursor.fetchone()

    if not owner:
        local_cursor.close()
        return jsonify({"error": "Only the group owner can approve requests"}), 403

    local_cursor.execute(
        """
        UPDATE GroupMember
        SET MembershipStatus = 'Accepted',
            JoinedAt = NOW()
        WHERE GroupID = %s
          AND UserID = %s
          AND MembershipStatus = 'Pending'
        """,
        (group_id, user_id)
    )

    if local_cursor.rowcount == 0:
        local_cursor.close()
        return jsonify({"error": "Pending request not found"}), 404

    db.commit()
    local_cursor.close()

    create_notification(
        recipient_user_id=user_id,
        trigger_user_id=g.user_id,
        notification_type="group_approved",
        message="Your group request was approved",
        related_post_id=None
    )

    return jsonify({"message": "Request approved"}), 200


# Decline a pending request
# Author: Sophia Priola
@app.post("/api/groups/<int:group_id>/requests/<int:user_id>/decline")
@login_required
def decline_group_request(group_id, user_id):
    local_cursor = db.cursor(dictionary=True)

    local_cursor.execute(
        """
        SELECT 1
        FROM GroupMember
        WHERE GroupID = %s
          AND UserID = %s
          AND RoleType = 'Owner'
          AND MembershipStatus = 'Accepted'
        """,
        (group_id, g.user_id)
    )
    owner = local_cursor.fetchone()

    if not owner:
        local_cursor.close()
        return jsonify({"error": "Only the group owner can decline requests"}), 403

    local_cursor.execute(
        """
        UPDATE GroupMember
        SET MembershipStatus = 'Declined'
        WHERE GroupID = %s
          AND UserID = %s
          AND MembershipStatus = 'Pending'
        """,
        (group_id, user_id)
    )

    if local_cursor.rowcount == 0:
        local_cursor.close()
        return jsonify({"error": "Pending request not found"}), 404

    db.commit()
    local_cursor.close()

    create_notification(
        recipient_user_id=user_id,
        trigger_user_id=g.user_id,
        notification_type="group_declined",
        message="Your group request was declined",
        related_post_id=None
    )

    return jsonify({"message": "Request declined"}), 200

# Creates a notification for a user when another user interacts with their content
# Author: Sophia Priola
def create_notification(recipient_user_id, trigger_user_id, notification_type, message, related_post_id=None):
    if recipient_user_id == trigger_user_id:
        return

    local_cursor = db.cursor(dictionary=True)
    local_cursor.execute(
        """
        INSERT INTO NOTIFICATION
        (RecipientUserID, TriggerUserID, Type, Message, RelatedPostID)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (recipient_user_id, trigger_user_id, notification_type, message, related_post_id)
    )
    db.commit()
    local_cursor.close()


if __name__ == "__main__":
    socketio.run(
        app,
        host="localhost",
        port=5000,
        debug=True
    )
