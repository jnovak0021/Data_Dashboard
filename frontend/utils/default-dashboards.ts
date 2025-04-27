import { DashboardType, APIData } from './types';

export const FinanceDashboard: DashboardType = {
    id: 0,
    name: "Finance",
    apis: [
        {   apiId: 12323,
            userId: 123,
            apiName: "sdas",
            apiString: "sdas",
            apiKey: "aasd",
            graphType: "Line",
            paneX: 123,
            paneY: 123,
            parameters: null
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
