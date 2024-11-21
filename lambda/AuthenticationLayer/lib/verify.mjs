import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import jwt from 'jsonwebtoken';

/**
 * Verifies a JSON Web Token (JWT) and returns the decoded information. Returns an error
 * if unable to retrieve verification secret or if the JWT is invalid.
 * @param {string} token 
 * @returns an object of format `{ decoded, error }`
 */
export async function verify(token) {
    // retrieve jwt secret
    let jwtSecretRequest;

    const client = new SecretsManagerClient({
        region: "us-east-1",
    });
    try {
        jwtSecretRequest = await client.send(
            new GetSecretValueCommand({
                SecretId: "tables4u/jwt",
                VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
            })
        );
    } catch (error) {
        return {
            error: "Unable to retrieve verification secret"
        };
    }

    const secret = JSON.parse(jwtSecretRequest.SecretString).secret;

    // verify jwt
    let decoded;
    try {
        decoded = jwt.verify(token, secret);
    } catch (error) {
        return {
            error: "Authentication token is invalid"
        };
    }

    // jwt is valid, return information
    return { decoded };
}