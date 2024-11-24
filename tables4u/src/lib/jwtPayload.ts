export type JwtPayload = {
    username: string,
    isAdmin: true,
    iat: number,
    exp: number
} | {
    username: string,
    isAdmin: false,
    restaurantID: string,
    iat: number,
    exp: number
}