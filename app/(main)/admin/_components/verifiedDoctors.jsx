"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Ban, Loader2, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { searchVerifiedDoctors, updateDoctorActiveStatus } from "@/actions/admin";
import useFetch from "@/hooks/use-fetch";

export const VerifiedDoctors = ({ doctors }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const { loading, fn: searchDoc, data } = useFetch(searchVerifiedDoctors);

    const { loading: updateStatusLoading, fn: submitStatusUpdate, data: updateStatusData } = useFetch(updateDoctorActiveStatus);

    const filteredDoctors = (searchTerm
        ? data?.doctors ?? []
        : doctors
    ).filter((doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (searchTerm.trim()) {
            searchDoc(searchTerm);
        }
    }, [searchTerm]);


    const handleStatusUpdate = async (doctor, suspend) => {

        const confirmed = window.confirm(
            `Are you sure you want to ${suspend ? "suspend" : "reinstate"} ${doctor.name
            }?`
        );
        if (!confirmed || updateStatusLoading) return;

        const formData = new FormData();
        formData.append("doctorId", doctor.id);
        formData.append("suspend", suspend ? "true" : "false");

        await submitStatusUpdate(formData);
    }

    useEffect(() => {
        if (updateStatusData?.success) {
            // Optionally, you can refetch the doctors or update the state to reflect changes
            searchDoc(searchTerm);
        }

    }, [updateStatusData]);

    return (
        <div>
            <Card className="bg-muted/20 border-emerald-900/20">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl font-bold text-white">
                                Manage Doctors
                            </CardTitle>
                            <CardDescription>
                                View and manage all verified doctors
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search doctors..."
                                className="pl-8 bg-background border-emerald-900/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Loader2 className="animate-spin mx-auto" />
                        </div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No verified doctors found.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredDoctors.map((doctor) => (
                                <Card
                                    key={doctor.id}
                                    className="bg-background border-emerald-900/20 hover:border-emerald-700/30 transition-all"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-muted/20 rounded-full p-2">
                                                    <img
                                                        src={doctor.imageUrl}
                                                        alt={doctor.name}
                                                        className="h-10 w-10 rounded-full"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-white">
                                                        {doctor.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {doctor.specialty} • {doctor.experience} years experience
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end md:self-auto">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-emerald-900/20 border-emerald-900/30 text-emerald-400"
                                                >
                                                    {doctor.verificationStatus}
                                                </Badge>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-emerald-900/30 hover:bg-muted/80 cursor-pointer"
                                                    onClick={() => handleStatusUpdate(doctor, true)}
                                                    disabled={updateStatusLoading}

                                                >
                                                    Suspend
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
