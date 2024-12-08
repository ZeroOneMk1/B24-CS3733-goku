'use client';
import { useState, useEffect, useContext } from "react";
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import BasicInformation from "./BasicInformation";
import Tables from "./Tables";
import AccountOptions from "./AccountOptions";
import ReviewAvailability from "./ReviewAvailability";

import type { RestaurantInfo, ReservationInfo } from "./contexts";
import { RestaurantInfoContext, TablesInfoContext } from "./contexts";

export default function ManageRestaurant() {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
        name: "",
        address: "",
        isActive: false,
        openingTime: 0,
        closingTime: 0,
    });

    const [tablesInfo, setTablesInfo] = useState([{
        number: 0,
        seats: 0
    }]);

    const [restaurantInfoStatus, setRestaurantInfoStatus] = useState("waiting");

    async function getRestaurantInfo() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
        })

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();
        if (result.statusCode == 200) {
            setRestaurantInfoStatus("success");
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

    useEffect(() => { getRestaurantInfo(); }, []);

    if (restaurantInfoStatus == "waiting") {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Waiting...</h1>
            </div>
        )
    } else if (restaurantInfoStatus !== "success") {
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
                            <BasicInformation />
                            <Tables isActive={restaurantInfo.isActive} />
                            <AccountOptions restaurantInfo={restaurantInfo} />
                        </div>
                        <ReviewAvailability />
                    </div>
                </TablesInfoContext.Provider>
            </RestaurantInfoContext.Provider>
        )
    }
}
