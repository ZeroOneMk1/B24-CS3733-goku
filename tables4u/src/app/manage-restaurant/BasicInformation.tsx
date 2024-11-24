import { FormEvent, useState } from "react";

export default function BasicInformation({
    restaurantInfo,
    modifyRestaurantInfo
}: {
    restaurantInfo: {
        name: string,
        address: string,
        isActive: boolean,
        openingTime: number,
        closingTime: number,
    }
    modifyRestaurantInfo: (obj: object) => void
}) {
    const [ editRestaurantStatus, setEditRestaurantStatus ] = useState(" ");
    const [ activateRestaurantStatus, setActivateRestaurantStatus ] = useState(" ");
    const activeLabel = restaurantInfo.isActive ? "active" : "inactive";

    async function editRestaurant(event: FormEvent<HTMLFormElement>) {
        setEditRestaurantStatus("Saving...");
        event.preventDefault();
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/EditRestaurant";
        const body = JSON.stringify({
            ...restaurantInfo,
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) setEditRestaurantStatus("Restaurant information saved.");
        else setEditRestaurantStatus(result.error);
    }

    async function activateRestaurant() {
        setActivateRestaurantStatus("Activating...");
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/ActivateRestaurant";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
        });

        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setActivateRestaurantStatus("Activated.");
            console.log(JSON.parse(result.body).restaurantInfo);
            modifyRestaurantInfo(JSON.parse(result.body).restaurantInfo);
            setTimeout(() => setActivateRestaurantStatus(" "), 2000);
        } else setActivateRestaurantStatus(result.error);
    }

    if (!restaurantInfo.isActive) {return (
        <div id="basic-information">
            <form onSubmit={editRestaurant}>
                <p>Restaurant is <strong>{activeLabel}</strong></p>
                <button disabled={activateRestaurantStatus == "Activating..."}
                    onClick={activateRestaurant}>Activate</button>
                <p>{activateRestaurantStatus}</p>
                <div className="input-group">
                    <label htmlFor="restaurant-name">Name:</label>
                    <input id="restaurant-name" type="text" value={restaurantInfo.name}
                        onChange={event => modifyRestaurantInfo({name: event.target.value})}/>
                </div>
                <div className="input-group">
                    <label htmlFor="restaurant-address">Address:</label>
                    <input id="restaurant-address" type="text" value={restaurantInfo.address}
                        onChange={event => modifyRestaurantInfo({address: event.target.value})}/>
                </div>
                <div className="input-group">
                    <label htmlFor="restaurant-opening-time">Opening Time:</label>
                    <input id="restaurant-opening-time" type="number" value={restaurantInfo.openingTime}
                        onChange={event => modifyRestaurantInfo({openingTime: event.target.value})}/>
                </div>
                <div className="input-group">
                    <label htmlFor="restaurant-closing-time">Closing Time:</label>
                    <input id="restaurant-closing-time" type="number" value={restaurantInfo.closingTime}
                        onChange={event => modifyRestaurantInfo({closingTime: event.target.value})}/>
                </div>
                <p>{editRestaurantStatus}</p>
                <input type="submit" value="Save Information" />
            </form>
        </div>
    )} else {return(
        <div id="basic-information">
            <p>Restaurant is <strong>{activeLabel}</strong></p>
            <p>Name: {restaurantInfo.name}</p>
            <p>Address: {restaurantInfo.address}</p>
            <p>Opening Time: {restaurantInfo.openingTime}</p>
            <p>Closing Time: {restaurantInfo.closingTime}</p>
        </div>
    )}
}