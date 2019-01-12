// App State

export interface IRow {
    count: number,
    total: number,
    date: Date
}

export interface IState {
    timeStamp: number;
    rows: IRow[];
}

// State Params
export interface IStateParams {
    state: IState;
}

export const initState: IState = {
    timeStamp: 8,
    rows: [],
};
