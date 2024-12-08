import { useEffect, useState } from "react";

import styles from "./AvailabilityReport.module.css";


export default function AvailabilityReport({restaurantID}: {restaurantID?: string}) {
    
    const [generateStatus, setGenerateStatus] = useState("success");

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${(date.getDay()+1).toString().padStart(2, "0")}`;
    });

    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${(date.getDay()+1).toString().padStart(2, "0")}`;
    });

    function generateAvailabityReport() {
        //ADD THIS
    }
    
    return (
         <div id={styles.reviewAvailaibity}>
            <div id={styles.availabilityHeader}>
                <h1>Generate Availability Report</h1>
            </div>
            <div id={styles.dateForm}>
                <form onSubmit={generateAvailabityReport}>
                    <label htmlFor="startDate">Starting day: </label>
                    <input type="date" name="startDate" id="startDate"
                        required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <label htmlFor="endDate">Ending day (inclusive): </label>
                    <input type="date" name="endDate" id="endDate"
                        required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="submit" value={generateStatus == "waiting" ? "Loading..." : "Generate"} />
                </form>
                {generateStatus !== "waiting" && generateStatus !== "success" &&
                    <p>Error: {generateStatus}</p>}
            </div>
        </div>
    )
}