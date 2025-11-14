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

  // Material Icons SVG for assignment_ind (role icon)
  const RoleIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: '4px', flexShrink: 0 }}
    >
      <path 
        d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM12 6C13.1 6 14 6.9 14 8S13.1 10 12 10 10 9.1 10 8 10.9 6 12 6ZM18 18H6V16.5C6 14.6 9.79 13.5 12 13.5S18 14.6 18 16.5V18Z" 
        fill="currentColor"
      />
    </svg>
  );

  // Material Icons SVG for shield_toggle (permission icon)
  const PermissionIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: '4px', flexShrink: 0 }}
    >
      <path 
        d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.1 15.2,18 14,18H10C8.8,18 8,17.1 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z" 
        fill="currentColor"
      />
    </svg>
  );

  // Material Icons SVG for passkey (access key icon)
  const PasskeyIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginRight: '4px', flexShrink: 0 }}
    >
      <path 
        d="M7,14C5.9,14 5,13.1 5,12S5.9,10 7,10 9,10.9 9,12 8.1,14 7,14M12.6,10C11.8,7.7 9.6,6 7,6A6,6 0 0,0 1,12A6,6 0 0,0 7,18C9.6,18 11.8,16.3 12.6,14H16V18H20V14H23V10H12.6Z" 
        fill="currentColor"
      />
    </svg>
  );

  // Material Icons SVG for toggle_on (enabled state)
  const ToggleOnIcon = () => (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginLeft: '4px', flexShrink: 0 }}
    >
      <path 
        d="M17,7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7M17,15A3,3 0 0,1 14,12A3,3 0 0,1 17,9A3,3 0 0,1 20,12A3,3 0 0,1 17,15Z" 
        fill="currentColor"
      />
    </svg>
  );

  // Material Icons SVG for toggle_off (disabled state)
  const ToggleOffIcon = () => (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ marginLeft: '4px', flexShrink: 0, opacity: 0.5 }}
    >
      <path 
        d="M17,7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7M7,15A3,3 0 0,1 4,12A3,3 0 0,1 7,9A3,3 0 0,1 10,12A3,3 0 0,1 7,15Z" 
        fill="currentColor"
      />
    </svg>
  );

  // Choose icon based on node type
  const getNodeIcon = () => {
    if (node.type === 'permissionGroup') {
      return <RoleIcon />;
    } else if (node.type === 'permissionSet') {
      return <PermissionIcon />;
    } else if (node.type === 'control') {
      return <PasskeyIcon />;
    }
    return <RoleIcon />; // Default to role icon
  };

  // Get toggle icon based on enabled state
  const getToggleIcon = () => {
    if (node.enabled === undefined) return null; // No toggle if enabled state is not defined
    return node.enabled ? <ToggleOnIcon /> : <ToggleOffIcon />;
  };

  return (
    <div
      className="graph-node"
      onClick={handleClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        // backgroundColor: color,
        background: '#F0EFEB',
        border: `2px solid ${color}`,
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
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
          color: '#000',
          textAlign: 'center',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'flex-start',
          flexDirection: 'column'
        }}
        title={node.name}
      >
        <div>
          <span>{getNodeIcon()}</span><span>{getToggleIcon()}</span>
        </div>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '99%' }}>
          {node.name}
        </div>
      </div>
    </div>
  );
};

export default GraphNode;
