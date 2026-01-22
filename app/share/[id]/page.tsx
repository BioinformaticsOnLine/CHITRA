'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SharePage({ params }: { params: { id: string } }) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the main visualization page with the shareId query parameter
        router.replace(`/chitra?shareId=${params.id}`);
    }, [params.id, router]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-muted-foreground animate-pulse">Loading shared visualization...</p>
            </div>
        </div>
    );
}
