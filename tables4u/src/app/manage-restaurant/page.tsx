'use client';
import { useState, useEffect } from "react";
import BasicInformation from "./BasicInformation";
import Tables from "./Tables";
import DeleteRestaurant from "./DeleteRestaurant";

const getCookie = (name: string) => document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))?.at(2);

export default function Manage() {
    const [ restaurantInfoStatus, setRestaurantInfoStatus ] = useState("waiting");
    const [ restaurantInfo, setRestaurantInfo] = useState({
        name: "",
        address: "",
        isActive: false,
        openingTime: 0,
        closingTime: 0,
    });

    const [ tablesInfo, setTablesInfo] = useState([{
        number: 0,
        seats: 0
    }]);

    let restaurantID: string | null = null;

    function modifyRestaurantInfo(obj: object) {
        setRestaurantInfo({ ...Object.assign(restaurantInfo, obj) });
    }

    async function getRestaurantInfo() {
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GetRestaurantInfo";
        const body = JSON.stringify({ jwt: getCookie("jwt") })

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

            restaurantID = info.restaurantID;
        } else setRestaurantInfoStatus(result.error);
    }

    // grab restaurant info on load
    useEffect(() => { getRestaurantInfo(); }, []);

    return (
        <div id="content">
            { restaurantInfoStatus == "waiting" && 
                <div id="restaurant-details-placeholder">
                    <p>Waiting...</p>
                </div>
            }
            { (restaurantInfoStatus !== "waiting" && restaurantInfoStatus !== "success") && 
                <div id="restaurant-details-placeholder">
                    <h2>Oops!</h2>
                    <p>{restaurantInfoStatus}</p>
                    <button>Try Again</button>
                </div>
            }
            { restaurantInfoStatus == "success" &&
                <div id="restaurant-details">
                    <h1>Restaurant Details</h1>
                    <BasicInformation
                        restaurantInfo={restaurantInfo}
                        modifyRestaurantInfo={modifyRestaurantInfo} />
                    <Tables
                        isActive={restaurantInfo.isActive}
                        tablesInfo={tablesInfo}
                        propogateTablesInfo={setTablesInfo}/>
                    <DeleteRestaurant restaurantInfo={restaurantInfo}/>
                </div>
            }
        </div>
    );
}