import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import UserEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

// Mock useRouter:
vi.mock("next/navigation", () => ({
    useRouter() {
        return {
            push: () => null
        };
    }
}));

function createDelayedFetchResponse(data: object) {
    return { json: () => new Promise((resolve) => {
        setTimeout(() => {resolve(data)}, 500);
    }) }
}

describe("Test administrator login form", async () => {
    afterEach(cleanup);

    // test("Username must be entered", async () => {
    //     global.fetch = vi.fn().mockResolvedValue(
    //         createDelayedFetchResponse({ statusCode: 200, jwt: "testJWT" }));
        
    //     // fill out login form and submit
    //     render(<LoginForm type="admin"></LoginForm>);
    //     await UserEvent.type(await screen.findByLabelText("Username:"), "testUsername");
    //     await UserEvent.click(await screen.findByText("Log in"));

    //     expect(screen.queryByText("tables4u")).toBeNull();
        
    //     // make sure the request wasn't sent
    //     expect(fetch).not.toBeCalled();
    // });

    test("Valid credentials result in success message", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            createDelayedFetchResponse({ statusCode: 200, jwt: "testJWT" }));
        
        // fill out login form and submit
        render(<LoginForm type="admin"></LoginForm>);
        await UserEvent.type(await screen.findByLabelText("Username:"), "testUsername");
        await UserEvent.type(await screen.findByLabelText("Password:"), "testPassword");
        await UserEvent.click(await screen.findByText("Log in"));

        expect(screen.getByText("Waiting...")).toBeDefined();
        
        // determine that request was sent to the right place with a valid payload
        expect(fetch).toBeCalled();
        expect(await screen.findByText("Login successful, redirecting...")).toBeDefined();
        expect((fetch as any).mock.calls[0][0]).toContain("/LoginAdministrator");
        expect((fetch as any).mock.calls[0][1].body).toBe(JSON.stringify({
            username: "testUsername",
            password: "testPassword"
        }));
    });

    test("Invalid credentials result in an error message", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            createDelayedFetchResponse({ statusCode: 400, error: "testError" }));
        
        // fill out login form and submit
        render(<LoginForm type="admin"></LoginForm>);
        await UserEvent.type(await screen.findByLabelText("Username:"), "testUsername");
        await UserEvent.type(await screen.findByLabelText("Password:"), "testPassword");
        await UserEvent.click(await screen.findByText("Log in"));

        expect(screen.getByText("Waiting...")).toBeDefined();
        
        // determine that request was sent to the right place with a valid payload
        expect(fetch).toBeCalled();
        expect(await screen.findByText("testError")).toBeDefined();
    });
});