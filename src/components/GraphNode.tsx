import React from 'react';
import { PositionedGraphNode } from '../types/graph';

interface GraphNodeProps {
  node: PositionedGraphNode;
  width: number;
  height: number;
  color: string;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, width, height, color }) => {
  return (
    <div
      className="graph-node"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: color,
        border: `2px solid ${color}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none'
      }}
    >
      <div
        className="node-title"
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%'
        }}
        title={node.name}
      >
        {node.name}
      </div>
      
      <div
        className="node-group"
        style={{
          fontSize: '12px',
          color: '#fff',
          opacity: 0.8,
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%'
        }}
        title={`Group ${node.group}`}
      >
        Group {node.group}
      </div>
      
      {/* Additional content area with overflow handling */}
      <div
        className="node-content"
        style={{
          flex: 1,
          width: '100%',
          marginTop: '4px',
          overflow: 'auto',
          fontSize: '10px',
          color: '#fff',
          opacity: 0.7
        }}
      >
        {/* You can add more content here that will scroll if it overflows */}
        <div style={{ padding: '2px' }}>
          ID: {node.id}
        </div>
      </div>
    </div>
  );
};

export default GraphNode;
