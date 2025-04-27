import { useState } from 'react';
import { DashboardType } from "../../utils/types";
import { CyberDashboard, FinanceDashboard, GeoDashboard } from "../../utils/default-dashboards";
import { RxCross2 } from "react-icons/rx";

interface DashboardShopProps {    
    onClose: () => void;
}

const DashboardShop = ({ onClose }: DashboardShopProps) => {    
    const options: DashboardType[] = [
        FinanceDashboard, 
        CyberDashboard,
        GeoDashboard
    ];
    const [selectedOptions, setSelectedOptions] = useState<DashboardType[]>(options);

    const toggleOption = (dashboard: DashboardType) => {
        setSelectedOptions((prev) =>
            prev.includes(dashboard)
              ? prev.filter((optionId) => optionId !== dashboard)
              : [...prev, dashboard]
          );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-background/95 w-full max-w-[325px] rounded-lg shadow-lg border border-border/50 p-4">
                <div className="flex justify-between mb-4 ">
                    <h3 className="text-lg font-medium text-white mb-2">Get A New Dashboard!</h3>
                    <RxCross2                 
                        className="mt-1 hover:bg-gray-700 rounded-sm"                        
                        onClick={onClose} 
                        size={20}                        
                    />
                </div>
                                                
                <div className="flex justify-end gap-2">
                <ul className="w-full">
                    {options.map((option) => (
                    <li key={option.id} className="mb-2">
                        <button
                        onClick={() => toggleOption(option)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedOptions.includes(option) 
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                        }`}
                        >
                        {option.name}
                        </button>
                    </li>
                    ))}
                </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardShop;