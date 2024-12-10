'use client';
import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";

export default function AdminDashboard() {
    const [restaurantList, setRestaurantList] = useState<any[]>([]);

    async function listAllRestaurants() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListAllRestaurants";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        });
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if (result.statusCode == 200) setRestaurantList(result.restaurants);
        else window.alert("Error fetching restaurants: " + result.error);
    }

    useEffect(() => { listAllRestaurants() }, []);

    return ( <Dashboard restaurantList={restaurantList}/> );
}