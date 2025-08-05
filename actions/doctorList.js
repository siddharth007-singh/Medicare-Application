"use server"
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";


export const getDoctorsBySpecialty = async (speciality) => {
   const {userId} = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    try{
        const doctors = await db.user.findMany({
            where: {
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
                speciality: {
                    equals: speciality.trim(), // 👈 trims the input
                    mode: "insensitive",       // 👈 case-insensitive match
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return { doctors };
    }
    catch (error) {
        console.error("Failed to fetch doctors by specialty:", error);
        return { error: "Failed to fetch doctors" };
    }

}   