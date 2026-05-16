import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbRun, dbGet, dbAll } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

// Middleware to protect routes
export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Generate UUID for IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// ================= AUTH ROUTES =================

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    await dbRun('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [userId, name, email, hashedPassword]);
    
    const token = jwt.sign({ uid: userId, email, displayName: name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { uid: userId, email, displayName: name }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ uid: user.id, email: user.email, displayName: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { uid: user.id, email: user.email, displayName: user.name }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Google Sign-In — create or find user, return JWT
router.post('/auth/google', async (req, res) => {
  try {
    const { uid, email, name, photoURL } = req.body;
    if (!uid || !email) return res.status(400).json({ message: 'Missing uid or email' });

    let user = await dbGet('SELECT * FROM users WHERE id = ?', [uid]);
    if (!user) {
      // Also check by email in case they registered with email/password first
      user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
      if (!user) {
        // Create new Google user (no password)
        await dbRun('INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
          [uid, name || email, email, '']);
        user = await dbGet('SELECT * FROM users WHERE id = ?', [uid]);
      }
    }

    const token = jwt.sign(
      { uid: user.id, email: user.email, displayName: user.name, photoURL: photoURL || '' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ user: { uid: user.id, email: user.email, displayName: user.name, photoURL: photoURL || '' }, token });
  } catch (error) {
    res.status(500).json({ message: 'Error with Google login', error: error.message });
  }
});

router.get('/users/find', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await dbGet('SELECT id as uid, name as displayName, email FROM users WHERE email = ?', [email]);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error finding user', error: error.message });
  }
});

// ================= PROJECT ROUTES =================

router.get('/projects', authMiddleware, async (req, res) => {
  try {
    // Get projects where the user is a member
    const projects = await dbAll(`
      SELECT p.* 
      FROM projects p
      JOIN project_members pm ON p.id = pm.projectId
      WHERE pm.userId = ?
      ORDER BY p.createdAt DESC
    `, [req.user.uid]);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

router.post('/projects', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    const projectId = generateId();

    await dbRun('INSERT INTO projects (id, name, description, creatorId) VALUES (?, ?, ?, ?)', 
      [projectId, name, description, req.user.uid]);
    
    await dbRun('INSERT INTO project_members (projectId, userId, role) VALUES (?, ?, ?)',
      [projectId, req.user.uid, 'Admin']);

    const newProject = await dbGet('SELECT * FROM projects WHERE id = ?', [projectId]);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

router.get('/projects/:id/members', authMiddleware, async (req, res) => {
  try {
    const members = await dbAll(`
      SELECT u.id as uid, u.name as displayName, u.email, pm.role 
      FROM project_members pm
      JOIN users u ON pm.userId = u.id
      WHERE pm.projectId = ?
    `, [req.params.id]);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching members', error: error.message });
  }
});

router.post('/projects/:id/members', authMiddleware, async (req, res) => {
  try {
    const { uid, role } = req.body;
    await dbRun('INSERT INTO project_members (projectId, userId, role) VALUES (?, ?, ?)',
      [req.params.id, uid, role]);
    res.status(201).json({ message: 'Member added' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding member', error: error.message });
  }
});

router.delete('/projects/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    await dbRun('DELETE FROM project_members WHERE projectId = ? AND userId = ?',
      [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

// ================= TASK ROUTES =================

router.get('/projects/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await dbAll(`
      SELECT t.*, u.name as assignedToName 
      FROM tasks t
      LEFT JOIN users u ON t.assignedTo = u.id
      WHERE t.projectId = ?
      ORDER BY t.createdAt DESC
    `, [req.params.id]);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

router.post('/projects/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    const taskId = generateId();
    
    await dbRun(`
      INSERT INTO tasks (id, title, description, status, priority, dueDate, assignedTo, projectId, createdBy) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [taskId, title, description, status || 'To Do', priority || 'Medium', dueDate, assignedTo, req.params.id, req.user.uid]);
    
    const newTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

router.put('/projects/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const taskId = req.params.taskId;
    
    // Only updating status for simplicity, or all provided fields
    let queryArgs = [];
    let setQuery = [];
    for (const [key, value] of Object.entries(updates)) {
      setQuery.push(`${key} = ?`);
      queryArgs.push(value);
    }
    setQuery.push(`updatedAt = CURRENT_TIMESTAMP`);
    queryArgs.push(taskId);

    if (setQuery.length > 1) {
      await dbRun(`UPDATE tasks SET ${setQuery.join(', ')} WHERE id = ?`, queryArgs);
    }
    
    res.json({ message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

router.delete('/projects/:id/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    await dbRun('DELETE FROM tasks WHERE id = ?', [req.params.taskId]);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

export default router;
