import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import { GraphData, PositionedGraphNode } from '../types/graph';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

interface D3GraphProps {
  data: GraphData;
  width?: number | string;
  height?: number | string;
}

const D3Graph: React.FC<D3GraphProps> = ({ 
  data, 
  width = 800, 
  height = 600 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR' | 'BT' | 'RL'>('LR');

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    
    // Create main group for zoom/pan transformations
    const svgGroup = svg.append("g");

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        setTransform({ x, y, k });
        svgGroup.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create Dagre graph for layout
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({
      rankdir: layoutDirection, // Layout direction
      nodesep: 50,   // Horizontal separation between nodes
      ranksep: 80,   // Vertical separation between ranks
      marginx: 20,
      marginy: 20
    });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Add nodes to Dagre graph
    data.nodes.forEach(node => {
      dagreGraph.setNode(node.id, { 
        width: NODE_WIDTH, 
        height: NODE_HEIGHT,
        label: node.name 
      });
    });

    // Add edges to Dagre graph
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      dagreGraph.setEdge(sourceId, targetId);
    });

    // Calculate layout
    dagre.layout(dagreGraph);

    // Apply Dagre positions to nodes
    const layoutNodes: PositionedGraphNode[] = data.nodes.map(node => {
      const dagreNode = dagreGraph.node(node.id);
      return {
        ...node,
        x: dagreNode?.x || 0,
        y: dagreNode?.y || 0
      };
    });

    // Create color scale for different groups
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create links with calculated positions
    const link = svgGroup.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(data.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value) * 2)
      .attr("x1", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const targetNode = layoutNodes.find(n => n.id === targetId);

        const sourceX = (sourceNode?.x || 0);
        const targetX = (targetNode?.x || 0)


        if (sourceX < targetX) {
          return sourceX + NODE_WIDTH / 2;
        }

        return sourceX - NODE_WIDTH / 2;
      })
      .attr("y1", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        return (sourceNode?.y || 0);
      })
      .attr("x2", (d) => {
         const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const targetNode = layoutNodes.find(n => n.id === targetId);

        const sourceX = (sourceNode?.x || 0);
        const targetX = (targetNode?.x || 0)


        if (sourceX < targetX) {
          return targetX - NODE_WIDTH / 2;
        }

        return targetX + NODE_WIDTH / 2;
      })
      .attr("y2", (d) => {
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const targetNode = layoutNodes.find(n => n.id === targetId);
        return targetNode?.y || 0;
      });

    // Create nodes with calculated positions
    const node = svgGroup.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(layoutNodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .call(d3.drag<SVGGElement, PositionedGraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add circles to nodes
    // node.append("circle")
    //   .attr("r", 20)
    node.append("rect")
      .attr("x", -(NODE_WIDTH / 2))
      .attr("y", -(NODE_HEIGHT / 2))
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      // .attr("fill", (d) => 'transparent')
      .attr("fill", (d) => color(d.group.toString()))
      .attr("stroke", (d) => color(d.group.toString()))
      // .attr("stroke", "#000")
      .attr("stroke-width", 2);

    // Add labels to nodes
    node.append("text")
      .text((d) => d.name)
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "1em")
      .attr("font-weight", "bold")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#fff")
      .attr("pointer-events", "none");

    // Add tooltips
    node.append("title")
      .text((d) => `${d.name} (Group ${d.group})`);

    // Drag functions for repositioning nodes
    function dragstarted(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      d3.select(event.sourceEvent.target.parentNode).raise();
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const nodeGroup = d3.select(event.sourceEvent.target.parentNode);
      nodeGroup.attr("transform", `translate(${event.x},${event.y})`);
      
      // Update node position
      d.x = event.x;
      d.y = event.y;
      
      // Update connected links
      link.each(function(linkData) {
        const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
        const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const targetNode = layoutNodes.find(n => n.id === targetId);

        const sourceX = (sourceNode?.x || 0);
        const targetX = (targetNode?.x || 0)

        
        if (sourceId === d.id) {
          const x = sourceX < targetX ? sourceX + NODE_WIDTH / 2 : sourceX - NODE_WIDTH / 2;
          d3.select(this).attr("x1", x).attr("y1", d.y);
        }
        if (targetId === d.id) {
          const x = sourceX < targetX ? targetX - NODE_WIDTH / 2 : targetX + NODE_WIDTH / 2;
          d3.select(this).attr("x2", x).attr("y2", d.y);
        }
      });
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      // Optional: Add any cleanup logic here
    }

    // No cleanup needed for static layout
    return () => {};
  }, [data, width, height, layoutDirection]);

  const resetZoom = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
  };

  return (
    <div className="graph-container">
      <div className="graph-controls">
        <div className="control-group">
          <button onClick={resetZoom} className="reset-button">
            Reset Zoom
          </button>
          <div className="layout-controls">
            <label htmlFor="layout-select">Layout:</label>
            <select 
              id="layout-select"
              value={layoutDirection} 
              onChange={(e) => setLayoutDirection(e.target.value as 'TB' | 'LR' | 'BT' | 'RL')}
              className="layout-select"
            >
              <option value="TB">Top → Bottom</option>
              <option value="LR">Left → Right</option>
              <option value="BT">Bottom → Top</option>
              <option value="RL">Right → Left</option>
            </select>
          </div>
        </div>
        <div className="zoom-info">
          Zoom: {transform.k.toFixed(2)}x | 
          Pan: ({transform.x.toFixed(0)}, {transform.y.toFixed(0)})
        </div>
      </div>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #ccc', cursor: 'grab' }}
      />
    </div>
  );
};

export default D3Graph;
