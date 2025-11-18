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

// Dagre layout calculation
const calculateDagreLayout = (data: GraphData, layoutDirection: 'TB' | 'LR' | 'BT' | 'RL'): PositionedGraphNode[] => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({
    rankdir: layoutDirection,
    nodesep: 80,   // Horizontal separation between nodes
    ranksep: 120,  // Vertical separation between ranks
    marginx: 30,   // Margins
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
  return data.nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      x: dagreNode?.x || 0,
      y: dagreNode?.y || 0
    };
  });
};

// Force-directed layout calculation - simplified manual approach
const calculateForceLayout = (data: GraphData, width: number, height: number): PositionedGraphNode[] => {
  console.log('Force layout - manual positioning approach');
  console.log('Input data:', { width, height, nodeCount: data.nodes.length, edgeCount: data.edges.length });
  
  const nodeCount = data.nodes.length;
  if (nodeCount === 0) return [];
  
  // Calculate grid dimensions for spreading nodes - use more columns for better spacing
  const cols = Math.ceil(Math.sqrt(nodeCount * 1.5)); // More columns to reduce overlap
  const rows = Math.ceil(nodeCount / cols);
  
  // Calculate spacing with smaller margins but ensure minimum cell size
  const marginX = width * 0.05;
  const marginY = height * 0.05;
  const availableWidth = width - 2 * marginX;
  const availableHeight = height - 2 * marginY;
  const cellWidth = Math.max(availableWidth / cols, NODE_WIDTH + 20); // Minimum cell width
  const cellHeight = Math.max(availableHeight / rows, NODE_HEIGHT + 20); // Minimum cell height
  
  console.log('Grid layout:', { cols, rows, cellWidth, cellHeight });
  
  // Position nodes in a grid with some randomization
  const nodes: PositionedGraphNode[] = data.nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Base grid position
    const baseX = marginX + col * cellWidth + cellWidth / 2;
    const baseY = marginY + row * cellHeight + cellHeight / 2;
    
    // Add minimal randomization to avoid perfect grid look
    const randomOffsetX = (Math.random() - 0.5) * Math.min(cellWidth * 0.2, 30);
    const randomOffsetY = (Math.random() - 0.5) * Math.min(cellHeight * 0.2, 30);
    
    const finalX = baseX + randomOffsetX;
    const finalY = baseY + randomOffsetY;
    
    console.log(`Node ${index} (${node.id}): grid(${col},${row}) -> position(${Math.round(finalX)},${Math.round(finalY)})`);
    
    return {
      ...node,
      x: finalX,
      y: finalY
    };
  });
  
  console.log('Final node positions sample:', nodes.slice(0, 3).map(n => ({ 
    id: n.id, 
    x: Math.round(n.x), 
    y: Math.round(n.y) 
  })));
  
  return nodes;
};

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
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR' | 'BT' | 'RL'>('LR');
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<'dagre' | 'force'>('dagre');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layoutResetTrigger, setLayoutResetTrigger] = useState(0);
  const isLayoutResetRef = useRef(false);
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

    const svg = d3.select(svgRef.current);
    
    // Clear previous content - let React handle root cleanup naturally
    svg.selectAll("*").remove();
    
    // Clear the roots reference but don't manually unmount
    // React will handle cleanup when DOM nodes are removed
    reactRootsRef.current.clear();
    
    // Add arrow markers for directed edges (reuse svg variable)
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
      .attr("fill", "green");
    
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
      .attr("fill", "green")
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

    // Store zoom behavior in ref for reset function
    zoomRef.current = zoom;
    svg.call(zoom);

    // Calculate layout based on selected algorithm
    // Ensure width and height are numbers for layout calculations
    const numericWidth = typeof width === 'string' ? 800 : width;
    const numericHeight = typeof height === 'string' ? 600 : height;
    
    console.log('Layout dimensions:', { width, height, numericWidth, numericHeight });
    
    const layoutNodes: PositionedGraphNode[] = layoutAlgorithm === 'dagre' 
      ? calculateDagreLayout(data, layoutDirection)
      : calculateForceLayout(data, numericWidth, numericHeight);

    console.log(`Layout algorithm: ${layoutAlgorithm}`);
    console.log('Layout nodes after calculation:', layoutNodes.slice(0, 3).map(n => ({ 
      id: n.id, 
      x: n.x, 
      y: n.y 
    })));

    // Calculate bounding box of all nodes and center them in viewport
    if (layoutNodes.length > 0) {
      const minX = Math.min(...layoutNodes.map(n => n.x - NODE_WIDTH / 2));
      const maxX = Math.max(...layoutNodes.map(n => n.x + NODE_WIDTH / 2));
      const minY = Math.min(...layoutNodes.map(n => n.y - NODE_HEIGHT / 2));
      const maxY = Math.max(...layoutNodes.map(n => n.y + NODE_HEIGHT / 2));
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      const contentCenterX = (minX + maxX) / 2;
      const contentCenterY = (minY + maxY) / 2;
      
      let scale, translateX, translateY;
      
      if (layoutAlgorithm === 'dagre') {
        // Dagre: Use aggressive fitting with padding for hierarchical layouts
        const padding = 20;
        const paddedWidth = contentWidth + 2 * padding;
        const paddedHeight = contentHeight + 2 * padding;
        
        const scaleX = (numericWidth * 0.9) / paddedWidth;
        const scaleY = (numericHeight * 0.9) / paddedHeight;
        scale = Math.min(scaleX, scaleY, 2.0);
        
        translateX = numericWidth / 2 - contentCenterX * scale;
        translateY = numericHeight / 2 - contentCenterY * scale;
      } else {
        // Force-directed: More conservative fitting for grid layouts
        const padding = 40;
        const paddedWidth = contentWidth + 2 * padding;
        const paddedHeight = contentHeight + 2 * padding;
        
        const scaleX = (numericWidth * 0.8) / paddedWidth; // Use 80% of viewport
        const scaleY = (numericHeight * 0.8) / paddedHeight;
        scale = Math.min(scaleX, scaleY, 1.2); // More conservative max zoom
        
        translateX = numericWidth / 2 - contentCenterX * scale;
        translateY = numericHeight / 2 - contentCenterY * scale;
      }
      
      console.log('Centering calculation:', {
        layoutAlgorithm, numericWidth, numericHeight,
        contentCenterX, contentCenterY,
        scale, translateX, translateY,
        isLayoutReset: isLayoutResetRef.current
      });
      
      // Only apply auto-fit zoom if this is not a layout reset
      if (!isLayoutResetRef.current) {
        const initialTransform = d3.zoomIdentity
          .translate(translateX, translateY)
          .scale(scale);
        
        svg.call(zoom.transform, initialTransform);
        setTransform({ x: translateX, y: translateY, k: scale });
      }
      
      // Reset the flag after processing
      isLayoutResetRef.current = false;
    } else {
      // If no nodes, center at origin
      const centerTransform = d3.zoomIdentity.translate(numericWidth / 2, numericHeight / 2);
      svg.call(zoom.transform, centerTransform);
      setTransform({ x: numericWidth / 2, y: numericHeight / 2, k: 1 });
    }

    const color = (group: number) => {
      switch (group) {
        case 1: return '#0077B6';
        case 2: return '#023E8A';
        case 3: return '#0099ecff';
        default: return '#90E0EF';
      }
    }

    // Calculate edge connections based on layout algorithm
    const edgeConnections = data.edges.map(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      const sourceNode = layoutNodes.find(n => n.id === sourceId);
      const targetNode = layoutNodes.find(n => n.id === targetId);
      
      // Use consistent left/right logic for both layouts based on relative positions
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
      .attr("stroke", (d) => d.access.toLowerCase() === 'allow' ? 'green' : 'red')
      .attr("stroke-opacity", 1) // Start with full opacity, show all edges initially
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("marker-end", (d) => d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow)' : 'url(#arrowhead-deny)')
      // Store the source and target IDs directly on the DOM element for reliable selection
      .attr("data-source-id", (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        return sourceId;
      })
      .attr("data-target-id", (d) => {
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        return targetId;
      })
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
      .attr("transform", (d) => {
        const transform = `translate(${d.x - NODE_WIDTH/2},${d.y - NODE_HEIGHT/2})`;
        console.log(`Node ${d.id} positioned at: x=${d.x}, y=${d.y}, transform=${transform}`);
        return transform;
      })
      .call(d3.drag<SVGGElement, PositionedGraphNode>()
        .subject((event, d) => {
          // Always use the current layout position as the drag subject
          const currentNode = layoutNodes.find(n => n.id === d.id);
          return currentNode ? { x: currentNode.x, y: currentNode.y } : { x: d.x, y: d.y };
        })
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
      .style("pointer-events", "none"); // Disable pointer events on foreignObject itself

    // Create React components inside foreignObject with better cleanup tracking
    foreignObject.each(function(d) {
      const container = d3.select(this).append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("pointer-events", "auto") // Enable pointer events for React content
        .node() as HTMLDivElement;

      if (container && container.parentNode) {
        try {
          // Only create root if container is properly attached to DOM
          const root = createRoot(container);
          reactRootsRef.current.set(d.id, root);
          
          // Store reference to container for safer cleanup
          (root as any)._container = container;
          
          root.render(
            <GraphNode 
              node={d} 
              width={NODE_WIDTH} 
              height={NODE_HEIGHT} 
              color={color(d.group)}
              onClick={handleNodeClick}
            />
          );
        } catch (error) {
          console.warn('Error creating React root for node:', d.id, error);
        }
      }
    });

    // Drag functions for repositioning nodes
    function dragstarted(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      const target = event.sourceEvent?.target as Element;
      if (!target) return;
      
      // Prevent dragging if the click originated from React content (div elements)
      if (target.tagName === 'DIV' || target.closest('div')) {
        event.sourceEvent?.stopPropagation();
        return;
      }
      
      // Sync the data object with current layout position
      const currentNode = layoutNodes.find(n => n.id === d.id);
      if (currentNode) {
        d.x = currentNode.x;
        d.y = currentNode.y;
      }
      
      // Find the node group by data ID - more reliable than using event target
      const nodeGroup = svgGroup.selectAll('.node').filter((nodeData: any) => nodeData.id === d.id);
      
      nodeGroup.raise();
      // Change cursor to grabbing during drag and set on the entire SVG to maintain cursor during drag
      nodeGroup.select("rect").style("cursor", "grabbing");
      svg.style("cursor", "grabbing");
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, PositionedGraphNode, PositionedGraphNode>, d: PositionedGraphNode) {
      // Use the node data directly instead of trying to find the element
      // This is more reliable as the drag behavior maintains the connection to the data
      
      // Find the node group by data ID - more reliable than using event target
      const nodeGroup = svgGroup.selectAll('.node').filter((nodeData: any) => nodeData.id === d.id);
      
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
      // Find the node group by data ID - more reliable than using event target
      const nodeGroup = svgGroup.selectAll('.node').filter((nodeData: any) => nodeData.id === d.id);
      
      // Restore cursor to grab on the node and reset SVG cursor
      nodeGroup.select("rect").style("cursor", "grab");
      svg.style("cursor", "grab");
    }

    // Cleanup function - capture ref to avoid stale closure
    const rootsRef = reactRootsRef.current;
    return () => {
      rootsRef.clear();
    };
  }, [data, width, height, layoutDirection, layoutAlgorithm, handleNodeClick, layoutResetTrigger]);

  // Separate effect to handle selection changes without full re-render
  useEffect(() => {
    if (!svgRef.current) return;

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      try {
        const svg = d3.select(svgRef.current);
        
        // Update edge opacities based on selection - use data attributes for reliable ID matching
        svg.selectAll('.links path')
          .attr('stroke-opacity', function() {
            if (!selectedNodeId) return 1; // Show all edges when no selection
            
            // Get IDs from data attributes stored on the DOM element
            const sourceId = d3.select(this).attr('data-source-id');
            const targetId = d3.select(this).attr('data-target-id');
            
            const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
            
            // Debug logging only for connected edges to reduce noise
            if (isConnected) {
              console.log('Connected edge found:', { 
                sourceId, targetId, selectedNodeId
              });
            }
            
            return isConnected ? 1 : 0; // Highlight connected edges, hide others
          })
          .attr('marker-end', function(d: any, i: number) {
            if (!selectedNodeId) {
              // No selection - use normal markers
              return d.access.toLowerCase() === 'allow' ? 'url(#arrowhead-allow)' : 'url(#arrowhead-deny)';
            }
            
            // Use data attributes for consistent ID matching
            const sourceId = d3.select(this).attr('data-source-id');
            const targetId = d3.select(this).attr('data-target-id');
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
  }, [selectedNodeId, data.edges]);

  const resetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
  };

  useEffect(() => {
    resetZoom();
  }, [layoutResetTrigger])

  const resetLayout = () => {
    // Set flag to indicate this is a layout reset (preserve zoom)
    isLayoutResetRef.current = true;
    
    // Trigger layout recalculation by incrementing the trigger
    // Note: Preserving current node selection and zoom level
    setLayoutResetTrigger(prev => prev + 1);
  };

  return (
    <div className="graph-container">
      <div className="graph-controls">
        <div className="control-group">
          <button onClick={resetZoom} className="reset-button">
            Reset Zoom
          </button>
          <button onClick={resetLayout} className="reset-button">
            Reset Layout
          </button>
          <div className="layout-controls">
            <label htmlFor="algorithm-select">Algorithm:</label>
            <select 
              id="algorithm-select"
              value={layoutAlgorithm} 
              onChange={(e) => setLayoutAlgorithm(e.target.value as 'dagre' | 'force')}
              className="layout-select"
            >
              <option value="dagre">Dagre (Hierarchical)</option>
              <option value="force">Force-Directed</option>
            </select>
          </div>
          {layoutAlgorithm === 'dagre' && (
            <div className="layout-controls">
              <label htmlFor="layout-select">Direction:</label>
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
          )}
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
