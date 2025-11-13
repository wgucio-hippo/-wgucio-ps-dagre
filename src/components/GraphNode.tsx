import React from 'react';
import { PositionedGraphNode } from '../types/graph';

interface GraphNodeProps {
  node: PositionedGraphNode;
  width: number;
  height: number;
  color: string;
  onClick?: (nodeId: string) => void;
}

const GraphNode: React.FC<GraphNodeProps> = ({ node, width, height, color, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node.id);
  };

  return (
    <div
      className="graph-node"
      onClick={handleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: color,
        border: `3px solid ${color}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'auto',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div
        className="node-title"
        style={{
          fontSize: '8px',
          // fontWeight: 'bold',
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
        <div style={{ padding: '2px', fontWeight: 'bold' }}>
          Type: {node.type}
        </div>
      </div>
    </div>
  );
};

export default GraphNode;
