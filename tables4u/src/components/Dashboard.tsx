import { useState, useEffect } from "react";
import styles from './Dashboard.module.css';

import BasicInformation from "./BasicInformation";
import Tables from "./Tables";
import AccountOptions from "./AccountOptions";
import ReviewAvailability from "./ReviewAvailability";
import AvailabilityReport from "./AvailabilityReport";

import type { RestaurantInfo } from "./contexts";
import { RestaurantInfoContext, TablesInfoContext } from "./contexts";

export function Dashboard({restaurantList} : { restaurantList?: any[]}) {
    const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
        name: "",
        address: "",
        isActive: false,
        openingTime: 0,
        closingTime: 0,
    });

    const [tablesInfo, setTablesInfo] = useState([{ number: 0, seats: 0 }]);

    const [restaurantID, setRestaurantID] = useState("");

    const [restaurantInfoStatus, setRestaurantInfoStatus] = useState("waiting");

    const [isAvailabilityReport, setIsAvailabilityReport] = useState<boolean>(false);

    async function getRestaurantInfo() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo";
        const body = JSON.stringify({
            restaurantID, jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2)
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

    function showAdmin() {
        if(restaurantInfoStatus !== "success") {
            return styles.adminSelect;
        } else {
            return styles.adminHidden;
        }
    }

    function infoFromID(rID: string) {
        for(const restaurant of restaurantList ?? []) {
            if(restaurant.restaurantID == rID) {
                return restaurant;
            }
        }
    }

    function AdminSelect() {
        return (
            <div id={showAdmin()}>
                <h1>Administrator Dashboard</h1>
                <select name="restaurants" id="restaurants" defaultValue={restaurantID} onChange={(event) => {
                    if(restaurantID !== event.target.value) {
                        setRestaurantID(event.target.value);
                        setRestaurantInfo(infoFromID(event.target.value));
                        setRestaurantInfoStatus("adminSuccess");
                    }
                }}>
                    <option value="" disabled>Select Restaurant</option>
                    {restaurantList?.map((restaurantInfo) => (
                        <option key={restaurantInfo.restaurantID} value={restaurantInfo.restaurantID}>{restaurantInfo.name}</option>
                    ))}
                </select>
                <button id={styles.swapAvailabilityButton} onClick={() => setIsAvailabilityReport(!isAvailabilityReport)}>{isAvailabilityReport == true ? "Generate Availabity Report": "Show Reservations"}</button>
            </div>
        )    
    
    }

    function AvailabilityModules() {
        if(isAvailabilityReport) return  <AvailabilityReport restaurantID={restaurantID}/>;
        return <ReviewAvailability restaurantID={restaurantID}/>;
    }

    if(restaurantList == undefined) {
        useEffect(() => { getRestaurantInfo(); }, [restaurantID]);
    } else if (restaurantID == ""){
        useEffect(() => setRestaurantInfoStatus("admin"));
    } else {
        useEffect(() => setRestaurantInfoStatus("adminSuccess"));
    }


    if (restaurantInfoStatus == "waiting") {
        return (
            <div id={styles.restaurantDetailsPlaceholder}>
                <h1>Waiting...</h1>
            </div>
        )
    } else if(restaurantInfoStatus == "admin") {
        return (
            <AdminSelect/>
        )
    } else if (restaurantInfoStatus !== "success" && restaurantInfoStatus !== "adminSuccess") {
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
                            <AdminSelect/>
                            <h1>Restaurant Details</h1>
                            <BasicInformation isAdmin={restaurantList !== undefined} />
                            <Tables isActive={restaurantInfo.isActive || typeof restaurantList != undefined} />
                            <AccountOptions restaurantInfo={restaurantInfo} restaurantID={restaurantID} />
                        </div>
                        <AvailabilityModules/>
                    </div>
                </TablesInfoContext.Provider>
            </RestaurantInfoContext.Provider>
        )
    }
}