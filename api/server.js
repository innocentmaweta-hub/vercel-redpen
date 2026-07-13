import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());

// JWT_SECRET must be set in production for security
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is not set.');
    console.warn('Using development fallback secret. Set a strong random secret in your .env file:');
    console.warn('  JWT_SECRET=your-strong-random-secret-here');
    console.warn('IMPORTANT: Never use the fallback secret in production!');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production';

// Global request timeout middleware (5 minutes for grading)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        req.setTimeout(300000);
        res.setTimeout(300000);
    }
    next();
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

let provider = null;
let openaiClient = null;
let MODEL = null;

if (GEMINI_KEY) {
    provider = 'gemini';
    MODEL = 'gemini-2.0-flash';
    console.log('Provider: Google Gemini (gemini-2.0-flash)');
} else if (OPENAI_KEY?.startsWith('sk-or-')) {
    provider = 'openrouter';
    openaiClient = new OpenAI({ apiKey: OPENAI_KEY, baseURL: 'https://openrouter.ai/api/v1' });
    MODEL = 'openai/gpt-4o';
    console.log('Provider: OpenRouter (openai/gpt-4o)');
} else if (OPENAI_KEY) {
    provider = 'openai';
    openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
    MODEL = 'gpt-4o';
    console.log('Provider: OpenAI (gpt-4o)');
} else {
    console.warn('WARNING: No API key found. Set GEMINI_API_KEY or OPENAI_API_KEY in .env file.');
}

// In-memory user storage (for Vercel serverless, use a database in production)
// This simple version uses an in-memory object that persists per function instance
let usersCache = null;
let usersCacheTime = 0;
const USERS_CACHE_TTL = 60000; // 1 minute

function loadUsers() {
    // In production on Vercel, use a database like MongoDB, Postgres, or KV storage
    // For this demo, we use in-memory storage (won't persist across function cold starts)
    if (usersCache && Date.now() - usersCacheTime < USERS_CACHE_TTL) {
        return usersCache;
    }
    // Initialize with default data
    const defaultUsers = {};
    usersCache = defaultUsers;
    usersCacheTime = Date.now();
    return usersCache;
}

function saveUsers(users) {
    usersCache = users;
    usersCacheTime = Date.now();
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ code: 'AUTH_REQUIRED', message: 'Authentication required' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const users = loadUsers();
        const user = users[decoded.email];
        if (!user) return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'User not found' });
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid token' });
    }
}

// ========== Auth Endpoints ==========

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ code: 'MISSING_FIELDS', message: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ code: 'INVALID_EMAIL', message: 'Please provide a valid email address' });
        }

        const users = loadUsers();
        if (users[email]) {
            return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password: hashedPassword,
            tier: 'free',
            gradingCount: 0,
            gradingLimit: 5,
            apiKey: null,
            apiProvider: null,
            createdAt: new Date().toISOString(),
        };

        users[email] = newUser;
        saveUsers(users);

        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
        const { password: _, ...safeUser } = newUser;
        res.json({ token, user: safeUser });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ code: 'MISSING_CREDENTIALS', message: 'Email and password are required' });
        }

        const users = loadUsers();
        const user = users[email];
        if (!user) {
            return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
        }

        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' });
        const { password: _, ...safeUser } = user;
        res.json({ token, user: safeUser });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ code: 'LOGIN_FAILED', message: 'Login failed' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    const { password: _, ...safeUser } = req.user;
    res.json({ user: safeUser });
});

app.post('/api/auth/logout', (_req, res) => {
    res.json({ message: 'Logged out' });
});

// ========== API Key Management ==========

app.post('/api/settings/api-keys', authMiddleware, async (req, res) => {
    try {
        const { openaiKey, geminiKey } = req.body;
        const users = loadUsers();
        const user = users[req.user.email];

        if (openaiKey) {
            user.apiKey = openaiKey;
            user.apiProvider = 'openai';
        } else if (geminiKey) {
            user.apiKey = geminiKey;
            user.apiProvider = 'gemini';
        }

        saveUsers(users);
        const { password: _, ...safeUser } = user;
        res.json({ message: 'API keys saved', user: safeUser });
    } catch (error) {
        console.error('Save API keys error:', error);
        res.status(500).json({ message: 'Failed to save API keys' });
    }
});

// ========== Grading Endpoint (with auth) ==========

app.post('/api/grade', authMiddleware, async (req, res) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[${requestId}] Starting grading request for ${req.user.email}`);

    try {
        const user = req.user;

        // Check grading limit for non-corporate users
        if (user.tier !== 'corporate' && user.gradingCount >= user.gradingLimit) {
            return res.status(403).json({
                code: 'LIMIT_REACHED',
                error: true,
                message: `Grading limit reached (${user.gradingCount}/${user.gradingLimit}). Upgrade your plan or add your own API key in Settings to continue.`
            });
        }

        // Determine which API key to use: user's own or server shared
        let activeProvider = provider;
        let activeModel = MODEL;
        let activeOpenaiClient = openaiClient;
        let activeGeminiKey = GEMINI_KEY;

        // If user has their own API key, use that instead
        if (user.apiKey && user.apiProvider) {
            if (user.apiProvider === 'openai') {
                activeProvider = 'openai';
                activeOpenaiClient = new OpenAI({ apiKey: user.apiKey });
                activeModel = 'gpt-4o';
            } else if (user.apiProvider === 'gemini') {
                activeProvider = 'gemini';
                activeGeminiKey = user.apiKey;
                activeModel = 'gemini-2.0-flash';
            }
        } else if (user.tier === 'free' && !user.apiKey) {
            // Free tier: use server's API key if available, up to 5 gradings/month
            if (!provider) {
                return res.status(403).json({
                    code: 'NO_API_KEY',
                    error: true,
                    message: 'No AI service configured. Please add your own API key in Settings.'
                });
            }
            // Continue with server's provider - limit already checked above
        }

        if (!activeProvider) {
            return res.status(500).json({
                code: 'NO_PROVIDER_CONFIGURED',
                error: true,
                message: 'No AI provider configured. Contact administrator.'
            });
        }

        const { studentInfo, markingScheme, studentPaper } = req.body;

        if (!studentPaper || typeof studentPaper !== 'string') {
            return res.status(400).json({ code: 'MISSING_PAPER', error: true, message: 'Student paper is required.' });
        }

        const hasScheme = !!markingScheme;
        const cleanPaper = studentPaper.includes(',') ? studentPaper.split(',')[1] : studentPaper;
        const paperMime = studentPaper.startsWith('data:') ? studentPaper.split(';')[0].replace('data:', '') : 'image/jpeg';

        let cleanScheme = null;
        let schemeMime = null;
        if (hasScheme) {
            cleanScheme = markingScheme.includes(',') ? markingScheme.split(',')[1] : markingScheme;
            schemeMime = markingScheme.startsWith('data:') ? markingScheme.split(';')[0].replace('data:', '') : 'image/jpeg';
        }

        const prompt = buildPrompt(studentInfo, hasScheme);

        let result;
        try {
            if (activeProvider === 'gemini') {
                result = await gradeWithGemini(prompt, cleanScheme, schemeMime, cleanPaper, paperMime, hasScheme, activeGeminiKey, activeModel);
            } else {
                result = await gradeWithOpenAI(prompt, cleanScheme, schemeMime, cleanPaper, paperMime, hasScheme, activeOpenaiClient, activeModel);
            }
        } catch (apiError) {
            console.error(`[${requestId}] AI API error:`, apiError);
            return res.status(502).json({
                code: 'AI_SERVICE_ERROR',
                error: true,
                message: 'AI grading service failed. Please try again later.'
            });
        }

        // Increment grading count
        const users = loadUsers();
        if (users[user.email]) {
            users[user.email].gradingCount = (users[user.email].gradingCount || 0) + 1;
            saveUsers(users);
        }

        console.log(`[${requestId}] Grading completed via ${activeProvider}. User: ${user.email}`);
        res.json(result);

    } catch (error) {
        console.error(`[${requestId}] Grading error:`, error);
        res.status(500).json({ code: 'GRADING_FAILED', error: true, message: error.message || 'Failed to complete grading.' });
    }
});

// ========== Status Endpoint ==========

app.get('/api/status', (_req, res) => {
    res.json({ provider, model: MODEL });
});

// ========== Helper Functions ==========

function buildPrompt(studentInfo, hasScheme) {
    const gradeInstructions = hasScheme
        ? `Grade the student's answers strictly against the attached marking scheme. Use the scheme's allocation of marks per question exactly.`
        : `No marking scheme was provided. Grade the student's answers using standard academic criteria:
- Completeness and accuracy of answers
- Depth of understanding demonstrated
- Logical structure and coherence
- Clarity of expression
Estimate reasonable marks out of 100 total, distributing across questions as appropriate for a university-level exam.`;

    return `
You are an expert academic evaluator. ${gradeInstructions}

Student Metadata (may be incomplete — extract from the paper if missing):
- Name: ${studentInfo?.name || 'Unknown'}
- Reg No: ${studentInfo?.regNo || 'Unknown'}
- Course Code: ${studentInfo?.courseCode || 'Unknown'}
- Program: ${studentInfo?.program || 'Unknown'}
- Year: ${studentInfo?.year || 'Unknown'}
- Exam Date: ${studentInfo?.examDate || 'Unknown'}

Instructions:
1. ${hasScheme ? 'Study the marking scheme carefully to understand all questions and their maximum marks.' : 'Identify all questions from the student paper and estimate appropriate marks for each.'}
2. Examine the student paper and evaluate each answer.
3. Assign a score per question and provide brief, constructive feedback for each.
4. Compute the total score and assign a letter grade (A+, A, B+, B, C+, C, D, or F).
5. Also attempt to extract the student's identity from the paper itself if visible.
${!hasScheme ? '6. Note in the overall feedback that no marking scheme was provided and general criteria were used.' : ''}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "total_score": "X/Y",
  "grade": "A",
  "questions": [
    { "q": 1, "score": "X/Y", "feedback": "Brief feedback for this question" }
  ],
  "feedback": "Overall summary of the student's performance.",
  "extracted_info": {
    "name": "",
    "regNo": "",
    "program": "",
    "year": "",
    "courseCode": "",
    "examDate": ""
  }
}
`;
}

async function gradeWithOpenAI(prompt, cleanScheme, schemeMime, cleanPaper, paperMime, hasScheme, client, model) {
    const content = [{ type: 'text', text: prompt }];
    if (hasScheme) {
        content.push({ type: 'image_url', image_url: { url: `data:${schemeMime};base64,${cleanScheme}` } });
    }
    content.push({ type: 'image_url', image_url: { url: `data:${paperMime};base64,${cleanPaper}` } });

    const response = await client.chat.completions.create({
        model: model,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content }]
    });
    return JSON.parse(response.choices[0].message.content);
}

async function gradeWithGemini(prompt, cleanScheme, schemeMime, cleanPaper, paperMime, hasScheme, apiKey, model) {
    const ai = new GoogleGenAI({ apiKey });
    const parts = [{ text: prompt }];
    if (hasScheme) {
        parts.push({ inlineData: { mimeType: schemeMime, data: cleanScheme } });
    }
    parts.push({ inlineData: { mimeType: paperMime, data: cleanPaper } });

    const effectiveModel = model || 'gemini-2.0-flash';
    const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: [{ role: 'user', parts }],
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text);
}

// Export the Express app as a serverless function for Vercel
export default app;