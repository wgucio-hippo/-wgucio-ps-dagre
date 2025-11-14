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
 * Calculate control points for true 90-degree spline connections
 * Creates multi-segment paths with perpendicular entry/exit
 */
export function calculateControlPoints(
  start: Point,
  end: Point,
  sourceConnectionSide: 'left' | 'right' | 'center',
  targetConnectionSide: 'left' | 'right' | 'center',
  curvature: number = 0.3
): { control1: Point; control2: Point } {
  // For center connections, use simpler direct curve
  if (sourceConnectionSide === 'center' || targetConnectionSide === 'center') {
    const midX = (start.x + end.x) / 2;
    
    return {
      control1: { x: midX, y: start.y },
      control2: { x: midX, y: end.y }
    };
  }
  
  // Simplified curve logic that works better for grid layouts
  const dx = end.x - start.x;
  
  // Calculate control points based on the direction and distance
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100); // Limit the curve extent
  
  // Determine control point positions based on connection sides
  const sourceDirection = sourceConnectionSide === 'right' ? 1 : -1;
  const targetDirection = targetConnectionSide === 'right' ? 1 : -1;
  
  const control1: Point = {
    x: start.x + sourceDirection * controlOffset,
    y: start.y
  };
  
  const control2: Point = {
    x: end.x + targetDirection * controlOffset,
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
  sourceConnectionSide: 'left' | 'right' | 'center',
  targetConnectionSide: 'left' | 'right' | 'center',
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
  sourceConnectionSide: 'left' | 'right' | 'center',
  targetConnectionSide: 'left' | 'right' | 'center',
  nodes: PositionedGraphNode[],
  nodeWidth: number,
  nodeHeight: number,
  sourceId: string,
  targetId: string
): BezierCurve {
  // Use a much simpler fallback - just use the basic control points
  // without extreme routing
  const dx = end.x - start.x;
  const controlOffset = Math.min(Math.abs(dx) * 0.4, 80);
  
  const sourceDirection = sourceConnectionSide === 'right' ? 1 : -1;
  const targetDirection = targetConnectionSide === 'right' ? 1 : -1;
  
  const control1: Point = {
    x: start.x + sourceDirection * controlOffset,
    y: start.y
  };
  
  const control2: Point = {
    x: end.x + targetDirection * controlOffset,
    y: end.y
  };
  
  return { start, control1, control2, end };
}

/**
 * Convert to 3-segment path where middle segment is vertical
 */
export function bezierCurveToPath(curve: BezierCurve): string {
  const { start, end } = curve;
  
  // For TRUE 3-segment path with vertical middle segment:
  // We need exactly 2 intermediate points to create 3 segments
  const middleX = (start.x + end.x) / 2;
  
  // We don't need intermediate points since we're calculating corners directly
  
  // Create path with rounded corners using quadratic curves
  // Make corner radius proportional to segment lengths to avoid oversized corners
  const horizontalLength1 = Math.abs(middleX - start.x);
  const horizontalLength2 = Math.abs(end.x - middleX);
  const verticalLength = Math.abs(end.y - start.y);
  
  // Use percentage of the shortest segment, with min/max bounds
  const minSegment = Math.min(horizontalLength1, horizontalLength2, verticalLength);
  const cornerRadius = Math.min(Math.max(minSegment * 0.3, 8), 20); // 30% of shortest segment, min 8px, max 20px
  
  // Determine directions for proper corner calculations
  const goingDown = end.y > start.y;
  const goingLeft = start.x > middleX; // First segment direction
  const goingRight = end.x > middleX;  // Third segment direction
  
  // Calculate rounded corner points properly
  // First corner: from horizontal to vertical
  const corner1Start = { x: middleX - (goingLeft ? -cornerRadius : cornerRadius), y: start.y };
  const corner1End = { x: middleX, y: start.y + (goingDown ? cornerRadius : -cornerRadius) };
  
  // Second corner: from vertical to horizontal  
  const corner2Start = { x: middleX, y: end.y - (goingDown ? cornerRadius : -cornerRadius) };
  const corner2End = { x: middleX + (goingRight ? cornerRadius : -cornerRadius), y: end.y };
  
  // Create path with properly calculated rounded corners
  return `M ${start.x} ${start.y}
          L ${corner1Start.x} ${corner1Start.y}
          Q ${middleX} ${start.y} ${corner1End.x} ${corner1End.y}
          L ${corner2Start.x} ${corner2Start.y}
          Q ${middleX} ${end.y} ${corner2End.x} ${corner2End.y}
          L ${end.x} ${end.y}`;
}
