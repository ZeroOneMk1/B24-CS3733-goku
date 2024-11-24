'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from "react";

export default function DeleteRestaurant({
    restaurantInfo
}: {
    restaurantInfo: {
        name: string,
        address: string,
        isActive: boolean,
        openingTime: number,
        closingTime: number,
    }
}) {
    const router = useRouter();
    const [ deleteRestaurantStatus, setDeleteRestaurantStatus ] = useState(" ");
    const isDisabled = deleteRestaurantStatus == "Deleting...";

    async function deleteRestaurant() {
        // create confirm dialog
        if (!window.confirm(`Are you sure you want to delete ${restaurantInfo.name}?\n
            This action cannot be undone.`)) return;

        setDeleteRestaurantStatus("Deleting...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/DeleteRestaurant";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            // set status, delete cookie, and return to index
            setDeleteRestaurantStatus("Deleted, redirecting...");
            document.cookie = "jwt=;";
            setTimeout(() => router.push("/"), 2000);
        } else setDeleteRestaurantStatus(result.error);
    }
    
    return (
        <div id="delete-restaurant">
            <button onClick={deleteRestaurant} disabled={isDisabled}>Delete restaurant</button>
            <p>{deleteRestaurantStatus}</p>
        </div>
    )
}