"use client"
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [7, 10, 25, 50]
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-base text-gray-500">Items per page:</span>
        <select 
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-200 rounded px-3 py-1 text-base focus:outline-none focus:ring-1 focus:ring-[#009900] focus:border-[#009900] hover:border-[#009900] transition-colors"
        >
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-base text-gray-500">
          {startItem} - {endItem} of {totalItems}
        </span>
        
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 text-gray-400 hover:text-[#009900] disabled:opacity-50 hover:bg-[#F8FAFC] rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1 text-gray-400 hover:text-[#009900] disabled:opacity-50 hover:bg-[#F8FAFC] rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
