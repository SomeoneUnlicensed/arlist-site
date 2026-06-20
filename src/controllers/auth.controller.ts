import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.service.js';
import { sendVerificationEmail } from '../services/mail.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, agreedToPolicy } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (agreedToPolicy !== true) return res.status(400).json({ error: 'You must agree to the privacy policy' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name, isVerified: false, agreedToPolicy: true } });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationToken.create({
      data: { token: code, userId: user.id, expires: new Date(Date.now() + 24 * 3600_000), type: 'EMAIL_VERIFICATION' },
    });
    try {
      await sendVerificationEmail(email, code);
    } catch (mailErr) {
      console.error('Mail send failed (registration):', mailErr);
    }
    res.status(201).json({ message: 'Registered. Check your email for verification code.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: { token: code, userId: user.id, type: 'EMAIL_VERIFICATION', expires: { gt: new Date() } },
    });
    if (!tokenRecord) return res.status(400).json({ error: 'Invalid or expired code' });

    await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });
    res.json({ message: 'Email verified successfully' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Already verified' });

    // Rate-limit: max 1 resend per minute
    const recent = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: 'EMAIL_VERIFICATION', expires: { gt: new Date(Date.now() + 23 * 3600_000) } },
    });
    if (recent) return res.status(429).json({ error: 'Please wait before requesting a new code' });

    await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: 'EMAIL_VERIFICATION' } });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationToken.create({
      data: { token: code, userId: user.id, expires: new Date(Date.now() + 24 * 3600_000), type: 'EMAIL_VERIFICATION' },
    });
    try {
      await sendVerificationEmail(email, code);
    } catch (mailErr) {
      console.error('Mail send failed (resend):', mailErr);
    }
    res.json({ message: 'Verification code sent' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email first' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 3600_000,
    });
    res.json({ message: 'Logged in', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('token', { sameSite: 'lax' });
  res.json({ message: 'Logged out' });
};

export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, role: user.role, isVerified: user.isVerified, createdAt: user.createdAt, balanceKopecks: user.balanceKopecks });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name } = req.body;
    if (typeof name !== 'string') return res.status(400).json({ error: 'Invalid name' });
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name: name.trim() || null },
      select: { id: true, email: true, name: true, role: true, isVerified: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) return res.status(400).json({ error: 'Неверный текущий пароль' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    res.json({ message: 'Password changed' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
};
