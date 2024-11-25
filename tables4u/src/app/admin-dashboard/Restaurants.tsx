import { FormEvent, useState, useEffect } from "react";
import DeleteRestaurant from '../manage-restaurant/DeleteRestaurant';

export default function Restaurants({
  restaurantsInfo
}: {
    restaurantsInfo: {
        restaurantID: String,
        name: String,
        address: String,
        isActive: boolean,
        openingTime: number,
        closingTime: number
    }[],
}) {
    return (
        <div id="restaurant-list">
            {restaurantsInfo.map((restaurant, index) => (
                <Restaurant key={index} restaurantInfo={restaurant}/>
            ))}
        </div>
    )
}

function Restaurant({
    restaurantInfo,
}: {
    restaurantInfo: {
        restaurantID: String,
        name: String,
        address: String,
        isActive: boolean,
        openingTime: number,
        closingTime: number
    }
}) {

    const [deleteStatus, setDeleteStatus ] = useState("");

    async function deleteRestaurant() {
        if (!window.confirm(`Are you sure you want to delete ${restaurantInfo.name}?\n
            This action cannot be undone.`)) return;
        setDeleteStatus("Deleting...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/DeleteRestaurant";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
            restaurantID: restaurantInfo.restaurantID
        });
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            window.location.reload();
        } else {
            setDeleteStatus(result.error)
        }
    }

    function timeDisplay(time:number) {
        if(time == undefined) {
            return "00:00";
        } else if(time < 10) {
            return "0" + time + ":00";
        }
        return time + ":00";
    }

    return(
        <div className="restaurant">
            <p>{restaurantInfo.name}</p>
            <p>{restaurantInfo.address}</p>
            <p>{restaurantInfo.isActive == true ? "Active" : "Inactive"}</p>
            <p>Opens: {timeDisplay(restaurantInfo.openingTime)}</p>
            <p>Closes: {timeDisplay(restaurantInfo.closingTime)}</p>
            <button className="delete-restaurant-button" onClick={deleteRestaurant}>Delete Restaurant</button>
            <p>{deleteStatus}</p>
        </div>
    );
}