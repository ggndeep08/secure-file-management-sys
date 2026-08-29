# 🔐 Secure File Management System

A web-based **Secure File Management System** designed to provide users with a simple and controlled way to manage, store, and share files.

The application implements user authentication, failed-login protection, file ownership, file sharing, and activity logging through a **Node.js + Express** backend and a web-based frontend.

## ✨ Features

- 🔑 User Signup & Login
- 🛡️ Password-based authentication
- 🚫 Account lockout after 3 failed login attempts
- ⏱️ Temporary 1-minute account blocking
- 📁 File upload and management
- 👤 File ownership tracking
- 🤝 Secure file sharing between registered users
- 🗑️ File deletion
- 📋 Activity and security event logging
- 👨‍💼 Admin log access
- 🌐 REST API-based backend

## 🛠️ Technologies Used

- **Node.js**
- **Express.js**
- **JavaScript**
- **HTML / CSS**
- **JSON**
- **CORS**
- **Body Parser**

## 🏗️ Project Architecture

The project follows a simple client-server architecture:

```text
                ┌─────────────────────┐
                │      Frontend       │
                │   HTML / CSS / JS   │
                └──────────┬──────────┘
                           │
                           │ REST API
                           ▼
                ┌─────────────────────┐
                │    Node.js Server   │
                │      Express.js     │
                └──────────┬──────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ Users   │   │  Files  │   │  Logs   │
        │  JSON   │   │  JSON   │   │  JSON   │
        └─────────┘   └─────────┘   └─────────┘
````

## 📁 Project Structure

```text
Secure-File-Management/
│
├── Front_End/
│   └── ...                  # Frontend application
│
├── server.js                # Express backend server
├── package.json              # Project dependencies and scripts
├── package-lock.json         # Dependency lock file
├── .gitignore                # Git ignored files
│
├── users.json                # User information
├── files.json                # Stored file information
└── logs.json                 # Security and activity logs
```

> `users.json`, `files.json`, and `logs.json` are created/used by the backend as lightweight JSON-based storage.

## 🔐 Security Features

### Failed Login Protection

The system tracks unsuccessful login attempts.

After **3 consecutive failed attempts**, the account is temporarily blocked for **1 minute**.

```text
Login Attempt
     │
     ▼
Password Correct?
   /       \
 Yes        No
 │          │
 ▼          ▼
Login    Increase
Success   Attempts
             │
             ▼
       Attempts >= 3?
          /     \
        No       Yes
        │         │
        ▼         ▼
    Continue    Block
                1 min
```

### File Ownership

Every uploaded file is associated with its owner.

Users can access files when they are:

* The owner of the file
* Included in the file's `sharedWith` list

### File Sharing

A file owner can share a file with another registered user.

The backend verifies:

1. The target user exists.
2. The file exists.
3. The requesting user is the file owner.

Only then is the target user added to the file's sharing list.

### Activity Logging

Important events are recorded with:

* Timestamp
* Action
* Username
* Additional details

Examples include:

```text
SIGNUP_SUCCESS
SIGNUP_FAILED
LOGIN_SUCCESS
LOGIN_FAILED
LOGIN_BLOCKED
FILE_UPLOAD
FILE_DELETE
FILE_SHARE
```

This provides a basic **audit trail** for user and file activity.

## 🌐 API Endpoints

### Authentication

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| POST   | `/api/signup` | Create a new user   |
| POST   | `/api/login`  | Authenticate a user |

### File Management

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/api/files/:username` | Get files accessible to a user |
| POST   | `/api/files`           | Upload/store a file            |
| DELETE | `/api/files/:id`       | Delete a file                  |
| POST   | `/api/files/share`     | Share a file with another user |

### Logs

| Method | Endpoint    | Description                     |
| ------ | ----------- | ------------------------------- |
| GET    | `/api/logs` | Retrieve activity/security logs |

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** installed.

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd Secure-File-Management
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node server.js
```

The backend will start at:

```text
http://localhost:3000
```

### 4. Open the Frontend

Open the frontend application from the `Front_End` directory according to its setup.

## 🔄 Application Workflow

```text
User
 │
 ▼
Signup / Login
 │
 ▼
Authentication
 │
 ├── Invalid Login ──► Failed Attempt Recorded
 │                         │
 │                         ▼
 │                    3 Attempts?
 │                         │
 │                    Temporary Lock
 │
 └── Successful Login
             │
             ▼
        File Dashboard
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
    Upload  Share  Delete
       │     │     │
       └─────┼─────┘
             ▼
        Activity Log
```

## 📌 Project Objective

The main objective of this project is to demonstrate how a web-based file management system can incorporate basic security mechanisms such as:

* User authentication
* Brute-force login protection
* Access control
* File ownership
* Controlled file sharing
* Security event logging

The project also demonstrates the implementation of a RESTful backend using **Node.js and Express.js**.

## 🔮 Future Scope

The current system can be extended with stronger security and production-ready features such as:

* 🔒 Password hashing using bcrypt or Argon2
* 🎫 JWT/session-based authentication
* 🔐 Encryption of stored files
* 🔑 Role-based access control
* 📧 Email-based password recovery
* 🛡️ Rate limiting
* 🔍 Malware/file-type scanning
* ☁️ Cloud storage integration
* 📊 Advanced security monitoring dashboard
* 🗃️ Migration from JSON storage to PostgreSQL/MySQL/MongoDB
* 🔏 HTTPS and secure API communication

## ⚠️ Security Note

This project is primarily an **academic/demo implementation**.

The current backend accepts a `passwordHash` value from the client and stores it directly in JSON storage. For a production system, passwords should be securely hashed on the **server side** using a modern password-hashing algorithm such as **Argon2 or bcrypt**.

Similarly, production file storage should use proper access controls and encryption rather than relying solely on frontend checks.

## 📄 License

This project is available for educational and learning purposes.

## 👨‍💻 Author

**Gagandeep Singh**

B.Tech CSE — AI & Machine Learning

---

⭐ If you found this project useful, consider giving the repository a star!

```
storage" that the code doesn't support.
```
