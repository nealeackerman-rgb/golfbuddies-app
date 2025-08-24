// server/src/index.ts

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// This line loads the environment variables from your .env file
dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in .env file. Please add it.");
}

// ========== MIDDLEWARE ==========
// These are functions that run for every request
app.use(cors()); // Allows your frontend (on a different URL) to talk to this backend
app.use(express.json({ limit: '10mb' })); // Allows the server to understand JSON data sent from the frontend

// ========== HELPERS ==========
const BCRYPT_SALT_ROUNDS = 10;

// ========== API ROUTES ==========
// This is where we define the "endpoints" or URLs that the frontend will call.

// --- AUTHENTICATION ---

// Register a new user
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, handicap } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || '',
                handicap,
                profilePictureUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
                friendIds: [],
            },
        });
        
        const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
        
        const { password: _, ...userWithoutPassword } = newUser;
        
        res.status(201).json({ user: userWithoutPassword, token });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// Login an existing user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
        
        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword, token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


// --- DATA FETCHING ---
// These endpoints get the initial data for the app.

app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany();
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

app.get('/api/courses', async (req, res) => {
    const courses = await prisma.course.findMany();
    res.json(courses);
});

app.get('/api/competitions', async (req, res) => {
    const competitions = await prisma.competition.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(competitions);
});

app.get('/api/rounds', async (req, res) => {
    const rounds = await prisma.round.findMany({
        orderBy: { date: 'desc' }
    });
    res.json(rounds);
});


// --- DATA MUTATION ---
// These endpoints create and update data.

app.post('/api/courses', async (req, res) => {
    const newCourse = await prisma.course.create({ data: req.body });
    res.status(201).json(newCourse);
});

app.post('/api/competitions', async (req, res) => {
    const newCompetition = await prisma.competition.create({ data: req.body });
    res.status(201).json(newCompetition);
});

app.put('/api/competitions/:id', async (req, res) => {
    const { id } = req.params;
    const { feed, ...dataToUpdate } = req.body; // Feed is handled by its own endpoints
    const updatedCompetition = await prisma.competition.update({
        where: { id },
        data: dataToUpdate,
    });
    res.json(updatedCompetition);
});

// Add a feed item to a competition
app.post('/api/competitions/:id/feed', async (req, res) => {
    const { id } = req.params;
    const feedItemData = req.body;

    const updatedCompetition = await prisma.$transaction(async (tx) => {
        const competition = await tx.competition.findUnique({ where: { id } });
        if (!competition) {
            throw new Error('Competition not found');
        }

        // The server is now the authority for this data
        const newFeedItem = {
            ...feedItemData,
            id: `feed-${Date.now()}`,
            timestamp: new Date().toISOString(),
            likes: 0
        };

        const currentFeed = (competition.feed as any[]) || [];
        const newFeed = [newFeedItem, ...currentFeed];
        return tx.competition.update({
            where: { id },
            data: { feed: newFeed },
        });
    });
    res.status(201).json(updatedCompetition);
});

// Update a feed item (for likes)
app.put('/api/competitions/:competitionId/feed/:itemId', async (req, res) => {
    const { competitionId, itemId } = req.params;
    const { likes } = req.body;

    const updatedCompetition = await prisma.$transaction(async (tx) => {
        const competition = await tx.competition.findUnique({ where: { id: competitionId }});
        if (!competition) {
           throw new Error('Competition not found');
        }
        const currentFeed = (competition.feed as any[]) || [];
        const newFeed = currentFeed.map(item => {
            if (item.id === itemId) {
                return { ...item, likes };
            }
            return item;
        });
        return tx.competition.update({
            where: { id: competitionId },
            data: { feed: newFeed },
        });
    });
    res.json(updatedCompetition);
});


app.post('/api/rounds', async (req, res) => {
    const newRound = await prisma.round.create({ data: req.body });
    res.status(201).json(newRound);
});

app.put('/api/rounds/:id', async (req, res) => {
    const { id } = req.params;
    const updatedRound = await prisma.round.update({
        where: { id },
        data: req.body,
    });
    res.json(updatedRound);
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { password, ...dataToUpdate } = req.body;
    const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
    });
    const { password: _, ...safeUser } = updatedUser;
    res.json(safeUser);
});

app.post('/api/users/:userId/friends', async (req, res) => {
    const { userId } = req.params;
    const { friendId } = req.body;

    const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { friendIds: { push: friendId } },
    });
    
    await prisma.user.update({
        where: { id: friendId },
        data: { friendIds: { push: parseInt(userId) } },
    });

    const { password, ...safeUser } = updatedUser;
    res.status(200).json(safeUser);
});

app.delete('/api/users/:userId/friends/:friendId', async (req, res) => {
    const { userId, friendId } = req.params;

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) }});
    const friend = await prisma.user.findUnique({ where: { id: parseInt(friendId) }});
    let updatedUser = user;

    if (user && friend) {
        updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { friendIds: user.friendIds.filter(id => id !== parseInt(friendId)) }
        });
        
        await prisma.user.update({
            where: { id: parseInt(friendId) },
            data: { friendIds: friend.friendIds.filter(id => id !== parseInt(userId)) }
        });
    }

    if (updatedUser) {
        const { password, ...safeUser } = updatedUser;
        res.status(200).json(safeUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// ========== SERVER START ==========
app.listen(PORT, () => {
  console.log(`GolfBuddies server running on http://localhost:${PORT}`);
});