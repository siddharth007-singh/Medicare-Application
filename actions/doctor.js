"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const setAvailabilitySlot = async (formData) => {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // Get the doctor
        const doctor = await db.user.findUnique({
            where: {
                clerkUserId: userId,
                role: "DOCTOR",
            },
        });

        if (!doctor) {
            throw new Error("Doctor not found");
        }


        // Get form data
        const startTime = formData.get("startTime");
        const endTime = formData.get("endTime");

        //Check if startTime and endTime are valid input or not
        if (!startTime || !endTime) {
            throw new Error("Invalid time input");
        }

        if (startTime >= endTime) {
            throw new Error("Start time must be before end time");
        }

        // now check if doctor is already have that slot or not (looking up all the time slots this doctor has previously said they are available for. )
        const existingSlot = await db.availability.findMany({   
            where: {
                doctorId: doctor.id,
            },
        });

        // If slots exist, replacing them
        if( existingSlot.length > 0) {

            // get the slot where docto is having no appointments
            const slotWithNoAppointments = existingSlot.filter((slot)=>!slot.appointments);

            //If we found any unused slots, delete them from the database to make space for new ones
            if(slotWithNoAppointments.length>0){
            await db.availability.deleteMany({
                where:{
                    id:{
                        in: slotWithNoAppointments.map(slot => slot.id)
                    }
                }
            });
        }
        }

        // Create new availability slot
        const newSlot = await db.availability.create({
            data: {
                doctorId: doctor.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status: "AVAILABLE",
            },
        });

        revalidatePath("/doctor");
        return { success: true, slot: newSlot };
    } catch (error) {
        console.error("Failed to set availability slots:", error);
        throw new Error("Failed to set availability: " + error.message);
    }
}


export const getAvailabilitySlots = async () => {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // Get the doctor
        const doctor = await db.user.findUnique({
            where: {
                clerkUserId: userId,
                role: "DOCTOR",
            },
        });

        if (!doctor) {
            throw new Error("Doctor not found");
        }

        // Get availability slots
        const availabilitySlots = await db.availability.findMany({
            where: {
                doctorId: doctor.id,
            },
            orderBy: {
                startTime: "asc",
            },
        });

        return { success: true, slots: availabilitySlots };
    } catch (error) {
        console.error("Failed to get availability slots:", error);
        throw new Error("Failed to get availability slots: " + error.message);
    }
}

export const getDoctorAppointments = async () => {
    return []; 
}