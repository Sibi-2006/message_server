const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { initSocket } = require('./sockets/socketHandler');

// Initialize database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

app.set('io', io);
initSocket(io);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Real-Time Messaging Platform API is running',
    timestamp: new Date(),
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for messaging & notifications`);
  console.log(`===============================================`);
});
