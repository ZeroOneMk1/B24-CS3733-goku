import { FormEvent, useState, useContext } from "react";
import styles from './BasicInformation.module.css';

import { RestaurantInfoContext } from "./contexts";

export default function BasicInformation() {
    const { restaurantInfo, setRestaurantInfo } = useContext(RestaurantInfoContext);

    const [ editRestaurantStatus, setEditRestaurantStatus ] = useState(" ");
    const [ activateRestaurantStatus, setActivateRestaurantStatus ] = useState(" ");
    const activeLabel = restaurantInfo.isActive ? "active" : "inactive";

    function modifyRestaurantInfo(obj: object) {
        setRestaurantInfo({ ...Object.assign(restaurantInfo, obj) });
    }

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
        <div id={styles.basicInformation}>
            <h2>Basic Information</h2>
            <form onSubmit={editRestaurant}>
                <div>
                    <div className={styles.inputGroup}>
                        <p>Restaurant is <strong>{activeLabel}</strong></p>
                        <button className="small" disabled={activateRestaurantStatus == "Activating..."}
                            onClick={activateRestaurant}>Activate</button>
                    </div>
                    <p>{activateRestaurantStatus}</p>
                 </div>
                <div className={styles.inputGroup}>
                    <label id={styles.nameLabel} htmlFor="restaurant-name">Name:</label>
                    <input id="restaurant-name" type="text" value={restaurantInfo.name}
                        onChange={event => modifyRestaurantInfo({name: event.target.value})}/>
                </div>
                <div className={styles.inputGroup}>
                    <label id={styles.addressLabel} htmlFor="restaurant-address">Address:</label>
                    <input id="restaurant-address" type="text" value={restaurantInfo.address}
                        onChange={event => modifyRestaurantInfo({address: event.target.value})}/>
                </div>
                <div className={styles.inputGroup}>
                    <label id={styles.scheduleLabel} htmlFor="restaurant-opening-time">Schedule:</label>
                    <input id="restaurant-opening-time" type="number" value={restaurantInfo.openingTime}
                        min="0" max="24"
                        onChange={event => modifyRestaurantInfo({openingTime: event.target.value})}/>
                    <p>to</p>
                    <input id="restaurant-closing-time" type="number" value={restaurantInfo.closingTime}
                        min="0" max="24"
                        onChange={event => modifyRestaurantInfo({closingTime: event.target.value})}/>
                </div>
                <input type="submit" value="Save Information" />
                <p id={styles.editStatus} >{editRestaurantStatus}</p>
            </form>
        </div>
    )} else {return(
        <div id={styles.basicInformationActive} >
            <h2>Basic Information</h2>
            <p>{restaurantInfo.name}</p>
            <p>{restaurantInfo.address}</p>
            <p>Open <strong>{restaurantInfo.openingTime}</strong> to <strong>{restaurantInfo.closingTime}</strong></p>
        </div>
    )}
}