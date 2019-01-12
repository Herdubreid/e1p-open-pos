// AB Search Component
import './style.scss';
import * as ko from 'knockout';
import * as d3 from 'd3';
import { IStateParams, IRow } from '../../state';

class ViewModel {
    $busy = ko.observable(false);
    $elapsed: KnockoutObservable<string>;
    x: d3.ScaleTime<number, number>;
    yTotal: d3.ScaleLinear<number, number>;
    yCount: d3.ScaleLinear<number, number>;
    line: d3.Line<IRow>;
    svg: d3.Selection<SVGGElement, IRow, HTMLElement, any>;
    formatTime(msec: number): string {
        const hours = Math.round(msec / 3600000);
        const mins = Math.round(msec % 3600000 / 60000);
        return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins}`;
    }
    refreshClick() {
        this.$busy(true);
        const rq = {
            dataServiceType: 'AGGREGATION',
            targetName: 'F4311',
            targetType: 'table',
            aliasNaming: false,
            maxPageSize: '1000',
            findOnEntry: 'TRUE',
            outputType: 'GRID_DATA',
            aggregation: {
                aggregations: [
                    {
                        aggregation: 'COUNT',
                        column: '*'
                    },
                    {
                        aggregation: 'SUM',
                        column: 'F4311.AOPN'
                    }
                ],
                groupBy: [
                    {
                        column: 'F4311.DRQJ'
                    }
                ],
                orderBy: [
                    {
                        column: 'F4311.DRQJ',
                        direction: 'ASC'
                    }
                ]
            },
            query: {
                condition: [
                    {
                        value: [
                            {
                                content: '400',
                                specialValueId: 'LITERAL'
                            }
                        ],
                        controlId: 'F4311.NXTR',
                        operator: 'EQUAL'
                    },
                    {
                        value: [
                            {
                                content: '0',
                                specialValueId: 'LITERAL'
                            }
                        ],
                        controlId: 'F4311.UOPN',
                        operator: 'NOT_EQUAL'
                    }
                ],
                matchType: 'MATCH_ALL',
            }
        };
        callAISService(rq, DATA_SERVICE, (response: any) => {
            let total = 0;
            const rows = response.ds_F4311.output.map((r: any) => {
                total += Math.round(r['F4311.AOPN_SUM'] / 100) / 1000;
                return {
                    count: r.COUNT,
                    total,
                    date: r.groupBy['F4311.DRQJ']
                };
            });
            if (this.params.state.rows) {
                this.redraw(rows);
            } else {
                this.draw(rows);
            }
            this.params.state.rows = rows;
            this.params.state.timeStamp = Date.now();
            this.$elapsed('00:00');
            this.$busy(false);
        });
    }
    draw(data: IRow[]) {
        // Dimensions
        const margin = { top: 30, right: 100, bottom: 60, left: 30 };
        const width = 900 - margin.left - margin.right;
        const height = 700 - margin.top - margin.bottom;

        // Scales
        this.x = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);
        this.yTotal = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total)])
            .range([height, 0]);
        this.yCount = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([height, 0]);

        // Define the line
        this.line = d3.line<IRow>()
            .defined(d => !isNaN(d.total))
            .x(d => this.x(d.date))
            .y(d => this.yTotal(d.total))
            .curve(d3.curveStepAfter);

        // Canvas
        this.svg = d3.select<d3.BaseType, IRow>('#chart')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        // Add the line
        this.svg.append('path')
            .attr('class', 'line')
            .attr('d', this.line(data));
        // Add the scatter plot
        this.svg.selectAll('.dot')
            .data(data)
            .enter().append('circle')
                .attr('class', 'dot')
                .attr('r', 3.5)
                .attr('cx', d => this.x(d.date))
                .attr('cy', d => this.yCount(d.count));
        // Add the axis
        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(this.x));
        this.svg.append('g')
            .attr('class', 'y total axis')
            .attr('transform', `translate(${width},0)`)
            .call(d3.axisRight(this.yTotal));
        this.svg.append('g')
            .attr('class', 'y count axis')
            .call(d3.axisLeft(this.yCount));
    }
    redraw(data: IRow[]) {
        // Reset the scales
        this.x.domain(d3.extent(data, d => d.date));
        this.yTotal.domain([0, d3.max(data, d => d.total)]);
        this.yCount.domain([0, d3.max(data, d => d.count)]);

        // Apply the change
        const duration = 750;
        const trans = this.svg.transition();
        trans.select('.line')
            .duration(duration)
            .attr('d', this.line(data));
        trans.select('.x.axis')
            .duration(duration)
            .call(d3.axisBottom(this.x) as any);
        trans.select('.y.total.axis')
            .duration(duration)
            .call(d3.axisRight(this.yTotal) as any);

        // Scatter plot
        trans.select('.y.count.axis')
            .duration(duration)
            .call(d3.axisLeft(this.yCount) as any);
        // Remove old plot
        this.svg.selectAll('.dot')
            .remove();
        // Add new one
        this.svg.selectAll('.dot')
            .data(data)
            .enter().append('circle')
                .attr('class', 'dot')
                .attr('r', 3.5)
                .attr('cx', d => this.x(d.date))
                .attr('cy', d => this.yCount(d.count));
    }
    constructor(public params: IStateParams) {
        this.$elapsed = ko.observable(this.formatTime(Date.now() - params.state.timeStamp));
        setInterval(() => this.$elapsed(this.formatTime(Date.now() - params.state.timeStamp)), 60000);
        if (params.state.rows) {
            this.draw(params.state.rows);
        }
        else {
            this.refreshClick();
        }
    }
}

ko.components.register('open-pos', {
    viewModel: ViewModel,
    template: require('./template.html')
});
