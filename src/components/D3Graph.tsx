import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createRoot, Root } from 'react-dom/client';
import * as d3 from 'd3';
import * as dagre from 'dagre';
import { GraphData, PositionedGraphNode } from '../types/graph';
import GraphNode from './GraphNode';
import { generateOptimizedCurve, bezierCurveToPath, Point } from '../utils/edgeUtils';
import './D3Graph.css';

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactRootsRef = useRef<Map<string, Root>>(new Map());

  // Node click handler
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(prevSelected => {
      // If clicking the same node that's already selected, deselect it
      if (prevSelected === nodeId) {
        return null;
      }
      // Otherwise, select the clicked node (even if another node was selected)
      return nodeId;
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    // Capture current roots for cleanup
    const currentRoots = new Map(reactRootsRef.current);

    // Clean up previous React roots asynchronously to avoid race condition
    if (currentRoots.size > 0) {
      // Use setTimeout to defer cleanup until after current render cycle
      setTimeout(() => {
        currentRoots.forEach(root => {
          try {
            root.unmount();
          } catch (error) {
            console.warn('Error unmounting React root:', error);
          }
        });
      }, 0);
      // Clear the ref immediately
      reactRootsRef.current.clear();
    }

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    
    // Add arrow markers for directed edges
    const defs = svg.append("defs");
    
    defs.append("marker")
      .attr("id", "arrowhead-allow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "blue");
    
    defs.append("marker")
      .attr("id", "arrowhead-deny")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "red");

    // Faded markers for unselected edges
    defs.append("marker")
      .attr("id", "arrowhead-allow-faded")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "blue")
      .attr("opacity", 0.05);
    
    defs.append("marker")
      .attr("id", "arrowhead-deny-faded")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "red")
      .attr("opacity", 0.05);
    
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
      nodesep: 80,   // Increased horizontal separation between nodes
      ranksep: 120,  // Increased vertical separation between ranks
      marginx: 30,   // Increased margins
      marginy: 30
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
        sourceConnectionSide: (sourceX < targetX ? 'right' : 'left') as 'left' | 'right',
        targetConnectionSide: (sourceX < targetX ? 'left' : 'right') as 'left' | 'right'
      };
    });

    // Create curved links with collision avoidance
    const link = svgGroup.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(edgeConnections)
      .enter().append("path")
      .attr("stroke", (d) => d.access.toLowerCase() === 'allow' ? 'blue' : 'red')
      .attr("stroke-opacity", 1) // Start with full opacity, selection effect will handle changes
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", (d) => d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow)' : 'url(#arrowhead-deny)')
      .attr("d", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        const sourceNode = layoutNodes.find(n => n.id === sourceId);
        const targetNode = layoutNodes.find(n => n.id === targetId);

        if (!sourceNode || !targetNode) return '';

        const start: Point = {
          x: d.sourceConnectionSide === 'right' 
            ? sourceNode.x + NODE_WIDTH / 2 
            : sourceNode.x - NODE_WIDTH / 2,
          y: sourceNode.y
        };

        const end: Point = {
          x: d.targetConnectionSide === 'right' 
            ? targetNode.x + NODE_WIDTH / 2 
            : targetNode.x - NODE_WIDTH / 2,
          y: targetNode.y
        };

        const curve = generateOptimizedCurve(
          start,
          end,
          d.sourceConnectionSide,
          d.targetConnectionSide,
          layoutNodes,
          NODE_WIDTH,
          NODE_HEIGHT,
          sourceId,
          targetId
        );

        return bezierCurveToPath(curve);
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

    // Add a transparent rect for drag interaction (behind foreignObject)
    node.append("rect")
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("x", 0)
      .attr("y", 0)
      .attr("fill", "transparent")
      .style("cursor", "grab")
      .style("pointer-events", "all");

    // Add foreignObject to contain React components
    const foreignObject = node.append("foreignObject")
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("x", 0)
      .attr("y", 0)
      .style("pointer-events", "all");

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
            onClick={handleNodeClick}
          />
        );
      }
    });

    // Drag functions for repositioning nodes
    function dragstarted(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const target = event.sourceEvent?.target;
      if (!target) return;
      
      // Find the node group - it might be the target itself or a parent
      let nodeGroup = d3.select(target);
      if (!nodeGroup.classed('node')) {
        nodeGroup = d3.select(target.closest('.node') || target.parentNode);
      }
      
      nodeGroup.raise();
      // Change cursor to grabbing during drag
      nodeGroup.select("rect").style("cursor", "grabbing");
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const target = event.sourceEvent?.target;
      if (!target) return;
      
      // Find the node group - it might be the target itself or a parent
      let nodeGroup = d3.select(target);
      if (!nodeGroup.classed('node')) {
        nodeGroup = d3.select(target.closest('.node') || target.parentNode);
      }
      
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
      
      // Update connected curved links
      link.each(function(linkData) {
        const sourceId = typeof linkData.source === 'string' ? linkData.source : linkData.source.id;
        const targetId = typeof linkData.target === 'string' ? linkData.target : linkData.target.id;
        
        // Only update if this link is connected to the dragged node
        if (sourceId === d.id || targetId === d.id) {
          // Get current positions - use dragged position for the current node, layoutNodes for others
          const sourceX = sourceId === d.id ? event.x : (layoutNodes.find(n => n.id === sourceId)?.x || 0);
          const sourceY = sourceId === d.id ? event.y : (layoutNodes.find(n => n.id === sourceId)?.y || 0);
          const targetX = targetId === d.id ? event.x : (layoutNodes.find(n => n.id === targetId)?.x || 0);
          const targetY = targetId === d.id ? event.y : (layoutNodes.find(n => n.id === targetId)?.y || 0);

          const start: Point = {
            x: linkData.sourceConnectionSide === 'right' 
              ? sourceX + NODE_WIDTH / 2 
              : sourceX - NODE_WIDTH / 2,
            y: sourceY
          };

          const end: Point = {
            x: linkData.targetConnectionSide === 'right' 
              ? targetX + NODE_WIDTH / 2 
              : targetX - NODE_WIDTH / 2,
            y: targetY
          };

          const curve = generateOptimizedCurve(
            start,
            end,
            linkData.sourceConnectionSide,
            linkData.targetConnectionSide,
            layoutNodes,
            NODE_WIDTH,
            NODE_HEIGHT,
            sourceId,
            targetId
          );

          d3.select(this).attr("d", bezierCurveToPath(curve));
        }
      });
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const target = event.sourceEvent?.target;
      if (!target) return;
      
      // Find the node group - it might be the target itself or a parent
      let nodeGroup = d3.select(target);
      if (!nodeGroup.classed('node')) {
        nodeGroup = d3.select(target.closest('.node') || target.parentNode);
      }
      
      // Restore cursor to grab
      nodeGroup.select("rect").style("cursor", "grab");
    }

    // Cleanup function - capture current roots to avoid stale closure
    const rootsToCleanup = new Map(reactRootsRef.current);
    return () => {
      // Defer cleanup to avoid race condition
      setTimeout(() => {
        rootsToCleanup.forEach(root => {
          try {
            root.unmount();
          } catch (error) {
            console.warn('Error unmounting React root during cleanup:', error);
          }
        });
      }, 0);
    };
  }, [data, width, height, layoutDirection, handleNodeClick]);

  // Separate effect to handle selection changes without full re-render
  useEffect(() => {
    if (!svgRef.current) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      try {
        const svg = d3.select(svgRef.current);
        
        // Update edge opacities based on selection
        svg.selectAll('.links path')
          .attr('stroke-opacity', function(d: any) {
            if (!selectedNodeId) return 1;
            
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            // Highlight edges both FROM and TO the selected node
            const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
            return isConnected ? 1 : 0.05;
          })
          .attr('marker-end', function(d: any) {
            if (!selectedNodeId) {
              // No selection - use normal markers
              return d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow)' : 'url(#arrowhead-deny)';
            }
            
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
            
            if (isConnected) {
              // Connected edge - use normal markers
              return d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow)' : 'url(#arrowhead-deny)';
            } else {
              // Unconnected edge - use faded markers
              return d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow-faded)' : 'url(#arrowhead-deny-faded)';
            }
          });

        // Update node visual states using CSS classes instead of re-rendering React components
        const nodes = svg.selectAll('.node');
        
        // Check if nodes exist before trying to update them
        if (nodes.empty()) {
          return;
        }
        
        if (selectedNodeId === null) {
          // Clear all selection classes when nothing is selected
          nodes
            .classed('selected', false)
            .classed('unselected', false)
            .classed('connected', false);
        } else {
          // Find connected node IDs
          const connectedNodeIds = new Set<string>();
          svg.selectAll('.links path').each(function(d: any) {
            const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
            const targetId = typeof d.target === 'string' ? d.target : d.target.id;
            
            if (sourceId === selectedNodeId) {
              connectedNodeIds.add(targetId);
            }
            if (targetId === selectedNodeId) {
              connectedNodeIds.add(sourceId);
            }
          });
          
          // Apply selection classes based on current selection and connections
          nodes
            .classed('selected', function(d: any) {
              return d.id === selectedNodeId;
            })
            .classed('connected', function(d: any) {
              return connectedNodeIds.has(d.id);
            })
            .classed('unselected', function(d: any) {
              return d.id !== selectedNodeId && !connectedNodeIds.has(d.id);
            });
        }
      } catch (error) {
        console.error('Error updating selection state:', error);
      }
    }, 10); // Small delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [selectedNodeId]);

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
