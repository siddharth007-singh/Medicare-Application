
import { PageHeader } from "@/components/page-header";
import { getDoctorsBySpecialty } from "@/actions/doctorList";
import React from "react";
import { redirect } from "next/navigation";

export default async function DoctorSpecialtyPage({ params }) {
  const { speciality } = await params;
    if (!speciality) {
       redirect("/doctors");
    }

    const {doctors, error} = await getDoctorsBySpecialty(speciality);
    if (error) {
        console.error("Error fetching doctors:", error);
    }

  return (
    <div className="space-y-5">
      <PageHeader
        title={speciality.split("%20").join(" ")}
        backLink="/doctors"
        backLabel="All Specialties"
      />

      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <h1>Doc Here</h1>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-white mb-2">
            No doctors available
          </h3>
          <p className="text-muted-foreground">
            There are currently no verified doctors in this specialty. Please
            check back later or choose another specialty.
          </p>
        </div>
      )}

    </div>


  );
}



// {doctors.map((doctor) => (
//             <DoctorCard key={doctor.id} doctor={doctor} />
//           ))}