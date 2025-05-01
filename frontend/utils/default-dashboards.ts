import { DashboardType, APIData } from './types';

export const FinanceDashboard: DashboardType = {
    id: 0,
    name: "Finance",
    apis: [
        {   
            apiId: 12323,
            userId: 123,
            apiName: "sdas",
            apiString: "sdas",
            apiKey: "aasd",
            graphType: "Line",
            paneX: 123,
            paneY: 123,
            parameters: [],
            rootKeys: []
        }        
    ]
};

export const CyberDashboard: DashboardType = {
    id: 1,
    name: "Cybersecurity",
    apis: [
        {   apiId: 12323,
            userId: 123,
            apiName: "sdas",
            apiString: "sdas",
            apiKey: "aasd",
            graphType: "Line",
            paneX: 123,
            paneY: 123,
            parameters: [],
            rootKeys: []
        }        
    ]
};

export const GeoDashboard: DashboardType = {
    id: 2,
    name: "Geological",
    apis: [
        {   apiId: 12323,
            userId: 123,
            apiName: "sdas",
            apiString: "sdas",
            apiKey: "aasd",
            graphType: "Line",
            paneX: 123,
            paneY: 123,
            parameters: [],
            rootKeys: []            
        }        
    ]
};



// apiId: number;
// userId: number;
// apiName: string;
// apiString: string;
// apiKey: string;
// graphType: string;
// paneX: number;
// paneY: number;
// parameters: (string | { parameter: string })[] | null;
// rootKey?: string;
