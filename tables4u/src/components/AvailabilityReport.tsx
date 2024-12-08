import { useEffect, useState } from "react";

import styles from "./AvailabilityReport.module.css";


export default function AvailabilityReport({restaurantID}: {restaurantID?: string}) {
    
    const [generateStatus, setGenerateStatus] = useState("success");

    const [report, setReport] = useState([]);

    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${(date.getDay()+1).toString().padStart(2, "0")}`;
    });

    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, "0")}-${(date.getDay()+1).toString().padStart(2, "0")}`;
    });

    //format date
    function formatDate(inputDate: string) {
        const [year, month, day] = inputDate.split('-');
        return `${month}-${day}-${year}`;
    }

    async function generateAvailabityReport(event?: React.FormEvent<HTMLFormElement>) {
        setGenerateStatus("waiting");
        if (event) event.preventDefault();

        // form request body
        const url = process.env.NEXT_PUBLIC_FUNCTION_URL + "/GenerateAvailabilityReport";
        const body = JSON.stringify({
            jwt: document.cookie.match(new RegExp(`(^| )jwt=([^;]+)`))?.at(2),
            startDay: formatDate(startDate),
            endDay: formatDate(endDate),
            restaurantID: restaurantID
        });

        // send request
        const response = await fetch(url, { method: "POST", body });
        const result = await response.json();

        if (result.statusCode == 200) {
            setGenerateStatus("success");
            setReport(result.report);
        } else setGenerateStatus(result.error);
    }

    function Report({report}: {report?: any}) {
        if(report == undefined || report.length == 0) {
            return (<div id={styles.report}></div>);
        }

        return (
            <div id={styles.report}>
                <div id={styles.gridContainer}>
                    <div id={styles.grid} style={{
                        gridTemplateRows: `repeat(${2}, 1fr)`,
                        gridTemplateColumns: `repeat(${report.length + 1}, 1fr)`
                    }}>
                        <div>
                            <p>Date: </p>
                            <p>Utilization: </p>
                            <p>Availability: </p>
                        </div>
                        { report.map((reportInfo: any) => (
                        <div>
                            <p>{reportInfo.date}</p>
                            <p>{reportInfo.utilization * 100.0}%</p>
                            <p>{reportInfo.availability * 100.0}%</p>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    
    return (
         <div id={styles.reviewAvailability}>
            <div id={styles.availabilityHeader}>
                <div>
                    <h1>Generate Availability Report</h1>
                </div>
            <div>
                <form onSubmit={generateAvailabityReport}>
                    <label htmlFor="startDate">Starting day: </label>
                    <input type="date" name="startDate" id="startDate"
                        required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    <label htmlFor="endDate">Ending day (inclusive): </label>
                    <input type="date" name="endDate" id="endDate"
                        required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    <input type="submit" value={generateStatus == "waiting" ? "Loading..." : "Generate"} />
                </form>
            </div>
                {generateStatus !== "waiting" && generateStatus !== "success" &&
                    <p>Error: {generateStatus}</p>}
            </div>
            <Report report={report} />
        </div>
    )
}