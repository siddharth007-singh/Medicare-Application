"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { includes } from "zod";

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

        // Get appointments for the doctor
        const appointments = await db.appointment.findMany({
            where: {
                doctorId: doctor.id,
                status:{
                    in:['SCHEDULED']
                }
            },
            include:{
                patient:true,
            },
            orderBy: {
                startTime: "asc",
            },
        });

        return { success: true, appointments };
    } catch (error) {
        console.error("Failed to get doctor appointments:", error);
        throw new Error("Failed to get doctor appointments: " + error.message);
    }
}

//FormData Contains appointmentId
export const cancleAppointment = async (formData) => {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }
    try {
        //Getting both doc or patient depending on the role
        const user = await db.user.findFirst({
            where: {
                clerkUserId: userId,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const appointmentId = formData.get("appointmentId");
        if (!appointmentId) {
            throw new Error("Appointment ID is required");
        }


        // Check if the appointment exists
        const appointment = await db.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            include: {
                doctor: true,
                patient: true,
            },
        });

        if (!appointment) {
            throw new Error("Appointment not found");
        }

        // Check if the user is authorized to cancel this appointment
        if( (user.role === "DOCTOR" && appointment.doctorId !== user.id) ||
            (user.role === "PATIENT" && appointment.patientId !== user.id)) {
            throw new Error("You are not authorized to cancel this appointment");
        }

        await db.$transaction(async (tx) => {
            await tx.appointment.update({
                where: {
                    id: appointmentId,
                },
                data: {
                    status: "CANCELLED",
                },
            })

            //Refund to patient
            if(user.role==="PATIENT") {
                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: 2, // Assuming fee is the amount to refund
                        type: "APPOINTMENT_DEDUCTION",
                    },
                });
            }

            // deduct from doctor's earnings
            if(user.role==="DOCTOR") {
                await tx.creditTransaction.create({
                    data: {
                        userId: user.id,
                        amount: -2, // Assuming fee is the amount to deduct
                        type: "APPOINTMENT_DEDUCTION",
                    },
                });
            }


            //Update user (doctor or patient) credit Balance
            await tx.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    creditBalance: {
                        increment: user.role === "PATIENT" ? 2 : -2, // Refund for patient, deduct for doctor
                    },
                },
            });
        });

        if(user.role === "DOCTOR") {
            revalidatePath("/doctor");
        }
        else if(user.role === "PATIENT"){
            revalidatePath("/appointments");
        }

        return { success: true, message: "Appointment cancelled successfully" };
    } catch (error) {
        throw new Error("Failed to cancel appointment: " + error.message);
    }
}


export const addAppointmentNotes = async (formData) => {
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

        const appointmentId = formData.get("appointmentId");
        const notes = formData.get("notes");

        if (!appointmentId || !notes) {
            throw new Error("Appointment ID and notes are required");
        }

        // Update the appointment with notes
        const updatedAppointment = await db.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                notes: notes,
            },
        });

        revalidatePath("/doctor");

        return { success: true, appointment: updatedAppointment };
    } catch (error) {
        console.error("Failed to add appointment notes:", error);
        throw new Error("Failed to add appointment notes: " + error.message);
    }
}


export const markAppointmentAsCompleted = async (formData) => {
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

        const appointmentId = formData.get("appointmentId");

        if (!appointmentId) {
            throw new Error("Appointment ID is required");
        }

        const appointment = await db.appointment.findUnique({
            where: {
                id: appointmentId,
                doctorId: doctor.id,
            },
            include: {
                patient: true,
            },
        });

        if( !appointment) {
            throw new Error("Appointment not found");
        }

        // Check if the appointment is already completed
        if (appointment.status === "COMPLETED") {
            throw new Error("Appointment is already marked as completed");
        }

        if(appointment.status!=="SCHEDULED"){
            throw new Error("Appointment must be in SCHEDULED status to mark as completed");
        }


        // Now check the Time of appointment also if we pass we can't mark it as completed
        const now = new Date();
        const appointmentEndTime = new Date(appointment.endTime);

        if(now < appointmentEndTime) {
            throw new Error("Cannot mark appointment as completed before its end time");
        }

        // Update the appointment status to completed
        const updatedAppointment = await db.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                status: "COMPLETED",
            },
        });

        revalidatePath("/doctor");

        return { success: true, appointment: updatedAppointment };
    } catch (error) {
        console.error("Failed to mark appointment as completed:", error);
        throw new Error("Failed to mark appointment as completed: " + error.message);
    }
}