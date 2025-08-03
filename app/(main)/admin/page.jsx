import { TabsContent } from '@/components/ui/tabs';
import React from 'react';
import { getAllPendingDoctors, getVerifiedDoctors } from '@/actions/admin';
import { PendingDoctors } from './_components/pendingDoctors';
import { VerifiedDoctors } from './_components/verifiedDoctors';

const AdminPage = async() => {

    const [pendingDoctorsData, verifiedDoctorsData] = await Promise.all([
        getAllPendingDoctors(),
        getVerifiedDoctors(),
    ])

    return (
        <div>
            <TabsContent value="pending">
                <PendingDoctors doctors={pendingDoctorsData.doctors || []} />
            </TabsContent>
            <TabsContent value="doctors">
                <VerifiedDoctors doctors={verifiedDoctorsData.doctors || []} />
            </TabsContent>
        </div>
    )
}

export default AdminPage;


// 2:37:53