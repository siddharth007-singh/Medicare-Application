import { getDoctorById } from '@/actions/appointments';
import { PageHeader } from '@/components/page-header';
import { redirect } from 'next/navigation';
import React from 'react';


const DoctorProfileLayout = async({ children, params }) => {
    const {id} = await params;
    const {doctor} = await getDoctorById(id);

    if(!doctor) {
        redirect("/doctors");
    }


    return(
        <div className="container mx-auto">
            <PageHeader title={"Dr. " + doctor.name} backLink={`/doctors/${doctor.specialty}`} backLabel={`Back to ${doctor.speciality}`}/>
            {children}
        </div>
    )


}

export default DoctorProfileLayout;