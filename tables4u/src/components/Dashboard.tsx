import { useState, useEffect } from "react";
import styles from './Dashboard.module.css';

import BasicInformation from "./BasicInformation";
import Tables from "./Tables";
import AccountOptions from "./AccountOptions";
import ReviewAvailability from "./ReviewAvailability";

import type { RestaurantInfo } from "./contexts";
import { RestaurantInfoContext, TablesInfoContext } from "./contexts";

export function Dashboard({ isAdmin } : { isAdmin: boolean }) {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);

    const [ selectedRestaurant, setSelectedRestaurant ] = useState<string | undefined>(undefined);
    const [ restaurantList , setRestaurantList ] = useState<any[]>([]);

    const [tablesInfo, setTablesInfo] = useState([{ number: 0, seats: 0 }]);
    const [restaurantInfoStatus, setRestaurantInfoStatus] = useState("Waiting...");

    async function listAllRestaurants() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ListAllRestaurants";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        });
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if(result.statusCode == 200) {
            const list = [];
            for (const restaurant of result.restaurants) {
                list.push(restaurant);
            }
            setRestaurantList(list);
            setSelectedRestaurant(list[0].restaurantID);
        } else setRestaurantList([]);
    }

    async function getRestaurantInfo() {
        setRestaurantInfoStatus("Waiting...");
        if (!selectedRestaurant) return;

        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo";
        const body = JSON.stringify({
            restaurantID: selectedRestaurant, jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if (result.statusCode == 200) {
            setRestaurantInfoStatus("");
            const info = JSON.parse(result.body).restaurantInfo;

            setRestaurantInfo({
                name: info.name,
                address: info.address,
                isActive: info.isActive,
                openingTime: info.openingTime,
                closingTime: info.closingTime
            });

            const tables: { number: number, seats: number }[] = []
            for (const table of JSON.parse(result.body).tables)
                tables.push({ number: table.number, seats: table.seats });
            setTablesInfo(tables);

            // restaurantID = info.restaurantID;
        } else setRestaurantInfoStatus(result.error);
    }

    useEffect(() => { listAllRestaurants(); }, []);
    useEffect(() => { getRestaurantInfo(); }, [selectedRestaurant]);

    if (!restaurantInfo) {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Waiting...</h1>
            </div>
        )
    } else if (restaurantInfoStatus !== "" && restaurantInfoStatus !== "Waiting...") {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Oops!</h1>
                <p>{restaurantInfoStatus}</p>
                <button>Try Again</button>
            </div>
        )
    } else {
        return (
            <RestaurantInfoContext.Provider value={{ restaurantInfo, setRestaurantInfo }}>
                <TablesInfoContext.Provider value={{ tablesInfo, setTablesInfo }}>
                    <div id={styles.content}>
                        <div id={styles.restaurantDetails}>
                            <h1>Restaurant Details</h1>
                            <select name="restaurants" id="restaurants" value={selectedRestaurant} defaultValue="" onChange={(event) => {
                                setSelectedRestaurant(event.target.value);
                            }}>
                                <option value="" disabled>Select Restaurant</option>
                                {restaurantList.map((restaurantInfo) => (
                                    <option key={restaurantInfo.restaurantID} value={restaurantInfo.restaurantID}>{restaurantInfo.name}</option>
                                ))}
                            </select>
                            <p>{restaurantInfoStatus}</p>
                            <BasicInformation isAdmin={isAdmin} />
                            <Tables isActive={restaurantInfo.isActive || isAdmin} />
                            <AccountOptions restaurantInfo={restaurantInfo} />
                        </div>
                        <ReviewAvailability />
                    </div>
                </TablesInfoContext.Provider>
            </RestaurantInfoContext.Provider>
        )
    }
}