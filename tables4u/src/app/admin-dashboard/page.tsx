'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Restaurants from './Restaurants';

import { Dashboard } from "@/components/Dashboard";

export default function AdminDashboard() {
    const router = useRouter();
    const [restaurantList, setRestaurantList] = useState<any[]>([]);
    const [listError, setListError] = useState("Loading restaurants...");
    const [ selectedRestaurant, setSelectedRestaurant ] = useState<string | undefined>(undefined);

    const getCookie = (name: string) => document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))?.at(2);

    async function listAllRestaurants() {
        setListError("Loading restaurants...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListAllRestaurants";
        const body = JSON.stringify({
            jwt: getCookie("jwt")
        });
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if(result.statusCode == 200) {
            setListError("");
            const list = [];
            for (const restaurant of result.restaurants) {
                list.push(restaurant);
            }
            {/* 
            // @ts-ignore the state doesn't start with a defined type other than array so react gets mad :( */}
            setRestaurantList(list);
        } else {
            setRestaurantList([]);
            setListError(result.error);
        }
    }

    function logout() {
        document.cookie = "jwt=;";
        router.push("/");
    }

    useEffect(() => {
        let ignore = false;
        
        if (!ignore)  listAllRestaurants()
        return () => { ignore = true; }
    },[]);

    return (
        <div id="admin-dashboard-panel">
            <h1>Administrator Dashboard</h1>
            <select name="restaurants" id="restaurants" defaultValue="" onChange={(event) => {
                setSelectedRestaurant(event.target.value);
            }}>
                <option value="" disabled>Select Restaurant</option>
                {restaurantList.map((restaurantInfo) => (
                    <option key={restaurantInfo.restaurantID} value={restaurantInfo.restaurantID}>{restaurantInfo.name}</option>
                ))}
            </select>
            <Dashboard restaurantID={selectedRestaurant}/>
            {/* <p id="admin-restaurant-list-error">{listError}</p>
            <Restaurants restaurantsInfo={restaurantList}/>
            <button onClick={logout}>Logout</button> */}
        </div>
    );
}