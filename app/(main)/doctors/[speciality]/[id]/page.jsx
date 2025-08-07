import React from 'react';
import {getAvailableTimeSlots, getDoctorById} from "@/actions/appointments";
import { redirect } from 'next/navigation';
import DoctorProfile from './_components/doctor-profile';

const DoctorProfilePage = async ({ params }) => {

    const { id } = await params;

    try{
        const [doctorData, slotsData] = await Promise.all([
            getDoctorById(id),
            getAvailableTimeSlots(id),
        ]);


        return (
            <DoctorProfile
                doctor={doctorData.doctor}
                availableDays={slotsData.days || []}
            />
        )
    }
    catch(error){
        console.error("Error fetching doctor or slots:", error);
        redirect('/doctors');
    }
}

export default DoctorProfilePage;



// 91791