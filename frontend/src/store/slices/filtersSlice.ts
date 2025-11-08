import { createSlice } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import type { MaterialFiltersForm } from "../../types/api";

const filtersSlice = createSlice({
    name: "filters",
    initialState: {
        Filters: {
            name: '',
            material: '',
            thicknessMin: '',
            thicknessMax: '',
            densityMin: '',
            densityMax: ''
        } as MaterialFiltersForm
    },
    reducers: {
        setFilters(state, {payload}) {
            state.Filters = payload
        },
        updateFilter(state, {payload}) {
            state.Filters = {
                ...state.Filters,
                ...payload
            }
        },
        resetFilters(state) {
            state.Filters = {
                name: '',
                material: '',
                thicknessMin: '',
                thicknessMax: '',
                densityMin: '',
                densityMax: ''
            }
        }
    }
})

export const useFilters = () =>
    useSelector((state: { filters: { Filters: MaterialFiltersForm } }) => state.filters.Filters)

export const {
    setFilters: setFiltersAction,
    updateFilter: updateFilterAction,
    resetFilters: resetFiltersAction
} = filtersSlice.actions

export default filtersSlice.reducer

