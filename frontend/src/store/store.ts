import { combineReducers, configureStore } from "@reduxjs/toolkit"
import filtersReducer from "./slices/filtersSlice"
import userReducer from "./slices/userSlice"
import calculationsReducer from "./slices/calculationsSlice"

export const store = configureStore({
    reducer: combineReducers({
        filters: filtersReducer,
        user: userReducer,
        calculations: calculationsReducer
    })
})

export default store

