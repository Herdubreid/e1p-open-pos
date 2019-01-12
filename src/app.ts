import './css/style.scss';
import 'jquery';
import * as ko from 'knockout';
import { IState, initState } from './state';
import './components';

const storageKey = 'io-celin-e1p-open-pos';

/**
 * App
 */

 class ViewModel {
    constructor(public state: IState) { }
}

// Storage Read
const state = JSON.parse(sessionStorage.getItem(storageKey) || '{}') || initState;

if (false) { // use demo data
    const response = require('../docs/sample.json');
    let total = 0;
    const rows = response.ds_F4311.output.map((r: any) => {
        total += Math.round(r['F4311.AOPN_SUM']/100)/1000;
        return {
            count: r.COUNT,
            total,
            date: r.groupBy['F4311.DRQJ']
        };
    });
    state.rows = rows;
    state.timeStamp = Date.now();
}

const viewModel = new ViewModel(state);

ko.applyBindings(viewModel);

// Storage Save
window.onbeforeunload = () => 
    sessionStorage.setItem(storageKey, JSON.stringify(viewModel.state));
