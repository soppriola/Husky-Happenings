# Husky Happenings

Husky Happenings is a student-focused web application designed to help users connect with campus events, groups, posts, messages, and notifications. The application includes a React frontend, a Flask backend, and a MySQL database.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Backend Installation](#backend-installation)
- [Frontend Installation](#frontend-installation)
- [Running the Application](#running-the-application)
- [Database Scripts](#database-scripts)
- [Common Commands](#common-commands)
- [Notes](#notes)
- [Author](#author)

---

## Project Overview

Husky Happenings is a full-stack campus social platform. The purpose of the application is to give students a centralized place to interact with posts, join groups, communicate with other users, and receive notifications.

The application is divided into three main sections:

1. **Frontend**
   - Built with React and Vite.
   - Handles the user interface and page navigation.

2. **Backend**
   - Built with Python and Flask.
   - Handles API routes, user sessions, authentication, database queries, notifications, messages, posts, and groups.

3. **Database**
   - Built with MySQL.
   - Stores user accounts, posts, groups, comments, likes, messages, jobs, events, and notifications.

---

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- CSS
- Fetch API

### Backend

- Python
- Flask
- Flask-CORS
- Flask-SocketIO
- MySQL Connector
- python-dotenv

### Database

- MySQL
- SQL scripts for database creation, table creation, and database deletion

---

## Features

Husky Happenings includes the following features:

- User registration
- User login
- User logout
- Session-based authentication
- Profile viewing
- Profile editing
- News feed
- Post creation
- Like feature
- Comment feature
- Group viewing
- Group joining
- Group creation
- Messaging between users
- Notifications
- Real-time updates using WebSockets
- MySQL database storage
- Event Creation
- Event Viewing
- RSVP for Events
- Job Creation
- Job Application
- Viewing Jobs

---

## Project Structure

The project is organized into frontend, backend, and database files.

```text
Husky-Happenings/
│
├── HuskyHappenings-app/
│   │
│   ├── backend/
│   │   ├── app.py
│   │   ├── CREATE_DATABASE.sql
│   │   ├── ALL_TABLE.sql
│   │   ├── DELETE_DATABASE.sql
│   │   └── requirements.txt
│   │
│   └── frontend/
│       ├── public/
│       ├── src/
│       ├── package.json
│       ├── vite.config.js
│       └── index.html
│
└── README.md
```

---

## Database Setup

Before running the application, the MySQL database must be created and initialized.

### 1. Open MySQL

Open a terminal and log into MySQL:

```bash
mysql -u root -p
```

Enter your MySQL password when prompted.

---

### 2. Navigate to the Backend Folder

In a separate terminal, navigate to the backend folder where the SQL scripts are located:

```bash
cd HuskyHappenings-app/backend
```

---

### 3. Create the Database

Inside MySQL, run:

```sql
SOURCE CREATE_DATABASE.sql;
```

This script creates the database for Husky Happenings.

---

### 4. Create All Tables

After the database has been created, run:

```sql
SOURCE ALL_TABLE.sql;
```

This script creates all of the tables required for the application.

---

### 5. Delete the Database

To delete the database completely, run:

```sql
SOURCE DELETE_DATABASE.sql;
```

Only use this script if you want to remove the database and all of its data.

---

## Backend Installation

The backend is built with Python and Flask.

### 1. Navigate to the Backend Folder

```bash
cd HuskyHappenings-app/backend
```

---

### 2. Create a Virtual Environment

```bash
python3 -m venv venv
```

---

### 3. Activate the Virtual Environment

#### macOS/Linux

```bash
source venv/bin/activate
```

#### Windows

```bash
venv\Scripts\activate
```

---

### 4. Install Required Packages

If the project includes a `requirements.txt` file, run:

```bash
pip install -r requirements.txt
```

If there is no `requirements.txt` file, install the required packages manually:

```bash
pip install flask flask-cors flask-socketio mysql-connector-python python-dotenv
```

---

### 5. Check Database Connection Settings

Open `app.py` and make sure the MySQL connection information matches your local MySQL setup.

Example:

```python
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="your_password",
    database="husky_happenings"
)
```

Make sure the database name matches the name created in `CREATE_DATABASE.sql`.

---

## Frontend Installation

The frontend is built with React and Vite.

### 1. Navigate to the Frontend Folder

```bash
cd HuskyHappenings-app/frontend
```

---

### 2. Install Node Dependencies

```bash
npm install
```

This installs all frontend dependencies listed in `package.json`.

---

## Running the Application

The backend and frontend must be running at the same time in two separate terminal windows.

---

### 1. Start the Backend

Open a terminal and navigate to the backend folder:

```bash
cd HuskyHappenings-app/backend
```

Activate the virtual environment:

```bash
source venv/bin/activate
```

Then run:

```bash
python app.py
```

The backend should start on:

```text
http://localhost:5000
```

---

### 2. Start the Frontend

Open a second terminal and navigate to the frontend folder:

```bash
cd HuskyHappenings-app/frontend
```

Run:

```bash
npm run dev
```

The frontend should start on:

```text
http://localhost:5173
```

Open the frontend URL in a browser to use the application.

---

## Database Scripts

This project includes three SQL scripts for managing the database.

---

### `CREATE_DATABASE.sql`

This script creates the main database for the Husky Happenings application.

Use this script first when setting up the project.

```sql
SOURCE CREATE_DATABASE.sql;
```

---

### `ALL_TABLE.sql`

This script creates all required database tables.

Run this script after creating the database.

```sql
SOURCE ALL_TABLE.sql;
```

---

### `DELETE_DATABASE.sql`

This script deletes the Husky Happenings database.

Use this script only if you want to completely remove the database and its data.

```sql
SOURCE DELETE_DATABASE.sql;
```

---

## Common Commands

### Start Backend

```bash
cd HuskyHappenings-app/backend
source venv/bin/activate
python app.py
```

### Start Frontend

```bash
cd HuskyHappenings-app/frontend
npm run dev
```

### Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### Install Frontend Dependencies

```bash
npm install
```

### Open MySQL

```bash
mysql -u root -p
```

---

## Notes

- The backend and frontend must both be running for the application to work.
- The database must be created before using the app.
- The SQL scripts should be run in this order:
  1. `CREATE_DATABASE.sql`
  2. `ALL_TABLE.sql`
- `DELETE_DATABASE.sql` should only be used when you want to remove the database.
- If you change database table structures, rerun the table script or manually update the database.

---

## Authors

**Arianna Kelsey, Ashley Pike, and Sophia Priola**

Computer Science Student  
University of Southern Maine

---
