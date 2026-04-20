"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
// In-memory mock database
const users = [];
// Also store passwords separately to avoid returning them
const passwords = {};
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_development';
const register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password || !fullName) {
            res.status(400).json({ message: 'Email, password and fullName are required' });
            return;
        }
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUserId = (0, uuid_1.v4)();
        const newUser = {
            id: newUserId,
            email,
            status: 'active',
            emailVerifiedAt: null,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        users.push(newUser);
        passwords[newUserId] = hashedPassword;
        const token = jsonwebtoken_1.default.sign({ userId: newUserId }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({
            accessToken: token,
            user: newUser
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        const user = users.find(u => u.email === email);
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, passwords[user.id]);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        user.lastLoginAt = new Date().toISOString();
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({
            accessToken: token,
            user
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Mock returning user and empty profile
        res.status(200).json({
            user,
            profile: {
                userId: user.id,
                slug: 'mock-slug',
                fullName: 'Mock User',
                title: null,
                institutionId: null,
                institutionNameRaw: null,
                countryCode: null,
                careerStage: 'other',
                bio: null,
                personalWebsite: null,
                researchKeywords: [],
                orcidId: null,
                coiDeclarationText: '',
                isProfilePublic: false,
                verificationStatus: 'unverified',
                verifiedAt: null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};
exports.getMe = getMe;
