import React from "react";

type InitStore = {
    name: string;
    year: number;
}
type Action = {
    type: string;
    [key: string]: any;

}
export const Context = React.createContext(null)
export const initStore:InitStore = {
    name: 'phxxhp',
    year: 27,
}
export const initReducer = (state: InitStore, action: Action) => {
    const { type } = action
    switch (type) {
        case 'add': {
            state.year += 1;
            break;
        }
        default:
            break;
    }
    return state;
}