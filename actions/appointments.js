"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";


export const getDoctorById = async (doctorId) => {
    try {
        const doctor = await db.user.findUnique({
            where:{
                id: doctorId,
                role:"DOCTOR",
                verificationStatus: "VERIFIED",
            }
        })

        if (!doctor) {
            throw new Error("Doctor not found or not verified");
        }

        return { doctor };
    } catch (error) {
        console.error("Failed to fetch doctor:", error);
        throw new Error("Failed to fetch doctor details");
    }
}