import { useState } from "react";

export default function Manage() {
    const [ restaurantInfo, setRestaurantInfo] = useState({
        name: "Chashu Ramen + Izakaya",
        address: "271 Main St.",
        isActive: false,
        openingTime: 13,
        closingTime: 22,
    });
    return (
        <div id="restaurant-details">
            <h1>Restaurant Details</h1>
            <div id="basic-information">
                <p>Restaurant is <em>{restaurantInfo.isActive ? "active" : "inactive"}</em></p>
                <button>Activate</button>
                <p>Name: {restaurantInfo.name}</p>
                <p>Address: {restaurantInfo.address}</p>
                <p>Opening time: {restaurantInfo.openingTime}</p>
                <p>Closing time: {restaurantInfo.closingTime}</p>
            </div>
        </div>
    );
}