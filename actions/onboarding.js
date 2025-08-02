"use server";

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const setUserRole = async (formData) => {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
        where: { clerkUserId: userId },
    })

    if (!user) {
        throw new Error("User not found");
    }

    const role = formData.get('role');

    if (!role || (role !== 'DOCTOR' && role !== 'PATIENT')) {
        throw new Error("Invalid role selected");
    }

    try {
        if (role === 'PATIENT') {
            await db.user.update({
                where: { clerkUserId: userId },
                data: { role: 'PATIENT' },
            });

            revalidatePath('/');
            return { success: true, redirect: '/doctors', message: "Role updated to Patient" };
        }

        if (role === 'DOCTOR') {
            const speciality = formData.get('speciality');
            const experience = parseInt(formData.get('experience'), 10);
            const credentailUrl = formData.get('credentailUrl');
            const decscription = formData.get('decscription');

            if (!speciality || !experience || !credentailUrl || !decscription) {
                throw new Error("All fields are required for Doctor role");
            }

            await db.user.update({
                where: { clerkUserId: userId },
                data: { role: 'DOCTOR', speciality, experience, credentailUrl, decscription, verificationStatus: 'PENDING' },
            });

            revalidatePath('/');
            return { success: true, redirect: '/doctors/verification', message: "Role updated to Doctors" };
        }
    }
    catch (error) {
        console.error("Failed to set user role:", error);
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
}


export const getCurrentUser = async () => {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("User not authenticated");
    }

    try {
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        throw new Error("Failed to fetch current user");
    }
}



// npg_9xe7yMQavuLk