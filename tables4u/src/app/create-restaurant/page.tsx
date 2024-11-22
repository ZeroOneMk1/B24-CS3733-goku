'use client';
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from "react";

export default function CreateRestaurant() {

    const router = useRouter();
    const [createStatus, setCreateStatus] = useState("");

    async function submit(event: FormEvent<HTMLFormElement>) {
        setCreateStatus("Waiting...");
        event.preventDefault();
        const createUrl = process.env.NEXT_PUBLIC_FUNCTION_URL + "/CreateRestaurant";
        const formData = new FormData(event.currentTarget);
        if(formData.get("password") === formData.get("confirm")) {
            let body = JSON.stringify({
                name: formData.get("name"), 
                address: formData.get("address"), 
                username: formData.get("username"), 
                password: formData.get("password")
            });

            const response = await fetch(createUrl, { method: "POST", body });
            const result = await response.json();
            if(result.statusCode === 200) {
                setCreateStatus("Creation successful, redirecting...");
                const loginUrl = process.env.NEXT_PUBLIC_FUNCTION_URL + "/LoginRestaurant";
                body = JSON.stringify({
                    username: formData.get("username"),
                    password: formData.get("password")
                });

                const loginResponse = await fetch(loginUrl, { method: "POST", body });
                const loginResult = await loginResponse.json();
                if(result.statusCode === 200) {
                    document.cookie = "jwt=" + loginResult.jwt
                    router.push('/manage-restaurant');
                } else {
                    router.push('/owner-login');
                }
            } else {
                setCreateStatus(result.error);
            }
        } else {
            setCreateStatus("Passwords do not match");
        }
    }

    return (
        <div id="create-restaurant-panel">
            <h1>Create a Restaurant</h1>
            <form onSubmit={submit} method="post">
                <div>
                    <div className="panel-input">
                        <label htmlFor="name">Restaurant Name:</label>
                        <input required type="text" name="name" placeholder="Restaurant Name" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="address">Address:</label>
                        <input required type="text" name="address" placeholder="Restaurant Address" />
                    </div>
                </div>
                <div>
                    <div className="panel-input">
                        <label htmlFor="username">Username:</label>
                        <input required type="text" name="username" placeholder="Username" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="password">Password:</label>
                        <input required type="text" name="password" placeholder="Password" />
                    </div>
                    <div className="panel-input">
                        <label htmlFor="confirm">Confirm Password:</label>
                        <input required type="text" name="confirm" placeholder="Confirm Password" />
                    </div>
                </div>
                <div>
                    <input type="submit" value="Create" />
                    <a href="/manage">I already have a restaurant</a>
                </div>
            </form>
            <p>{createStatus}</p>
        </div>
    );
}