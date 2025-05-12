# Real-Time Chat Application

A simple, real-time chat application that allows users to create or join temporary rooms for messaging. The rooms expire after all users exit.

## Features

- Create new chat rooms with randomly generated IDs
- Join existing rooms using room ID
- Real-time messaging with WebSockets
- Room-based messaging (messages only go to users in the same room)
- Temporary rooms that expire after all users leave
- User join/leave notifications
- Different styling for sent vs received messages
- Connection status indicators

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS v4
- **Backend**: Node.js, TypeScript, WebSockets (ws)

## Project Structure

```
real-time-chat/
├── real-time-chat-fe/     # Frontend React application
├── real-time-chat-be/     # Backend WebSocket server
├── package.json           # Root package.json for running both services
└── README.md              # This file
```

## Installation

1. Clone the repository
2. Install dependencies for all packages:

```bash
npm run install:all
```

## Running the Application

To run both the frontend and backend simultaneously:

```bash
npm start
```

Or run them separately:

```bash
# Frontend only
npm run start:fe

# Backend only
npm run start:be
```

The frontend will be available at http://localhost:5173 (or another port if 5173 is in use).

## How to Use

1. Open the application in your browser
2. Create a new room by clicking "Create New Room" or join an existing room by entering the room ID
3. Start chatting!
4. When you're done, click "Exit" to leave the room

## Development

- The frontend is built with React, TypeScript, and Tailwind CSS v4
- The backend uses a simple WebSocket server with room-based messaging
- Messages are sent to all users in the same room

## Deployment

The application can be deployed as two separate services:

1. The frontend can be deployed to any static hosting service (Vercel, Netlify, etc.)
2. The backend should be deployed to a service that supports WebSockets (Heroku, Digital Ocean, etc.)

Make sure to update the WebSocket URL in the frontend to point to your deployed backend. 