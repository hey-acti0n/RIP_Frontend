import { combineReducers, configureStore } from "@reduxjs/toolkit"
import filtersReducer from "./slices/filtersSlice"

export default configureStore({
    reducer: combineReducers({
        filters: filtersReducer
    })
})

