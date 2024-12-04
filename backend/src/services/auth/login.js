import scrypt from 'scrypt-kdf';
import prisma from '../../../prisma/prismaClient.js';
import adminFirebase from '../../../firebase/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

const loginUser = async ({ email, password }) => {
    try {
        // Cek pengguna di PostgreSQL
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // Debugging Password
        console.log('User Password:', user.password);
        
        // Cek keberadaan pengguna di Firebase Authentication
        let firebaseUser;
        try {
            firebaseUser = await adminFirebase.auth().getUser(user.id); // Gunakan UID dari PostgreSQL
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                throw new Error('USER_NOT_FOUND_IN_FIREBASE');
            } else {
                throw new Error('FIREBASE_ERROR: ' + error.message);
            }
        }

        // Cek verifikasi email di Firebase
        if (!firebaseUser.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Cek keberadaan pengguna di Firestore
        const firestore = adminFirebase.firestore();
        const userDoc = await firestore.collection('users').doc(user.id).get();
        if (!userDoc.exists) {
            throw new Error('USER_NOT_FOUND_IN_FIRESTORE');
        }

        // Validasi role dan status
        if (user.role === 'AUTHOR' && !user.isApproved) {
            throw new Error('AUTHOR_NOT_APPROVED');
        }
        if (user.role === 'ADMIN') {
            throw new Error('ADMIN_NOT_ALLOWED');
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isApproved: user.isApproved,
            token,
        };
    } catch (error) {
        console.error('Error logging in:', error);
        throw new Error(error.message);
    }
};

export default loginUser;