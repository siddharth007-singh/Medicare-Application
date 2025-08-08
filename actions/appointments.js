"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { addDays, addMinutes, format, isBefore, endOfDay } from "date-fns";
import { deductCreditsForAppointment } from "./credits";
import { Auth } from "@vonage/auth";
import { Vonage } from "@vonage/server-sdk";
import { revalidatePath } from "next/cache";



// Initialize Vonage Video API client
const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});
const options = {};
const vonage = new Vonage(credentials, options);


export const getDoctorById = async (doctorId) => {
    try {
        const doctor = await db.user.findUnique({
            where: {
                id: doctorId,
                role: "DOCTOR",
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

///// THis is the main Fucntion of this project
export const getAvailableTimeSlots = async (doctorId) => {
    try {
        const doctor = await db.user.findUnique({
            where: {
                id: doctorId,
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
            }
        })

        if (!doctor) {
            throw new Error("Doctor not found or not verified");
        }


        // Fetch available slots of doctor
        const availableSlots = await db.availability.findFirst({
            where: {
                doctorId: doctor.id,
                status: "AVAILABLE",
            },
        })

        if (!availableSlots) {
            throw new Error("No available slots found for this doctor");
        }

        //Get the time slots from the availability for Doctors upto next 4 days
        const now = new Date();
        const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

        //Fecth already booked appoinment 
        const lastDay = endOfDay(days[3]);
        const existingAppointments = await db.appointment.findMany({
            where: {
                doctorId: doctor.id,
                status: "SCHEDULED",
                startTime: {
                    lte: lastDay,
                }
            },
        });


        const availableSlotsDay = {};

        //For each of the next 4 days, generate available slots
        for (const day of days) {
            const dayString = format(day, "yyyy-MM-dd");
            availableSlotsDay[dayString] = [];

            // Create a copy of the availability start/end times for this day
            const availabilityStart = new Date(availableSlots.startTime);
            const availabilityEnd = new Date(availableSlots.endTime);

            // Set the day to the current day we're processing
            availabilityStart.setFullYear(
                day.getFullYear(),
                day.getMonth(),
                day.getDate()
            );
            availabilityEnd.setFullYear(
                day.getFullYear(),
                day.getMonth(),
                day.getDate()
            );



            let current = new Date(availabilityStart);
            const end = new Date(availabilityEnd);

            while (
                isBefore(addMinutes(current, 20), end) ||
                +addMinutes(current, 20) === +end
            ) {
                const next = addMinutes(current, 20);

                // Skip past slots
                if (isBefore(current, now)) {
                    current = next;
                    continue;
                }
                const overlaps = existingAppointments.some((appointment) => {
                    const aStart = new Date(appointment.startTime);
                    const aEnd = new Date(appointment.endTime);

                    return (
                        (current >= aStart && current < aEnd) ||
                        (next > aStart && next <= aEnd) ||
                        (current <= aStart && next >= aEnd)
                    );
                });

                if (!overlaps) {
                    availableSlotsDay[dayString].push({
                        startTime: current.toISOString(),
                        endTime: next.toISOString(),
                        formatted: `${format(current, "h:mm a")} - ${format(
                            next,
                            "h:mm a"
                        )}`,
                        day: format(current, "EEEE, MMMM d"),
                    });
                }

                current = next;
            }
        }
        // Convert to array of slots grouped by day for easier consumption by the UI
        const result = Object.entries(availableSlotsDay).map(([date, slots]) => ({
            date,
            displayDate:
                slots.length > 0
                    ? slots[0].day
                    : format(new Date(date), "EEEE, MMMM d"),
            slots,
        }));

        return { days: result };

    } catch (error) {
        console.error("Failed to fetch available slots:", error);
        throw new Error("Failed to fetch available slots");
    }
}


export const bookAppointment = async (formData) => {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    try {
        // get the patient
        const patient = await db.user.findUnique({
            where: {
                clerkUserId: userId,
                role: "PATIENT",
            }
        });

        if (!patient) {
            throw new Error("Patient not found");
        }

        //get the data from formData
        const doctorId = formData.get("doctorId");
        const startTime = formData.get("startTime");
        const endTime = formData.get("endTime");
        const patientDescripption = formData.get("patientDescripption") || null;

        if (!doctorId || !startTime || !endTime) {
            throw new Error("Missing required fields");
        }


        //Get the doctor
        const doctor = await db.user.findUnique({
            where: {
                id: doctorId,
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
            }
        });

        if (!doctor) {
            throw new Error("Doctor not found or not verified");
        }

        //Check the Patient credit also
        if (patient.credit <= 2) {
            throw new Error("Patient has no credit to book an appointment");
        }

        //Check the time slot if doc is available or not 
        const overLappingAppointments = await db.appointment.findMany({
            where: {
                doctorId: doctorId,
                status: "SCHEDULED",
                OR: [
                    {
                        // New appointment starts during an existing appointment
                        startTime: {
                            lte: startTime,   //(less than or equal to)
                        },
                        endTime: {
                            gt: startTime,  //(greater than)
                        },
                    },
                    {
                        // New appointment ends during an existing appointment
                        startTime: {
                            lt: endTime,  //(less than)
                        },
                        endTime: {
                            gte: endTime,  //(greater than or equal to)
                        },
                    },
                    {
                        // New appointment completely overlaps an existing appointment
                        startTime: {
                            gte: startTime,  //(greater than or equal to)
                        },
                        endTime: {
                            lte: endTime,  //(less than or equal to)
                        },
                    },
                ],
            }
        });

        if (overLappingAppointments) {
            throw new Error("This time slot is already booked");
        }

        // Create a new Vonage Video API session
        const sessionId = await createVideoSession();

        // Deduct credits from patient and add to doctor
        const { success, error } = await deductCreditsForAppointment(
            patient.id,
            doctor.id
        );

        if (!success) {
            throw new Error(error || "Failed to deduct credits");
        }


        const appointment  = await db.appointment.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                startTime,
                endTime,
                patientDescripption,
                status: "SCHEDULED",
                videoSessionUrl: sessionId,
            }
        });
        revalidatePath("/appointments");
        return { success: true, appointment: appointment };

    } catch (error) {
        console.error("Failed to book appointment:", error);
        throw new Error("Failed to book appointment");
    }
}


export const createVideoSession = async () => {
    try {
        const session = await vonage.video.createSession({mediaMode: "routed"});
        return session.sessionId;
    } catch (error) {
        console.error("Failed to create video session:", error);
        throw new Error("Failed to create video session");
    }
}


