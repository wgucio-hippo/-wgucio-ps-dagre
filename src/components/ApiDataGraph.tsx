import React from 'react';
import D3Graph from './D3Graph';
import { usePermissionGroups } from '../hooks/usePermissionGroups';
import { GraphData } from '../types/graph';
import { sampleGraphData } from '../data/sampleData';

interface ApiDataGraphProps {
  width: string;
  height: number;
}

const ApiDataGraph: React.FC<ApiDataGraphProps> = ({ width, height }) => {
  const { data, isLoading, error, isError } = usePermissionGroups();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        fontSize: '18px',
        color: '#666'
      }}>
        Loading permission groups...
      </div>
    );
  }

  if (isError) {
    console.warn('API failed, falling back to sample data');
    return (
      <div>
        <div style={{ 
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          margin: '10px',
          fontSize: '14px',
          color: '#856404'
        }}>
          ⚠️ API Error: Using sample data instead. Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <D3Graph 
          data={sampleGraphData}
          width={width}
          height={height}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        fontSize: '16px',
        color: '#666'
      }}>
        No data available
      </div>
    );
  }

  // Debug: Log the API response to see its structure
  console.log('API Response:', data);

  // Transform API data to match GraphData interface
  // Add safety checks to ensure arrays exist
  const graphData: GraphData = {
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : []
  };

  console.log('Transformed GraphData:', graphData);

  // Don't render if we don't have valid data
  if (!graphData.nodes.length && !graphData.edges.length) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        fontSize: '16px',
        color: '#666'
      }}>
        No nodes or edges found in API response
      </div>
    );
  }

  return (
    <D3Graph 
      data={graphData}
      width={width}
      height={height}
    />
  );
};

export default ApiDataGraph;
