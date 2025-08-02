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
import useFetch from "@/hooks/use-fetch";
import { setUserRole } from "@/actions/onboarding";
import { SPECIALTIES } from "@/lib/specialities";

const doctorFormSchema = z.object({
    speciality: z.string().min(1, "Speciality is required"),
    experience: z.string().min(1, "Speciality is required"),
    credentailUrl: z.string().url("Invalid URL").min(1, "Credential URL is required"),
    decscription: z.string().min(1, "Description is required"),
});


const OnboardingPage = () => {
    const [step, setStep] = useState("choose-role"); //Specially use for doctor step;
    const router = useRouter();
    

    const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(doctorFormSchema),
    });

    const specialityValue = watch('speciality');

    const handlePatientSelection = async () => {
        if (loading) return;

        const formData = new FormData();
        formData.append('role', 'PATIENT');

        await submitUserRole(formData);
    }

    //After, Reflect it into Ui
    useEffect(() => {
        if (data && data?.success) {
            toast.success("Role selected successfully");
            router.push(data.redirect);
        }
    }, [data]);



    const onDoctorFormSubmit = async (data) => {
        if (loading) return;
        const formData = new FormData();
        formData.append("role", "DOCTOR");
        formData.append("speciality", data.speciality);
        formData.append("experience", data.experience);
        formData.append("credentailUrl", data.credentailUrl);
        formData.append("decscription", data.decscription);

        const result = await submitUserRole(formData);
        if (result?.success) {
            router.push(result.redirect);
        } else {
            toast.error("Failed to submit doctor profile");
        }
    }

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
                            {loading ? (<><Loader className="mr-2 h-4 w-4 animate-spin" /> Processing...</>) : ("Continue as Patient")}
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

        return (
            <Card className="border-emerald-900/20">
                <CardContent className="pt-6">
                    <div className="mb-6">
                        <CardTitle className="text-2xl font-bold text-white mb-2">
                            Complete Your Doctor Profile
                        </CardTitle>
                        <CardDescription>
                            Please provide your professional details for verification
                        </CardDescription>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onDoctorFormSubmit)}>
                        <div className="space-y-2">
                            <Label htmlFor="speciality">Medical Specialty</Label>
                            <Select value={specialityValue} onValueChange={(value) => setValue('speciality', value)}>
                                <SelectTrigger id="specialty">
                                    <SelectValue placeholder="Select your specialty" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SPECIALTIES.map((spec) => (
                                        <SelectItem
                                            key={spec.name}
                                            value={spec.name}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-emerald-400">{spec.icon}</span>
                                            {spec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.speciality && (
                                <p className="text-sm font-medium text-red-500 mt-1">
                                    {errors.speciality.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience</Label>
                            <Input
                                id="experience"
                                type="text"
                                placeholder="e.g. 5"
                                {...register('experience')}
                            />
                            {errors.experience && (
                                <p className="text-sm font-medium text-red-500 mt-1">
                                    {errors.experience.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="credentailUrl">Link to Credential Document</Label>
                            <Input
                                id="credentailUrl"
                                type="url"
                                placeholder="https://example.com/my-medical-degree.pdf"
                                {...register('credentailUrl')}
                            />
                            {errors.credentailUrl && (
                                <p className="text-sm font-medium text-red-500 mt-1">
                                    {errors.credentailUrl.message}
                                </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Please provide a link to your medical degree or certification
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description of Your Services</Label>
                            <Textarea
                                id="decscription"
                                placeholder="Describe your expertise, services, and approach to patient care..."
                                rows="4"
                                {...register('decscription')}
                            />

                            {errors.decscription && (
                                <p className="text-sm font-medium text-red-500 mt-1">
                                    {errors.decscription.message}
                                </p>
                            )}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-emerald-900/30"
                                onClick={() => setStep("choose-role")}   //Back to chooserole
                            >
                                Back
                            </Button>

                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit for Verification"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )
    }

}

export default OnboardingPage;