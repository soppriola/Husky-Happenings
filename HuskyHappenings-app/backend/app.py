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



if __name__ == "__main__":
    app.run(
        host='localhost',
        port=5000,
        ssl_context=(os.getenv('FRONTEND_CERT_PATH'), os.getenv('FRONTEND_KEY_PATH')),
        debug=True
    )