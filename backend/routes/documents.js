import express from 'express';
import Document from '../models/Document.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title } = req.body;
    const document = new Document({ title, owner: req.user.userId });
    await document.save();
    res.status(201).json(document);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create document', error: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const documents = await Document.find({ $or: [{ owner: req.user.userId }, { collaborators: req.user.userId }] });
    res.json(documents);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch documents', error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (document.owner.toString() !== req.user.userId && !document.collaborators.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(document);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch document', error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, collaborators } = req.body;
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    if (document.owner.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    document.title = title || document.title;
    document.content = content || document.content;
    document.collaborators = collaborators || document.collaborators;
    document.version += 1;
    document.updatedAt = Date.now();
    await document.save();
    res.json(document);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update document', error: error.message });
  }
});

export default router;


