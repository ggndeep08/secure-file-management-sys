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
