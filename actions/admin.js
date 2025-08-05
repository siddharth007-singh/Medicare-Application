"use server";


import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export const verifyAdmin = async () => {
    const { userId } = await auth();
    if (!userId) {
        return false;
    }

    try {
        const user = await db.user.findUnique({
            where: {
                clerkUserId: userId,
            },
        });

        return user?.role === "ADMIN";
    }
    catch (error) {
        console.error("Failed to verify admin:", error);
        return false;
    }
}

export const getAllPendingDoctors = async () => {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");


    try {
        const pendingDoctors = await db.user.findMany({
            where: {
                role: "DOCTOR",
                verificationStatus: "PENDING",
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return { doctors: pendingDoctors };
    }
    catch (error) {
         throw new Error("Failed to fetch pending doctors");
    }
}


export const getVerifiedDoctors = async () => {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try{
        const verifiedDoctors = await db.user.findMany({
            where: {
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
            },
            orderBy: {
                name: "asc",
            },
        });

        return { doctors: verifiedDoctors };
    }
    catch(error){
        console.error("Failed to fetch verified doctors:", error);
        throw new Error("Failed to fetch verified doctors");
    }
}


export const updateDoctorStatus = async (formData) => {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try{
        const doctorId = formData.get("doctorId");
        const status = formData.get("status");

        if (!doctorId || !status) {
            throw new Error("Doctor ID and status are required");
        }

        await db.user.update({
            where: { id: doctorId },
            data: { verificationStatus: status },
        });

        revalidatePath("/admin");

        return {success: true, message: "Doctor verification status updated successfully"};
    }
    catch(error) {
        console.error("Failed to update doctor verification status:", error);
        throw new Error("Failed to update doctor verification status");
    }
}


export const updateDoctorActiveStatus = async (formData) => {
    try{
        const isAdmin = await verifyAdmin();
        if (!isAdmin) throw new Error("Unauthorized");

        const doctorId = formData.get("doctorId");
        const suspend = formData.get("suspend") === "true";


        if (!doctorId) {
            throw new Error("Doctor ID is required");
        }

        const status = suspend ? "PENDING" : "VERIFIED";

        await db.user.update({
            where: { id: doctorId },
            data: { verificationStatus: status },
        });
        revalidatePath("/admin");
        return { success: true };
    }  
    catch(error) {
        console.error("Failed to update doctor active status:", error);
        throw new Error("Failed to update doctor active status");
    }
}


export const searchVerifiedDoctors = async (searchTerm) => {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) throw new Error("Unauthorized");

    try {
        const doctors = await db.user.findMany({
            where: {
                role: "DOCTOR",
                verificationStatus: "VERIFIED",
                name: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return { doctors };
    } catch (error) {
        console.error("Failed to search verified doctors:", error);
        throw new Error("Failed to search verified doctors");
    }
}

//Merge both the Fucntionality of updateDoctorStatus and updateDoctorActiveStatus
// export const updateDoctorStatu = async (formData) => {
//   const isAdmin = await verifyAdmin();
//   if (!isAdmin) throw new Error("Access denied: Admins only");

//   const doctorId = formData.get("doctorId");
//   const status = formData.get("status"); // Manual override
//   const suspend = formData.get("suspend"); // "true" or "false"

//   if (!doctorId) throw new Error("Doctor ID is required");

//   // Determine new status
//   const newStatus = status 
//     ? status 
//     : suspend === "true" 
//       ? "PENDING" 
//       : "VERIFIED";

//   try {
//     await db.user.update({
//       where: { id: doctorId },
//       data: { verificationStatus: newStatus },
//     });

//     revalidatePath("/admin");

//     return {
//       success: true,
//       message: `Doctor status updated to ${newStatus}`,
//     };
//   } catch (error) {
//     console.error("❌ Update failed:", error);
//     throw new Error("Failed to update doctor status. Try again.");
//   }
// };



