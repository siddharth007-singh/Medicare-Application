import React from 'react';
import { getCurrentUser } from "@/actions/onboarding";
import { redirect } from "next/navigation";

export const metadata = {
    title: "Onboarding - Medicare",
    description: "Complete your profile to get started with Medicare",
};

const OnboardingLayout = async ({ children }) => {

    // complete user profile
    const user = await getCurrentUser();

    // If user is already authenticated and has a role, redirect them to the appropriate page
    if (user) {
        if (user.role === "PATIENT") {
            redirect("/doctors");
        } else if (user.role === "DOCTOR") {
            // Check verification status for doctors
            if (user.verificationStatus === "VERIFIED") {
                redirect("/doctors");
            } else {
                redirect("/doctor/verification");
            }
        } else if (user.role === "ADMIN") {
            redirect("/admin");
        }
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome to Medicare
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Tell us how you want to use the platform
                    </p>
                </div>

                {children}
            </div>
        </div>
    )
}

export default OnboardingLayout;