import { createContext } from "react";

export type RestaurantInfo = {
    name: string
    address: string
    isActive: boolean
    openingTime: number
    closingTime: number
};

export type TablesInfo = {
    number: number
    seats: number
}[];

// this code is effectively meaningless & is primarily to make the TS compiler happy
// the purpose is to allow distant children to read & write restaurantInfo and tablesInfo
export const RestaurantInfoContext = createContext<{
    restaurantInfo: RestaurantInfo
    setRestaurantInfo: (r: RestaurantInfo) => void
}>({restaurantInfo: {} as RestaurantInfo, setRestaurantInfo: () => {}});

export const TablesInfoContext = createContext<{
    tablesInfo: TablesInfo
    setTablesInfo: (r: TablesInfo) => void
}>({tablesInfo: {} as TablesInfo, setTablesInfo: () => {}});