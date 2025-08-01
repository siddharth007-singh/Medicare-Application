"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope, Loader2, Loader } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import useFetch  from "@/hooks/use-fetch";
import { setUserRole } from "@/actions/onboarding";

const doctorFormSchema = z.object({
    speciality: z.string().min(1, "Speciality is required"),
    experience: z.number().min(1, "Experience is required").max(50, "Experience cannot exceed 50 years"),
    credentailUrl: z.string().url("Invalid URL").min(1, "Credential URL is required"),
    decscription: z.string().min(1, "Description is required"),
});


const OnboardingPage = () => {
    const [step, setStep] = useState("choose-role"); //Specially use for doctor step;
    const router = useRouter();

    const {data, fn:submitUserRole, loading} = useFetch(setUserRole);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(doctorFormSchema),
    });

    const handlePatientSelection = async() => {
        if(loading) return;

        const formData = new FormData();
        formData.append('role', 'PATIENT');

        await submitUserRole(formData);
    }

    //After, Reflect it into Ui
    useEffect(() => {
        if(data && data?.success){
            toast.success("Role selected successfully");
            router.push(data.redirect);
        }
    },[data])

    // Watch the role to conditionally render the form
    if (step === "choose-role") {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                    className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
                    onClick={() => !loading && handlePatientSelection()}
                >
                    <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                        <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
                            <User className="h-8 w-8 text-emerald-400" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-white mb-2">
                            Join as a Patient
                        </CardTitle>
                        <CardDescription className="mb-4">
                            Book appointments, consult with doctors, and manage your
                            healthcare journey
                        </CardDescription>
                        <Button className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                            {loading ? (<><Loader className="mr-2 h-4 w-4 animate-spin"/> Processing...</>) : ("Continue as Patient")}
                        </Button>
                    </CardContent>
                </Card>

                <Card
                    className="border-emerald-900/20 hover:border-emerald-700/40 cursor-pointer transition-all"
                    onClick={() => !loading && setStep("doctor-form")}
                >
                    <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                        <div className="p-4 bg-emerald-900/20 rounded-full mb-4">
                            <Stethoscope className="h-8 w-8 text-emerald-400" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-white mb-2">
                            Join as a Doctor
                        </CardTitle>
                        <CardDescription className="mb-4">
                            Create your professional profile, set your availability, and
                            provide consultations
                        </CardDescription>
                        <Button
                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            Continue as Doctor
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === "doctor-form") {
                                
        return(<>DoctorForm</>)
    }

}

export default OnboardingPage;