export interface GraphNode {
  id: string;
  name: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  type: string;
}

export interface PositionedGraphNode extends GraphNode {
  x: number;
  y: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  access: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphLink[];
}

export {};
