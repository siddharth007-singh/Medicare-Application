"use server"
import { auth } from "@clerk/nextjs/server";
import {format} from 'date-fns';
import {revalidatePath} from "next/cache";
import { db } from "@/lib/prisma";

// Define credit allocations per plan
const PLAN_CREDITS = {
  free_user: 0, // Basic plan: 2 credits
  standard: 10, // Standard plan: 10 credits per month
  premium: 24, // Premium plan: 24 credits per month
};

// Each appointment costs 2 credits
const APPOINTMENT_CREDIT_COST = 2;


export const checkAndAllocateCredits = async(user)=>{
    try{
        if(!user){
            return null;
        }

        //User is Patient or not
        if(user.role !== "PATIENT") {
            return user; // Only allocate credits for patients
        }

        // Simulate checking user current  credits
        const {has} = await auth();
        const hasBasic = has({plan:"free_user"});
        const hasStandard = has({plan:"standard"});
        const hasPremium = has({plan:"premium"});

        let currentPlan = null;
        let creditToAllocate = 0;

        if(hasPremium) {
            currentPlan = "premium";
            creditToAllocate = PLAN_CREDITS.premium; // Premium users get 100 credits
        }
        else if(hasStandard) {
            currentPlan = "standard";
            creditToAllocate = PLAN_CREDITS.standard; // Standard users get 50 credits
        }
        else if(hasBasic) {
            currentPlan = "basic";
            creditToAllocate = PLAN_CREDITS.free_user; // Basic users get 20 credits
        }


        if(!currentPlan) {
            return user; // No plan found, no credits to allocate
        }

        //Check if user already has credits
        const currentMonth = format(new Date(), 'yyyy-MM');
        if(user.transactions.length>0) {
            const latestTransaction = user.transactions[0];
            const latestTransactionMonth = format(new Date(latestTransaction.createdAt), 'yyyy-MM');
            const latestTransactionPlan = latestTransaction.packageId;


            if(latestTransactionMonth === currentMonth && latestTransactionPlan === currentPlan) {
                return user; // Already allocated credits for this month
            }
        }


        // Allocate credits to user
        const updatedUser = await db.$transaction(async (tx) => { ///So i use a prisma inbuilt "$tansaction" query to did multiple queries in a single fun.... (if 1 query failed All query failed) 
            await tx.creditTransaction.create({
                data:{
                    userId: user.id,
                    amount: creditToAllocate,
                    type:"CREDIT_PURCHASE",
                    packageId: currentPlan,
                }
            });

            //Update transction in user accnt

            const updatedUser = await tx.user.update({
                where:{id: user.id},
                data:{
                    credits:{
                        increment: creditToAllocate, // Increment the user's credits by the allocated amount  total=2+10
                    }
                }
            });
            return updatedUser; 
        });
        revalidatePath("/doctors");
        revalidatePath("/appointments");

        return updatedUser; 
    }
    catch(error){
        return null; // Handle error gracefully, maybe log it
    }
}