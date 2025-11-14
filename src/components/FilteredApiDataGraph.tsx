import React, { useState, useEffect } from 'react';
import D3Graph from './D3Graph';
import { usePermissionGroups, usePermissionGroupRoles } from '../hooks/usePermissionGroups';
import { GraphData } from '../types/graph';
import { sampleGraphData } from '../data/sampleData';

interface FilteredApiDataGraphProps {
  width: string;
  height: number;
}

const FilteredApiDataGraph: React.FC<FilteredApiDataGraphProps> = ({ width, height }) => {
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<string>('');
  
  // Fetch permission group roles for dropdown
  const { 
    data: roles, 
    isLoading: rolesLoading, 
    error: rolesError 
  } = usePermissionGroupRoles();
  
  // Set first role as default when roles are loaded
  useEffect(() => {
    if (roles && roles.length > 0 && !selectedPermissionGroup) {
      setSelectedPermissionGroup(roles[0].id);
      console.log(`Auto-selected first permission group: ${roles[0].id}`);
    }
  }, [roles, selectedPermissionGroup]);
  
  // Fetch graph data with selected filter
  const { 
    data, 
    isLoading: dataLoading, 
    error: dataError, 
    isError: isDataError 
  } = usePermissionGroups(selectedPermissionGroup);

  if (rolesLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        fontSize: '18px',
        color: '#666'
      }}>
        Loading permission group roles...
      </div>
    );
  }

  if (rolesError) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: height,
        fontSize: '16px',
        color: '#d32f2f',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          Failed to load permission group roles
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {rolesError instanceof Error ? rolesError.message : 'Unknown error occurred'}
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div>
        {/* Filter Dropdown */}
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <label htmlFor="permission-group-filter" style={{ fontWeight: 'bold' }}>
            Permission Group:
          </label>
          <select
            id="permission-group-filter"
            value={selectedPermissionGroup}
            onChange={(e) => setSelectedPermissionGroup(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          >
            <option value="">All Groups</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: height - 60, // Account for filter bar
          fontSize: '18px',
          color: '#666'
        }}>
          Loading permission data for {selectedPermissionGroup || 'all groups'}...
        </div>
      </div>
    );
  }

  if (isDataError) {
    console.warn('API failed, falling back to sample data');
    return (
      <div>
        {/* Filter Dropdown */}
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <label htmlFor="permission-group-filter" style={{ fontWeight: 'bold' }}>
            Permission Group:
          </label>
          <select
            id="permission-group-filter"
            value={selectedPermissionGroup}
            onChange={(e) => setSelectedPermissionGroup(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          >
            <option value="">All Groups</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          padding: '10px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '4px',
          margin: '10px',
          fontSize: '14px',
          color: '#856404'
        }}>
          ⚠️ API Error: Using sample data instead. Error: {dataError instanceof Error ? dataError.message : 'Unknown error'}
        </div>
        <D3Graph 
          data={sampleGraphData}
          width={width}
          height={height - 120} // Account for filter bar and warning
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

  // Transform API data to match GraphData interface
  const graphData: GraphData = {
    nodes: Array.isArray(data.nodes) ? data.nodes : [],
    edges: Array.isArray(data.edges) ? data.edges : []
  };

  // Don't render if we don't have valid data
  if (!graphData.nodes.length && !graphData.edges.length) {
    return (
      <div>
        {/* Filter Dropdown */}
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <label htmlFor="permission-group-filter" style={{ fontWeight: 'bold' }}>
            Permission Group:
          </label>
          <select
            id="permission-group-filter"
            value={selectedPermissionGroup}
            onChange={(e) => setSelectedPermissionGroup(e.target.value)}
            style={{
              padding: '5px 10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '14px'
            }}
          >
            <option value="">All Groups</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: height - 60,
          fontSize: '16px',
          color: '#666'
        }}>
          No nodes or edges found for selected permission group
        </div>
      </div>
    );
  }

  return (
    <div style={{width: '100%'}}>
      {/* Filter Dropdown */}
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <label htmlFor="permission-group-filter" style={{ fontWeight: 'bold' }}>
          Permission Group:
        </label>
        <select
          id="permission-group-filter"
          value={selectedPermissionGroup}
          onChange={(e) => setSelectedPermissionGroup(e.target.value)}
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '14px'
          }}
        >
          <option value="">All Groups</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Showing {graphData.nodes.length} nodes, {graphData.edges.length} edges
        </div>
      </div>
      
      <D3Graph 
        data={graphData}
        width={width}
        height={height - 60} // Account for filter bar
      />
    </div>
  );
};

export default FilteredApiDataGraph;
