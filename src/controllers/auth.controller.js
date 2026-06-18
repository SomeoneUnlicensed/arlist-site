"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.logout = exports.login = exports.verifyEmail = exports.register = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_service_1 = __importDefault(require("../services/prisma.service"));
const mail_service_1 = require("../services/mail.service");
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await prisma_service_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_service_1.default.user.create({
            data: {
                email,
                passwordHash,
                name,
                isVerified: false,
            },
        });
        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await prisma_service_1.default.verificationToken.create({
            data: {
                token: code,
                userId: user.id,
                expires,
                type: 'EMAIL_VERIFICATION',
            },
        });
        await (0, mail_service_1.sendVerificationEmail)(email, code);
        res.status(201).json({ message: 'User registered. Please check your email for verification code.' });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await prisma_service_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const tokenRecord = await prisma_service_1.default.verificationToken.findFirst({
            where: {
                token: code,
                userId: user.id,
                type: 'EMAIL_VERIFICATION',
                expires: { gt: new Date() },
            },
        });
        if (!tokenRecord) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        await prisma_service_1.default.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });
        await prisma_service_1.default.verificationToken.delete({ where: { id: tokenRecord.id } });
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyEmail = verifyEmail;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_service_1.default.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ error: 'Invalid credentials' });
        if (!user.isVerified) {
            return res.status(403).json({ error: 'Please verify your email first' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch)
            return res.status(400).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
};
exports.logout = logout;
const getProfile = async (req, res) => {
    try {
        const user = await prisma_service_1.default.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProfile = getProfile;
//# sourceMappingURL=auth.controller.js.map