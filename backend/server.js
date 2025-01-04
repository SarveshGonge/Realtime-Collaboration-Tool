import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createAdapter } from '@socket.io/mongo-adapter';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  const collection = db.collection('socket.io-adapter-events');
  await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });

  io.adapter(createAdapter(collection));

  console.log('Socket.IO MongoDB adapter initialized');
});

// Routes
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`User joined document: ${documentId}`);
  });

  socket.on('edit-document', (data) => {
    socket.to(data.documentId).emit('document-changes', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
