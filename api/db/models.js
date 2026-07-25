import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, lowercase: true },
    name: { type: String, required: true },
    password: { type: String }, // Optional for Google OAuth users
    googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
    tier: { type: String, enum: ['free', 'personal', 'corporate'], default: 'free' },
    gradingCount: { type: Number, default: 0 },
    gradingLimit: { type: Number, default: 5 }, // Free tier limit
    apiKey: { type: String }, // User's own API key
    apiProvider: { type: String, enum: ['openai', 'gemini'], default: null },
    lastGradingReset: { type: Date, default: Date.now }, // For monthly limit reset
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Reset grading count monthly
userSchema.methods.resetGradingCountIfNeeded = function () {
    const now = new Date();
    const lastReset = new Date(this.lastGradingReset);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    if (lastReset < oneMonthAgo) {
        this.gradingCount = 0;
        this.lastGradingReset = now;
        return this.save();
    }
    return Promise.resolve();
};

const gradingHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentInfo: {
        name: String,
        regNo: String,
        program: String,
        year: String,
        courseCode: String,
        examDate: String
    },
    result: {
        totalScore: String,
        percentage: String,
        grade: String,
        questions: [{
            q: Number,
            score: String,
            feedback: String
        }],
        feedback: String,
        extracted_info: {
            name: String,
            regNo: String,
            program: String,
            year: String,
            courseCode: String,
            examDate: String
        }
    },
    paperUrl: String, // URL or base64 reference
    markingSchemeUrl: String,
    remarks: String,
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const GradingHistory = mongoose.model('GradingHistory', gradingHistorySchema);
