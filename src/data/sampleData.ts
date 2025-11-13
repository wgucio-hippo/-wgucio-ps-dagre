import { GraphData } from '../types/graph';

export const sampleGraphData: GraphData = 
// {
//   nodes: [
//     // Root level (Group 1 - Management)
//     { id: "root", name: "CEO", group: 1 },
    
//     // Level 2 (Group 2 - Directors)
//     { id: "dir1", name: "CTO", group: 2 },
//     { id: "dir2", name: "CFO", group: 2 },
//     { id: "dir3", name: "CMO", group: 2 },
    
//     // Level 3 (Group 3 - Managers)
//     { id: "mgr1", name: "Dev Manager", group: 3 },
//     { id: "mgr2", name: "QA Manager", group: 3 },
//     { id: "mgr3", name: "Finance Manager", group: 3 },
//     { id: "mgr4", name: "Marketing Manager", group: 3 },
//     { id: "mgr5", name: "Sales Manager", group: 3 },
    
//     // Level 4 (Group 4 - Team Leads)
//     { id: "lead1", name: "Frontend Lead", group: 4 },
//     { id: "lead2", name: "Backend Lead", group: 4 },
//     { id: "lead3", name: "QA Lead", group: 4 },
//     { id: "lead4", name: "Accounting Lead", group: 4 },
//     { id: "lead5", name: "Content Lead", group: 4 },
    
//     // Level 5 (Group 5 - Individual Contributors)
//     { id: "dev1", name: "React Dev", group: 5 },
//     { id: "dev2", name: "Vue Dev", group: 5 },
//     { id: "dev3", name: "Node Dev", group: 5 },
//     { id: "dev4", name: "Python Dev", group: 5 },
//     { id: "qa1", name: "QA Engineer", group: 5 },
//     { id: "qa2", name: "Test Automation", group: 5 },
//     { id: "acc1", name: "Accountant", group: 5 },
//     { id: "cont1", name: "Content Writer", group: 5 },
//   ],
//   links: [
//     // CEO to Directors
//     { source: "root", target: "dir1", value: 3 },
//     { source: "root", target: "dir2", value: 3 },
//     { source: "root", target: "dir3", value: 3 },
    
//     // Directors to Managers
//     { source: "dir1", target: "mgr1", value: 2 },
//     { source: "dir1", target: "mgr2", value: 2 },
//     { source: "dir2", target: "mgr3", value: 2 },
//     { source: "dir3", target: "mgr4", value: 2 },
//     { source: "dir3", target: "mgr5", value: 2 },
    
//     // Managers to Team Leads
//     { source: "mgr1", target: "lead1", value: 2 },
//     { source: "mgr1", target: "lead2", value: 2 },
//     { source: "mgr2", target: "lead3", value: 2 },
//     { source: "mgr3", target: "lead4", value: 2 },
//     { source: "mgr4", target: "lead5", value: 2 },
    
//     // Team Leads to Individual Contributors
//     { source: "lead1", target: "dev1", value: 1 },
//     { source: "lead1", target: "dev2", value: 1 },
//     { source: "lead2", target: "dev3", value: 1 },
//     { source: "lead2", target: "dev4", value: 1 },
//     { source: "lead3", target: "qa1", value: 1 },
//     { source: "lead3", target: "qa2", value: 1 },
//     { source: "lead4", target: "acc1", value: 1 },
//     { source: "lead5", target: "cont1", value: 1 },
    
//     // Cross-functional relationships
//     { source: "mgr1", target: "mgr2", value: 1 }, // Dev and QA collaboration
//     { source: "lead1", target: "lead2", value: 1 }, // Frontend and Backend collaboration
//     { source: "qa1", target: "dev1", value: 1 }, // QA and Dev collaboration
//   ]
// };
{
  "nodes": [
    {"id": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "name": "POD - Underwriting Restriction - Underwriter", "type": "permissionSet", group: 1},
    {"id": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "name": "POD - Underwriting Restriction - Underwriting Manager", "type": "permissionSet", group: 1},
    {"id": "a7e812ca-d5bf-476c-a390-9e85896c0215", "name": "POD - Underwriting Restriction - Underwriting Leadership", "type": "permissionSet", group: 1},
    {"id": "09b2265f-5034-4335-a62a-6fe551307650", "name": "POD - Underwriting Restriction - No Access", "type": "permissionSet", group: 1},
    {"id": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "name": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "name": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "name": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "name": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "name": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "name": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-VIEW", "name": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-VIEW", "type": "control", group: 2},
    {"id": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-EDIT", "name": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-EDIT", "type": "control", group: 2}
  ],
  "edges": [
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "access": "ALLOW"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "7a74459d-a75d-4f9e-896f-b86f9d9f8f15", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "access": "ALLOW"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "access": "ALLOW"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "access": "DENY"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-VIEW", "access": "ALLOW"},
    {"source": "722a1b79-0f77-445e-8d79-3bfe9992e81b", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-VIEW", "access": "ALLOW"},
    {"source": "a7e812ca-d5bf-476c-a390-9e85896c0215", "target": "POD-UNDERWRITING-UNDERWRITER_RESTRICTIONS-EDIT", "access": "ALLOW"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-BIND_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-VIEW", "access": "DENY"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-CAPACITY_RESTRICTIONS-EDIT", "access": "DENY"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-VIEW", "access": "DENY"},
    {"source": "09b2265f-5034-4335-a62a-6fe551307650", "target": "POD-UNDERWRITING-STATE_MORATORIUMS-EDIT", "access": "DENY"}
  ]
};
