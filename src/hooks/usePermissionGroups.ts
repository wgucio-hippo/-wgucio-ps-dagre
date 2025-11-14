import { useQuery } from '@tanstack/react-query';

// Define the API response types
interface PermissionGroup {
  id: string;
  name: string;
  type: string;
  group: number;
  enabled: boolean;
  system?: string;
  action?: string;
  domain?: string;
  resource?: string;
  access?: string;
}

interface PermissionGroupEdge {
  source: string;
  target: string;
  access: 'ALLOW' | 'DENY';
}

interface PermissionGroupsResponse {
  nodes: PermissionGroup[];
  edges: PermissionGroupEdge[];
}

interface ApiPaginatedResponse {
  items: any[]; // Raw items from API that need transformation
  count: number;
  limit: number;
  offset: number;
}

interface PermissionGroupRole {
  id: string;
  name: string;
  description?: string;
}

// Transform function to convert API items to PermissionGroupsResponse
const transformItemsToGraphData = (items: any[]): PermissionGroupsResponse => {
  const nodes: PermissionGroup[] = [];
  const edges: PermissionGroupEdge[] = [];
  const nodeMap = new Map<string, PermissionGroup>(); // To avoid duplicate nodes
  
  items.forEach((item, index) => {
    console.log(`Processing item ${index}:`, item);
    
    // Handle permission-control relationships (controlKey and permissionSetId/permissionSetName)
    if (item.controlKey && item.permissionSetId) {
      const controlKeyId = item.id;
      const permissionSetId = item.permissionSetId;
      
      // Add controlKey as a node (if not already added)
      if (!nodeMap.has(controlKeyId)) {
        const controlNode: PermissionGroup = {
          id: controlKeyId,
          name: item.controlKey,
          type: 'permission',
          enabled: item.enabled,
          system: item.controlSystem,
          action: item.controlAction,
          domain: item.controlDomain,
          resource: item.controlResource,
          group: 2 // Controls in group 2
        };
        nodes.push(controlNode);
        nodeMap.set(controlKeyId, controlNode);
        console.log(`Added control node:`, controlNode);
      }
      
      // Add permissionSet as a node (if not already added)
      if (!nodeMap.has(permissionSetId)) {
        const permissionNode: PermissionGroup = {
          id: permissionSetId,
          name: item.permissionSetName, // Use permissionSetName for display, ID for identification
          type: 'permissionSet',
          enabled: item.permissionSetEnabled,
          system: item.controlSystem,
          action: item.controlAction,
          domain: item.controlDomain,
          resource: item.controlResource,
          group: 1 // Permission sets in group 1
        };
        nodes.push(permissionNode);
        nodeMap.set(permissionSetId, permissionNode);
        console.log(`Added permission set node:`, permissionNode);
      }
      
      // Create edge between permissionSet and controlKey
      const edge: PermissionGroupEdge = {
        source: permissionSetId,
        target: controlKeyId,
        access: item.access || 'ALLOW' // Use access from the item or default to ALLOW
      };
      edges.push(edge);
      console.log(`Added permission-control edge:`, edge);
    }
    // Handle permission-group relationships (permissionSetId/permissionSetName and permissionGroupId/permissionGroupRole)
    else if (item.permissionSetId && item.permissionGroupId) {
        console.log('foo', item);
      const permissionSetId = item.permissionSetId || item.permissionSetName;
      const permissionGroupId = item.permissionGroupId || item.permissionGroupRole;
      
      // Add permissionSet as a node (if not already added)
      if (!nodeMap.has(permissionSetId)) {

        const segments = item.permissionSetName.split('-');

        const permissionNode: PermissionGroup = {
          id: permissionSetId,
          name: item.permissionSetName,
          type: 'permissionSet',
          enabled: item.permissionSetEnabled,
          group: 1,
          system: segments[0],
          domain: segments[1],
          resource: segments[2],
          action: segments[3],
        };
        nodes.push(permissionNode);
        nodeMap.set(permissionSetId, permissionNode);
        console.log(`Added permission set node:`, permissionNode);
      }
      
      // Add permissionGroup as a node (if not already added)
      if (!nodeMap.has(permissionGroupId)) {
        const groupNode: PermissionGroup = {
          id: permissionGroupId,
          name: item.permissionGroupRole,
          type: 'permissionGroup',
          enabled: item.permissionGroupEnabled,
          group: 3 // Permission groups in group 3
        };
        nodes.push(groupNode);
        nodeMap.set(permissionGroupId, groupNode);
        console.log(`Added permission group node:`, groupNode);
      }
      
      // Create edge between permissionGroup and permissionSet
      const edge: PermissionGroupEdge = {
        source: permissionGroupId,
        target: permissionSetId,
        access: item.access || 'ALLOW' // Use access from the item or default to ALLOW
      };
      edges.push(edge);
      console.log(`Added permission-group edge:`, edge);
    } else {
      console.warn(`Item ${index} missing required fields:`, item);
    }
  });
  
  console.log(`Transformation summary: ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges };
};

// Helper function to fetch paginated data from an endpoint
const fetchPaginatedData = async (endpoint: string, expectedCount: number = 200): Promise<any[]> => {
  const limit = 100;
  let offset = 0;
  let totalCount = expectedCount;
  const allItems: any[] = [];
  
  console.log(`Starting paginated fetch from: ${endpoint}`);
  
  do {
    // Check if endpoint already has query parameters
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${separator}limit=${limit}&offset=${offset}`;
    console.log(`Fetching page: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${endpoint}: ${response.status} ${response.statusText}`);
    }
    
    const pageData: ApiPaginatedResponse = await response.json();
    console.log(`Page response from ${endpoint}:`, pageData);
    
    // Validate the response structure
    if (!pageData || typeof pageData !== 'object') {
      throw new Error(`Invalid API response from ${endpoint}: not an object`);
    }
    
    // Set total count from first response (use actual count if available)
    if (offset === 0) {
      totalCount = pageData.count || expectedCount;
      console.log(`Total items to fetch from ${endpoint}: ${totalCount}`);
    }
    
    // Accumulate items from this page
    if (Array.isArray(pageData.items)) {
      allItems.push(...pageData.items);
      console.log(`Added ${pageData.items.length} items from ${endpoint}`);
    }
    
    // Move to next page
    offset += limit;
    console.log(`Fetched ${allItems.length} items so far from ${endpoint}, need ${totalCount} total`);
    
  } while (offset < totalCount);
  
  console.log(`Completed fetching ${allItems.length} items from ${endpoint}`);
  return allItems;
};

// Fetch permission group roles for dropdown filter
const fetchPermissionGroupRoles = async (): Promise<PermissionGroupRole[]> => {
  try {
    const roles = await fetchPaginatedData('http://localhost:3002/api/v1/permission-group');
    console.log(`Fetched ${roles.length} permission group roles:`, roles);
    return roles.map(role => ({
      id: role.id,
      name: role.name || role.id,
      description: role.description
    }));
  } catch (error) {
    console.error('Error fetching permission group roles:', error);
    throw error;
  }
};

// API function to fetch permission groups with sequential filtering
const fetchPermissionGroups = async (selectedPermissionGroup?: string): Promise<PermissionGroupsResponse> => {
  try {
    if (!selectedPermissionGroup) {
      // Return empty result if no permission group is selected
      console.log('No permission group selected, returning empty result');
      return { nodes: [], edges: [] };
    }

    console.log(`Starting sequential fetch for permission group: ${selectedPermissionGroup}`);
    
    // Step 1: Fetch permission sets for the selected permission group
    const permissionGroupEndpoint = `http://localhost:3002/api/v1/permission-group-permission-set?permissionGroupIdList=${encodeURIComponent(selectedPermissionGroup)}`;
    console.log(`Step 1: Fetching permission sets from: ${permissionGroupEndpoint}`);
    const permissionGroupItems = await fetchPaginatedData(permissionGroupEndpoint);
    
    // Extract unique permission set IDs from the results
    const permissionSetIds = new Set<string>();
    permissionGroupItems.forEach(item => {
      if (item.permissionSetId) {
        permissionSetIds.add(item.permissionSetId);
      }
    });
    
    const uniquePermissionSetIds = Array.from(permissionSetIds);
    console.log(`Found ${uniquePermissionSetIds.length} unique permission sets:`, uniquePermissionSetIds);
    
    if (uniquePermissionSetIds.length === 0) {
      console.log('No permission sets found for selected group');
      return { nodes: [], edges: [] };
    }
    
    // Step 2: Fetch permissions for all found permission sets
    const permissionSetIdParams = uniquePermissionSetIds
      .map(id => `permissionSetIdList=${encodeURIComponent(id)}`)
      .join('&');
    const permissionEndpoint = `http://localhost:3002/api/v1/permission?${permissionSetIdParams}`;
    console.log(`Step 2: Fetching permissions from: ${permissionEndpoint}`);
    const permissionItems = await fetchPaginatedData(permissionEndpoint);
    
    // Combine all items
    const allItems = [...permissionGroupItems, ...permissionItems];
    console.log(`Combined ${allItems.length} items from sequential fetch (${permissionGroupItems.length} permission-group items + ${permissionItems.length} permission items)`);
    
    // Transform all collected items to graph data
    console.log(`Transforming ${allItems.length} items to graph data...`);
    const result = transformItemsToGraphData(allItems);
    
    console.log(`Sequential fetch complete. Final result:`, result);
    console.log(`Nodes: ${result.nodes.length}, Edges: ${result.edges.length}`);
    return result;
    
  } catch (error) {
    console.error('Error in sequential fetch:', error);
    throw error;
  }
};

// React Query hook for permission group roles
export const usePermissionGroupRoles = () => {
  return useQuery({
    queryKey: ['permission-group-roles'],
    queryFn: fetchPermissionGroupRoles,
    staleTime: 10 * 60 * 1000, // 10 minutes (roles change less frequently)
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// React Query hook with optional permission group filter
export const usePermissionGroups = (selectedPermissionGroup?: string) => {
  return useQuery({
    queryKey: ['permission-groups', selectedPermissionGroup],
    queryFn: () => fetchPermissionGroups(selectedPermissionGroup),
    enabled: !!selectedPermissionGroup, // Only run query when permission group is selected
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export type { PermissionGroup, PermissionGroupEdge, PermissionGroupsResponse, ApiPaginatedResponse, PermissionGroupRole };
