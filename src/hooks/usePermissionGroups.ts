import { useQuery } from '@tanstack/react-query';

// Define the API response types
interface PermissionGroup {
  id: string;
  name: string;
  type: string;
  group: number;
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

// Transform function to convert API items to PermissionGroupsResponse
const transformItemsToGraphData = (items: any[]): PermissionGroupsResponse => {
  const nodes: PermissionGroup[] = [];
  const edges: PermissionGroupEdge[] = [];
  const nodeMap = new Map<string, PermissionGroup>(); // To avoid duplicate nodes
  
  items.forEach((item, index) => {
    console.log(`Processing item ${index}:`, item);
    
    // Each item contains controlKey and permissionSetName fields that determine the relation
    if (item.controlKey && item.permissionSetName) {
      const controlKeyId = item.controlKey;
      const permissionSetId = item.permissionSetName;
      
      // Add controlKey as a node (if not already added)
      if (!nodeMap.has(controlKeyId)) {
        const controlNode: PermissionGroup = {
          id: controlKeyId,
          name: item.controlKeyName || controlKeyId, // Use controlKeyName if available
          type: 'control',
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
          name: permissionSetId, // Use the permissionSetName as both id and name
          type: 'permissionSet',
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
      console.log(`Added edge:`, edge);
    } else {
      console.warn(`Item ${index} missing controlKey or permissionSetName:`, item);
    }
  });
  
  console.log(`Transformation summary: ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges };
};

// API function to fetch permission groups with pagination
const fetchPermissionGroups = async (): Promise<PermissionGroupsResponse> => {
  try {
    const limit = 100;
    let offset = 0;
    let totalCount = 0;
    
    // Accumulate all items from paginated responses
    const allItems: any[] = [];
    
    console.log('Starting paginated fetch from: http://localhost:3002/api/v1/permission');
    
    do {
      const url = `http://localhost:3002/api/v1/permission?limit=${limit}&offset=${offset}`;
      console.log(`Fetching page: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch permission groups: ${response.status} ${response.statusText}`);
      }
      
      const pageData: ApiPaginatedResponse = await response.json();
      console.log(`Page response:`, pageData);
      
      // Validate the response structure
      if (!pageData || typeof pageData !== 'object') {
        throw new Error('Invalid API response: not an object');
      }
      
      // Set total count from first response
      if (offset === 0) {
        totalCount = 200;//pageData.count;
        console.log(`Total items to fetch: ${totalCount}`);
      }
      
      // Accumulate items from this page
      if (Array.isArray(pageData.items)) {
        allItems.push(...pageData.items);
        console.log(`Added ${pageData.items.length} items from this page`);
      }
      
      // Move to next page
      offset += limit;
      console.log(`Fetched ${allItems.length} items so far, need ${totalCount} total`);
      
    } while (offset < totalCount);
    
    // Transform all collected items to graph data
    console.log(`Transforming ${allItems.length} items to graph data...`);
    const result = transformItemsToGraphData(allItems);
    
    console.log(`Transformation complete. Final result:`, result);
    console.log(`Nodes: ${result.nodes.length}, Edges: ${result.edges.length}`);
    return result;
    
  } catch (error) {
    console.error('Error fetching permission groups:', error);
    throw error;
  }
};

// React Query hook
export const usePermissionGroups = () => {
  return useQuery({
    queryKey: ['permission-groups'],
    queryFn: fetchPermissionGroups,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export type { PermissionGroup, PermissionGroupEdge, PermissionGroupsResponse, ApiPaginatedResponse };
