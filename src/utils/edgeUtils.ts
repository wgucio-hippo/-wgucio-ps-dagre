import { PositionedGraphNode } from '../types/graph';

export interface Point {
  x: number;
  y: number;
}

export interface BezierCurve {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if a point is inside a rectangle (node bounds)
 */
export function isPointInNode(point: Point, node: NodeBounds): boolean {
  return (
    point.x >= node.x - node.width / 2 &&
    point.x <= node.x + node.width / 2 &&
    point.y >= node.y - node.height / 2 &&
    point.y <= node.y + node.height / 2
  );
}

/**
 * Calculate a point on a Bézier curve at parameter t (0 to 1)
 */
export function getBezierPoint(curve: BezierCurve, t: number): Point {
  const { start, control1, control2, end } = curve;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * start.x + 3 * mt2 * t * control1.x + 3 * mt * t2 * control2.x + t3 * end.x,
    y: mt3 * start.y + 3 * mt2 * t * control1.y + 3 * mt * t2 * control2.y + t3 * end.y
  };
}

/**
 * Check if a Bézier curve intersects with any nodes
 */
export function doesCurveIntersectNodes(
  curve: BezierCurve, 
  nodes: PositionedGraphNode[], 
  nodeWidth: number, 
  nodeHeight: number,
  sourceId: string,
  targetId: string
): boolean {
  // Sample points along the curve to check for intersections
  const samples = 20;
  
  for (let i = 1; i < samples - 1; i++) {
    const t = i / (samples - 1);
    const point = getBezierPoint(curve, t);
    
    // Check against all nodes except source and target
    for (const node of nodes) {
      if (node.id === sourceId || node.id === targetId) continue;
      
      const nodeBounds: NodeBounds = {
        x: node.x,
        y: node.y,
        width: nodeWidth,
        height: nodeHeight
      };
      
      if (isPointInNode(point, nodeBounds)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calculate control points for a Bézier curve between two nodes
 * Creates curves that approach nodes at approximately 90-degree angles
 */
export function calculateControlPoints(
  start: Point,
  end: Point,
  sourceConnectionSide: 'left' | 'right',
  targetConnectionSide: 'left' | 'right',
  curvature: number = 0.3
): { control1: Point; control2: Point } {
  const dx = end.x - start.x;
  
  // Enhanced control point calculation for 90-degree approaches with more spacing
  const minControlDistance = 120; // Increased minimum distance for more space around nodes
  const maxControlDistance = 200; // Increased maximum for wider curves when needed
  
  // Calculate adaptive control distance based on node separation
  const horizontalDistance = Math.abs(dx);
  
  // Use larger control distance for nodes that are close vertically but far horizontally
  const adaptiveDistance = Math.min(
    Math.max(horizontalDistance * 0.5, minControlDistance), // Increased multiplier for more spacing
    maxControlDistance
  );
  
  // Calculate control point directions based on connection sides
  const sourceDirection = sourceConnectionSide === 'right' ? 1 : -1;
  const targetDirection = targetConnectionSide === 'right' ? 1 : -1;
  
  // First control point: extends horizontally from source for perpendicular exit
  const control1: Point = {
    x: start.x + sourceDirection * adaptiveDistance,
    y: start.y
  };
  
  // Second control point: positioned for perpendicular entry to target
  // This creates a smooth curve that approaches the target node at 90 degrees
  const control2: Point = {
    x: end.x + targetDirection * adaptiveDistance,
    y: end.y
  };
  
  return { control1, control2 };
}

/**
 * Generate an optimized Bézier curve that avoids node collisions
 */
export function generateOptimizedCurve(
  start: Point,
  end: Point,
  sourceConnectionSide: 'left' | 'right',
  targetConnectionSide: 'left' | 'right',
  nodes: PositionedGraphNode[],
  nodeWidth: number,
  nodeHeight: number,
  sourceId: string,
  targetId: string
): BezierCurve {
  // Try different curvature values to find one that avoids collisions
  const curvatureOptions = [0.3, 0.5, 0.7, 0.9, 1.2];
  
  for (const curvature of curvatureOptions) {
    const { control1, control2 } = calculateControlPoints(
      start, 
      end, 
      sourceConnectionSide, 
      targetConnectionSide, 
      curvature
    );
    
    const curve: BezierCurve = { start, control1, control2, end };
    
    if (!doesCurveIntersectNodes(curve, nodes, nodeWidth, nodeHeight, sourceId, targetId)) {
      return curve;
    }
  }
  
  // If no collision-free curve found, try alternative routing
  return generateAlternativeRoute(
    start, 
    end, 
    sourceConnectionSide, 
    targetConnectionSide, 
    nodes, 
    nodeWidth, 
    nodeHeight, 
    sourceId, 
    targetId
  );
}

/**
 * Generate an alternative route when direct curves collide
 */
function generateAlternativeRoute(
  start: Point,
  end: Point,
  sourceConnectionSide: 'left' | 'right',
  targetConnectionSide: 'left' | 'right',
  nodes: PositionedGraphNode[],
  nodeWidth: number,
  nodeHeight: number,
  sourceId: string,
  targetId: string
): BezierCurve {
  // Calculate a route that goes around obstacles
  const dy = end.y - start.y;
  
  // Determine if we should route above or below
  const routeAbove = dy > 0;
  const verticalOffset = routeAbove ? -nodeHeight * 1.5 : nodeHeight * 1.5;
  
  // Create control points that route around obstacles
  const midY = start.y + dy * 0.5 + verticalOffset;
  
  const control1: Point = {
    x: start.x + (sourceConnectionSide === 'right' ? nodeWidth : -nodeWidth),
    y: midY
  };
  
  const control2: Point = {
    x: end.x + (targetConnectionSide === 'right' ? nodeWidth : -nodeWidth),
    y: midY
  };
  
  return { start, control1, control2, end };
}

/**
 * Convert a Bézier curve to SVG path string
 */
export function bezierCurveToPath(curve: BezierCurve): string {
  const { start, control1, control2, end } = curve;
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
}
