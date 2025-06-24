
# JeffFromIT Backend Server

This is the backend API server for JeffFromIT that uses SQLite as a local database file.

## Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm run dev  # Development with auto-reload
# or
npm start    # Production
```

The server will run on http://localhost:3001 and create a `database.sqlite` file in the server directory.

## Default Users

- Admin: username `admin`, password `123`
- User: username `user`, password `user`

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login with username/password

### Users
- GET `/api/users` - Get all users
- POST `/api/users` - Create new user
- PUT `/api/users/:id` - Update user
- DELETE `/api/users/:id` - Delete user

### Chat Sessions
- GET `/api/chat-sessions/:userId` - Get user's chat sessions
- POST `/api/chat-sessions` - Create new chat session
- PUT `/api/chat-sessions/:id` - Update chat session

### Messages
- GET `/api/messages/:sessionId` - Get messages for session
- POST `/api/messages` - Create new message

### AI Chat
- POST `/api/chat` - Send message to AI (mock endpoint)
