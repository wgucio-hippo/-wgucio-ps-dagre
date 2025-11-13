import React, { useEffect, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import { GraphData, PositionedGraphNode } from '../types/graph';
import GraphNode from './GraphNode';

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
  const reactRootsRef = useRef<Map<string, Root>>(new Map());

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Capture current roots for cleanup
    const currentRoots = reactRootsRef.current;

    // Clean up previous React roots
    currentRoots.forEach(root => root.unmount());
    currentRoots.clear();

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
    data.edges.forEach(link => {
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

    // Pre-calculate stable edge connection sides based on initial layout
    const edgeConnections = data.edges.map(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const sourceNode = layoutNodes.find(n => n.id === sourceId);
      const targetNode = layoutNodes.find(n => n.id === targetId);
      
      const sourceX = sourceNode?.x || 0;
      const targetX = targetNode?.x || 0;
      
      return {
        ...edge,
        sourceConnectionSide: sourceX < targetX ? 'right' : 'left',
        targetConnectionSide: sourceX < targetX ? 'left' : 'right'
      };
    });

    // Create links with calculated positions
    const link = svgGroup.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(edgeConnections)
      .enter().append("line")
      .attr("stroke", (d) => d.access.toLowerCase() === 'allow' ? 'blue' : 'red')
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 2)
      .attr("x1", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const sourceX = (sourceNode?.x || 0);

        return d.sourceConnectionSide === 'right' 
          ? sourceX + NODE_WIDTH / 2 
          : sourceX - NODE_WIDTH / 2;
      })
      .attr("y1", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        return (sourceNode?.y || 0);
      })
      .attr("x2", (d) => {
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const targetNode = layoutNodes.find(n => n.id === targetId);
        const targetX = (targetNode?.x || 0);

        return d.targetConnectionSide === 'right' 
          ? targetX + NODE_WIDTH / 2 
          : targetX - NODE_WIDTH / 2;
      })
      .attr("y2", (d) => {
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const targetNode = layoutNodes.find(n => n.id === targetId);
        return targetNode?.y || 0;
      });

    // Create nodes with React components using foreignObject
    const node = svgGroup.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(layoutNodes)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x - NODE_WIDTH/2},${d.y - NODE_HEIGHT/2})`)
      .call(d3.drag<SVGGElement, PositionedGraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
      );

    // Add a transparent rect for drag interaction
    node.append("rect")
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", "transparent")
      .style("cursor", "grab");

    // Add foreignObject to contain React components
    const foreignObject = node.append("foreignObject")
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("x", 0)
      .attr("y", 0)
      .style("pointer-events", "none");

    // Create React components inside foreignObject
    foreignObject.each(function(d) {
      const container = d3.select(this).append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .node() as HTMLDivElement;

      if (container) {
        const root = createRoot(container);
        reactRootsRef.current.set(d.id, root);
        
        root.render(
          <GraphNode 
            node={d} 
            width={NODE_WIDTH} 
            height={NODE_HEIGHT} 
            color={color(d.group.toString())}
          />
        );
      }
    });

    // Drag functions for repositioning nodes
    function dragstarted(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const nodeGroup = d3.select(event.sourceEvent.target.parentNode);
      nodeGroup.raise();
      // Change cursor to grabbing during drag
      nodeGroup.select("rect").style("cursor", "grabbing");
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const nodeGroup = d3.select(event.sourceEvent.target.parentNode);
      
      // event.x and event.y are already in the correct coordinate system (svgGroup's coordinate space)
      // since the drag behavior is applied to elements within the transformed svgGroup
      // Adjust for the fact that our transform positions the top-left corner, but we want center-based positioning
      nodeGroup.attr("transform", `translate(${event.x - NODE_WIDTH/2},${event.y - NODE_HEIGHT/2})`);
      
      // Update node position in both the data object and the layoutNodes array
      d.x = event.x;
      d.y = event.y;
      
      // Also update the position in layoutNodes array for consistency
      const layoutNode = layoutNodes.find(n => n.id === d.id);
      if (layoutNode) {
        layoutNode.x = event.x;
        layoutNode.y = event.y;
      }
      
      // Update connected links
      link.each(function(linkData) {
        const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
        const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
        
        // Get current positions - use dragged position for the current node, layoutNodes for others
        const sourceX = sourceId === d.id ? event.x : (layoutNodes.find(n => n.id === sourceId)?.x || 0);
        const sourceY = sourceId === d.id ? event.y : (layoutNodes.find(n => n.id === sourceId)?.y || 0);
        const targetX = targetId === d.id ? event.x : (layoutNodes.find(n => n.id === targetId)?.x || 0);
        const targetY = targetId === d.id ? event.y : (layoutNodes.find(n => n.id === targetId)?.y || 0);

        // Update link positions using stable connection sides
        if (sourceId === d.id) {
          const x = linkData.sourceConnectionSide === 'right' 
            ? sourceX + NODE_WIDTH / 2 
            : sourceX - NODE_WIDTH / 2;
          d3.select(this).attr("x1", x).attr("y1", sourceY);
        }
        if (targetId === d.id) {
          const x = linkData.targetConnectionSide === 'right' 
            ? targetX + NODE_WIDTH / 2 
            : targetX - NODE_WIDTH / 2;
          d3.select(this).attr("x2", x).attr("y2", targetY);
        }
      });
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const nodeGroup = d3.select(event.sourceEvent.target.parentNode);
      // Restore cursor to grab
      nodeGroup.select("rect").style("cursor", "grab");
    }

    // Cleanup function
    return () => {
      currentRoots.forEach(root => root.unmount());
      currentRoots.clear();
    };
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
