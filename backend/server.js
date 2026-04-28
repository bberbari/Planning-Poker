const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

function parseAllowedOrigins() {
  const raw = process.env.FRONTEND_URL || 'http://localhost:3000';
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins();

function allowCorsOrigin(origin, callback) {
  // Allow all origins (wildcard)
  return callback(null, true);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowCorsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Backend server port - explicitly set to 3001
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: allowCorsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.path}`);
  next();
});

// Initialize game manager
const gameManager = new GameManager();

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/create-session', (req, res) => {
  const sessionId = gameManager.createSession();
  res.json({ sessionId, url: `/game/${sessionId}` });
});

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = gameManager.getSession(sessionId);
  if (session) {
    res.json({ exists: true });
  } else {
    res.status(404).json({ exists: false });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('========================================');
  console.log('User connected:', socket.id);
  console.log('Socket transport:', socket.conn.transport.name);
  console.log('Remote address:', socket.handshake.address);
  console.log('Headers:', socket.handshake.headers);
  console.log('========================================');
  
  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('join-session', (data) => {
    console.log('[Backend] ========================================');
    console.log('[Backend] join-session received - raw data:', JSON.stringify(data));
    console.log('[Backend] ========================================');
    
    // Handle both old format (with emoji) and new format (with isAdmin)
    const { sessionId, name, emoji, isAdmin: requestedAdmin } = data || {};
    
    console.log('[Backend] Parsed fields:', { 
      sessionId: sessionId || 'MISSING', 
      name: name || 'MISSING', 
      emoji: emoji || 'not provided',
      requestedAdmin,
      sessionIdType: typeof sessionId,
      nameType: typeof name,
      socketId: socket.id 
    });
    
    // Validate required fields
    if (!sessionId) {
      console.error('[Backend] join-session: Missing sessionId', { data });
      socket.emit('error', { message: 'Missing required field: sessionId' });
      return;
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.error('[Backend] join-session: Missing or invalid name', { 
        name: name || 'MISSING',
        nameType: typeof name,
        data 
      });
      socket.emit('error', { message: 'Missing required field: name' });
      return;
    }
    
    const trimmedName = name.trim();

    let session = gameManager.getSession(sessionId);
    if (!session) {
      // Create session if it doesn't exist (first user creates it)
      console.log('[Backend] Session not found, creating new session', { sessionId });
      const createdId = gameManager.createSession(sessionId);
      session = gameManager.getSession(createdId);
      if (!session) {
        console.error('[Backend] Failed to create session', { sessionId, createdId });
        socket.emit('error', { message: 'Failed to create session' });
        return;
      }
      console.log('[Backend] Session created successfully', { sessionId: createdId });
    }

    // Check if user already exists in session
    const existingUser = Array.from(session.users.values()).find(
      u => u.name === trimmedName
    );

    if (existingUser) {
      console.log('[Backend] User already exists', { name: trimmedName, existingUserId: existingUser.id });
      socket.emit('error', { message: `A user with the name "${trimmedName}" is already in this session. Please choose a different name.` });
      return;
    }

    // Determine if user is admin (first user, explicit flag, or if no admin exists)
    const hasAdmin = Array.from(session.users.values()).some(u => u.isAdmin);
    const isAdmin = requestedAdmin === true || (!hasAdmin && session.users.size === 0);
    console.log('[Backend] Adding user to session', { name: trimmedName, isAdmin, requestedAdmin, hasAdmin, currentUsersCount: session.users.size });

    const user = gameManager.addUserToSession(sessionId, socket.id, {
      name: trimmedName,
      isAdmin
    });

    if (!user) {
      console.error('[Backend] Failed to add user to session');
      socket.emit('error', { message: 'Failed to add user to session' });
      return;
    }

    console.log('[Backend] User added successfully', { userId: user.id, userName: user.name });
    socket.join(sessionId);
    socket.sessionId = sessionId;
    socket.userId = user.id;

    // Send current game state to the new user
    const gameState = gameManager.getGameState(sessionId);
    console.log('[Backend] Sending game-state to new user', { 
      socketId: socket.id, 
      userId: user.id, 
      usersCount: gameState.users.length,
      gameStateSessionId: gameState.sessionId
    });
    console.log('[Backend] Game state users:', gameState.users.map(u => ({ id: u.id, name: u.name })));
    
    socket.emit('game-state', gameState);
    console.log('[Backend] game-state event emitted to socket', socket.id);

    // Notify all users in session
    console.log('[Backend] Broadcasting user-joined to session', { sessionId, userId: user.id });
    io.to(sessionId).emit('user-joined', {
      user: {
        id: user.id,
        name: user.name,
        emoji: user.emoji,
        isAdmin: user.isAdmin
      }
    });

    // Broadcast updated game state to all users
    const updatedGameState = gameManager.getGameState(sessionId);
    console.log('[Backend] Broadcasting updated game-state to session', { sessionId, usersCount: updatedGameState.users.length });
    io.to(sessionId).emit('game-state', updatedGameState);
  });

  socket.on('select-card', (data) => {
    const { cardValue } = data;
    const { sessionId, userId } = socket;

    if (!sessionId || !userId) {
      socket.emit('error', { message: 'Not in a session' });
      return;
    }

    const session = gameManager.getSession(sessionId);
    if (!session || !session.currentTask) {
      socket.emit('error', { message: 'No active task' });
      return;
    }

    gameManager.vote(sessionId, userId, cardValue);

    const user = session.users.get(userId);
    
    // Notify admin that a vote was received
    const admin = Array.from(session.users.values()).find(u => u.isAdmin);
    if (admin) {
      io.to(admin.id).emit('vote-received', {
        userId,
        userName: user.name,
        userEmoji: user.emoji,
        cardValue
      });
    }

    // Update game state for all users
    io.to(sessionId).emit('game-state', gameManager.getGameState(sessionId));
  });

  socket.on('create-task', (data) => {
    const { description } = data;
    const { sessionId, userId } = socket;

    if (!sessionId || !userId) {
      socket.emit('error', { message: 'Not in a session' });
      return;
    }

    const session = gameManager.getSession(sessionId);
    const user = session?.users.get(userId);

    if (!user || !user.isAdmin) {
      socket.emit('error', { message: 'Only admin can create tasks' });
      return;
    }

    if (!description || description.trim() === '') {
      socket.emit('error', { message: 'Task description is required' });
      return;
    }

    const createdTask = gameManager.createTask(sessionId, description);
    
    // Emit task-created event (only if it became the current task, otherwise it's queued)
    if (session.currentTask && session.currentTask.id === createdTask.id) {
      io.to(sessionId).emit('task-created', {
        task: session.currentTask
      });
    }
    
    io.to(sessionId).emit('game-state', gameManager.getGameState(sessionId));
  });

  socket.on('reveal-cards', () => {
    const { sessionId, userId } = socket;

    if (!sessionId || !userId) {
      socket.emit('error', { message: 'Not in a session' });
      return;
    }

    const session = gameManager.getSession(sessionId);
    const user = session?.users.get(userId);

    if (!user || !user.isAdmin) {
      socket.emit('error', { message: 'Only admin can reveal cards' });
      return;
    }

    gameManager.revealCards(sessionId);
    io.to(sessionId).emit('cards-revealed', {
      task: session.currentTask
    });
    io.to(sessionId).emit('game-state', gameManager.getGameState(sessionId));
  });

  socket.on('reset-voting', () => {
    const { sessionId, userId } = socket;

    if (!sessionId || !userId) {
      socket.emit('error', { message: 'Not in a session' });
      return;
    }

    const session = gameManager.getSession(sessionId);
    const user = session?.users.get(userId);

    if (!user || !user.isAdmin) {
      socket.emit('error', { message: 'Only admin can reset voting' });
      return;
    }

    gameManager.resetVoting(sessionId);
    io.to(sessionId).emit('game-state', gameManager.getGameState(sessionId));
  });

  socket.on('disconnect', () => {
    const { sessionId, userId } = socket;

    if (sessionId) {
      let targetUserId = userId;
      
      // If userId not set, try to find by socketId
      if (!targetUserId) {
        const found = gameManager.findUserBySocketId(sessionId, socket.id);
        if (found) {
          targetUserId = found.userId;
        }
      }

      if (targetUserId) {
        const session = gameManager.getSession(sessionId);
        if (session) {
          const user = session.users.get(targetUserId);
          if (user) {
            gameManager.removeUserFromSession(sessionId, targetUserId);
            
            // Notify all users in session
            io.to(sessionId).emit('user-left', {
              userId: targetUserId,
              userName: user.name,
              userEmoji: user.emoji
            });

            // If session is empty, clean it up
            if (session.users.size === 0) {
              gameManager.deleteSession(sessionId);
            } else {
              // Broadcast updated game state
              io.to(sessionId).emit('game-state', gameManager.getGameState(sessionId));
            }
          }
        }
      }
    }

    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Backend API: http://localhost:${PORT}`);
  console.log(`Socket.io: ws://localhost:${PORT}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`========================================`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
  } else {
    console.error('Server error:', error);
  }
});
