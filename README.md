# Resort Management System - Developer Guide

This repository contains a full-stack resort management application built with a React (Vite) frontend and a Django backend. The application features real-time updates using WebSockets, JWT authentication, and a responsive dashboard UI for managing hotel rooms and bookings.

## Architecture Overview

The project is structured into two main directories:
- `/frontend`: A React Single Page Application (SPA) built with Vite, Tailwind CSS, and React Query.
- `/backend`: A Django application using Django REST Framework (DRF) for APIs and Django Channels for WebSocket support.

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **PostgreSQL**

### Backend Setup
1. Navigate to the `backend/` directory.
2. Ensure you have a virtual environment set up: `python -m venv venv` and activate it.
3. Install dependencies: `pip install -r requirements.txt` (Note: ensure your required packages are installed).
4. Configure your `.env` file in the `backend/` folder to match your local PostgreSQL database credentials.
5. Apply database migrations: `python manage.py migrate`
6. Run the server: `python manage.py runserver` (Make sure Redis or InMemory channel layer is configured for WebSockets).

### Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

---

## Folder Structure & File Explanations

### `/frontend` (React + Vite)
- `index.html`: The HTML entry point for the React application.
- `package.json` / `package-lock.json`: NPM dependencies and scripts for the frontend.
- `vite.config.js`: Configuration for the Vite build tool.
- `eslint.config.js`: Configuration for ESLint to maintain code quality.
- `postcss.config.js`: Configuration for PostCSS, primarily used by Tailwind CSS.

#### `/frontend/src`
- `main.jsx`: Bootstraps the React application, sets up providers (`QueryClientProvider`, `HashRouter`), and mounts it to the DOM.
- `App.jsx`: Main routing file. Handles protected routes and the authentication gate.
- `Login.jsx`: The login screen UI.
- `RoomGrid.jsx`: The primary dashboard UI for managing rooms. Features a calendar, real-time WebSocket listener, and dynamic search/filter logic.
- `BookingModal.jsx`: Modal UI for booking a room.
- `ActionModal.jsx`: Modal UI for changing room status, clearing a room, or extending checkout.
- `SettingsModal.jsx`: Modal UI for auto-generating rooms.

#### `/frontend/src/api`
- `axiosConfig.js`: Configures the Axios HTTP client. Includes request interceptors to attach JWT tokens and response interceptors to handle automatic token refresh on expiry.
- `roomService.js`: Contains API wrapper functions for interacting with the backend room and booking endpoints.

#### `/frontend/src/context`
- `AuthContext.jsx`: Provides React Context for authentication state, including login, logout, and decoding JWTs from local storage.

#### `/frontend/src/assets`
- `index.css`: Global base styles and Tailwind CSS imports.
- `RoomGrid.css`: Custom styling for the React Calendar component.
- `App.css`: Standard template CSS.

#### `/frontend/public`
- Contains static assets like `favicon.svg` and `icons.svg`.

---

### `/backend` (Django)
- `manage.py`: Django's command-line utility for administrative tasks.
- `.env`: Environment variables configuration file (contains database credentials, secret keys, etc.). Do not commit sensitive data.

#### `/backend/config` (Project Configuration)
- `settings.py`: Main Django configuration, including installed apps, middleware, database connection, JWT settings, CORS, and ASGI/Channels configuration.
- `urls.py`: Top-level URL routing, directing `/api/` traffic to the `core` app.
- `asgi.py`: Entry point for ASGI-compatible web servers, handling WebSocket routing and HTTP traffic.
- `wsgi.py`: Entry point for WSGI-compatible web servers.

#### `/backend/core` (Main Application)
- `models.py`: Defines the database schema, including custom `User`, `Room`, `Guest`, `Booking`, `RoomClass`, and lookup tables (e.g., `Floor`, `BedType`, `RoomStatus`).
- `views.py`: Contains the REST API business logic for:
  - Fetching rooms with computed statuses based on dates
  - Booking rooms (using atomic transactions)
  - Updating room statuses
  - Broadcasting WebSocket events using `django-channels`
- `urls.py`: URL routing for the `core` app, including JWT authentication endpoints and room management API endpoints.
- `consumers.py`: Handles WebSocket connections (`RoomUpdateConsumer`), allowing the server to push real-time updates to connected clients in the `hotel_staff` group.
- `routing.py`: Defines WebSocket URL routing specifically for the `core` app (`ws/rooms/`).
- `serializers.py`: Defines how Django models are converted to JSON, mapping backend `snake_case` properties to frontend `camelCase`.
- `admin.py`: Configuration for the Django admin interface, including inline forms for complex models.
- `apps.py`: App configuration for the `core` module.
- `migrations/`: Contains database migration files that keep the PostgreSQL database schema in sync with `models.py`.
