"use client";

import React, { useState, useEffect } from 'react'
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Loader2, Clock, ArrowLeft, Calendar, CreditCard } from "lucide-react";
import { toast } from "sonner";
import useFetch from '@/hooks/use-fetch';
import { bookAppointment } from '@/actions/appointments';

const AppointmentForm = ({ doctorId, slot, onBack, onComplete }) => {
    const [patientDescripption, setPatientDescription] = useState('');

    const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

    //Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("doctorId", doctorId);
        formData.append("startTime", slot.startTime);
        formData.append("endTime", slot.endTime);
        formData.append("patientDescripption", patientDescripption);

        await submitBooking(formData);
    }

    useEffect(() => {
        if (data) {
            if (data.success) {
                toast.success("Appointment booked successfully!");
                onComplete();
            }
        }
    }, [data]);

    return (
        <form onSubmit={handleSubmit} className='space-y-6'>
            <div className="bg-muted/20 p-4 rounded-lg border border-emerald-900/20 space-y-3">
                <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-white font-medium">
                        {format(new Date(slot.startTime), "EEEE, MMMM d, yyyy")}
                    </span>
                </div>
                <div className="flex items-center">
                    <Clock className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-white">{slot.formatted}</span>
                </div>
                <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-emerald-400 mr-2" />
                    <span className="text-muted-foreground">
                        Cost: <span className="text-white font-medium">2 credits</span>
                    </span>
                </div>
            </div>


            <div className="space-y-2">
                <Label htmlFor="patientDescripption">
                    Describe your medical concern (optional)
                </Label>
                <Textarea
                    id="patientDescripption"
                    placeholder="Please provide any details about your medical concern or what you'd like to discuss in the appointment..."
                    value={patientDescripption}
                    onChange={(e) => setPatientDescription(e.target.value)}
                    className="bg-background border-emerald-900/20 h-32"
                />
                <p className="text-sm text-muted-foreground">
                    This information will be shared with the doctor before your
                    appointment.
                </p>
            </div>

            <div className="flex justify-between pt-2">
                <Button
                    type="button"   
                    variant="outline"
                    onClick={onBack}
                    disabled={loading}
                    className="border-emerald-900/30"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Change Time Slot
                </Button>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Booking...
                        </>
                    ) : (
                        "Confirm Booking"
                    )}
                </Button>
            </div>
        </form>
    )
}

export default AppointmentForm