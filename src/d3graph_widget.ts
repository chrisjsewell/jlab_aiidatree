import { Widget } from '@lumino/widgets';
import * as d3 from "d3";


export class D3GraphWidget extends Widget {
    constructor(id: string, label: string) {
        super()
        this.id = id;
        this.title.label = label
        this.title.closable = true
        this.addClass("aiidatree-d3graph")
    }

    render(nodes_data: any[], links_data: any[], root: number) {
        // nodes_data is NodeLink interface with 'name' field equal to pk
        // links_data is NodeLink interface with 'source'/'target' field equal to pk
        // root is root pk

        const width = 500
        const height = 500

        //create the SVG, within which to put the force directed graph
        let svg = d3.select(this.node).append("div").classed("d3-svg-container", true).append('svg')
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .classed("d3-svg-content-responsive", true)
            .attr("width", width)
            .attr("height", height);

        //set up the simulation and add nodes
        var simulation = d3.forceSimulation().nodes(nodes_data);

        //add forces; a charge to each node, and a centring force
        simulation
            .force("charge_force", d3.forceManyBody())
            .force("center_force", d3.forceCenter(width / 2, height / 2));

        // Create the link force 
        // We need the id accessor to use named sources and targets 
        var link_force = d3.forceLink(links_data)
            .distance(width / 10)
            .id(function (d: any) { return d.name; })

        //Add a links force to the simulation
        //Specify links  in d3.forceLink argument   
        simulation.force("links", link_force)

        // draw links, nodes and labels in correct z-index order

        // draw lines for the links 
        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links_data)
            .enter().append("line")
            .attr("stroke-width", 2)
            .attr("stroke", function (d: any) { return d.direction === "incoming" ? "green" : "blue"; });

        // draw circles for the nodes
        // attr accepts a static value or a function which passes the node dict (plus index/positional data)
        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes_data)
            .enter()
            .append("circle")
            .attr("r", 7)
            .attr("fill", function (d) { return d.name === root ? "red" : "orange" });

        // Draw node labels
        var label = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes_data)
            .enter().append("text")
            // .attr("dx", 12)
            // .attr("dy", ".35em")
            .text(function (d) { return d.name });

        // add tick instructions: 
        simulation.on("tick", tickActions);

        function tickActions() {
            //update circle positions each tick of the simulation 
            node
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
            label
                .attr("x", function (d) { return d.x; })
                .attr("y", function (d) { return d.y; });

            //update link positions 
            //simply tells one end of the line to follow one node around
            //and the other end of the line to follow the other node around
            link
                .attr("x1", function (d: any) { return d.source.x; })
                .attr("y1", function (d: any) { return d.source.y; })
                .attr("x2", function (d: any) { return d.target.x; })
                .attr("y2", function (d: any) { return d.target.y; });
        }

    }
}
