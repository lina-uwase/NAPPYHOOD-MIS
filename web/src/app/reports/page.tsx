"use client"
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  ShoppingBag,
  Filter
} from 'lucide-react';
import { useTitle } from '../../contexts/TitleContext';
import salesService from '../../services/salesService';
import customersService from '../../services/customersService';
import * as XLSX from 'xlsx';

interface ReportData {
  sales: any[];
  customers: any[];
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  newCustomers: number;
}

const ReportsPage: React.FC = () => {
  const { setTitle } = useTitle();
  const [reportType, setReportType] = useState<'sales' | 'customers'>('sales');
  const [periodType, setPeriodType] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('custom');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle('Reports');
  }, [setTitle]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let reportStartDate: string;
      let reportEndDate: string;

      // Calculate date ranges based on period type
      if (periodType === 'daily') {
        reportStartDate = selectedDate;
        reportEndDate = selectedDate;
      } else if (periodType === 'monthly') {
        const monthStart = new Date(selectedMonth + '-01');
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        reportStartDate = monthStart.toISOString().split('T')[0];
        reportEndDate = monthEnd.toISOString().split('T')[0];
      } else if (periodType === 'yearly') {
        reportStartDate = `${selectedYear}-01-01`;
        reportEndDate = `${selectedYear}-12-31`;
      } else {
        // Custom date range
        reportStartDate = startDate;
        reportEndDate = endDate;
      }

      const [salesResponse, customersResponse] = await Promise.all([
        salesService.getAll({
          startDate: reportStartDate,
          endDate: reportEndDate,
          limit: 1000
        }),
        customersService.getAll({
          limit: 1000,
          isActive: true
        })
      ]);

      // Filter customers by the selected date range
      const allCustomers = customersResponse.data || [];
      const filteredCustomers = allCustomers.filter(customer => {
        const createdDate = new Date(customer.createdAt).toISOString().split('T')[0];
        return createdDate >= reportStartDate && createdDate <= reportEndDate;
      });

      // Calculate metrics
      const sales = salesResponse.data || [];
      const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.finalAmount || 0), 0);

      setReportData({
        sales,
        customers: filteredCustomers,
        totalSales: sales.length,
        totalRevenue,
        totalCustomers: allCustomers.length,
        newCustomers: filteredCustomers.length
      });
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setReportData({
        sales: [],
        customers: [],
        totalSales: 0,
        totalRevenue: 0,
        totalCustomers: 0,
        newCustomers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [reportType, periodType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const downloadReport = () => {
    if (!reportData) return;

    const periodLabel = periodType === 'daily' ? selectedDate :
                       periodType === 'monthly' ? selectedMonth :
                       periodType === 'yearly' ? selectedYear :
                       `${startDate} to ${endDate}`;

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Generate report content
    generateExcelReportContent(wb, reportData, reportType, periodType, periodLabel);

    // Generate filename
    const filename = `nappyhood-${reportType}-report-${periodLabel}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(wb, filename);
  };

  const generateExcelReportContent = (wb: XLSX.WorkBook, reportData: ReportData, reportType: string, periodType: string, periodLabel: string) => {
    // Create summary sheet
    const summaryData = [
      ['NAPPYHOOD SALON MANAGEMENT SYSTEM'],
      [`${reportType.toUpperCase()} REPORT`],
      [],
      ['Report Period:', `${periodType.toUpperCase()} - ${periodLabel}`],
      ['Generated:', `${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`],
      ['Generated by:', 'Nappyhood Salon Management System'],
      [],
    ];

    if (reportType === 'sales') {
      // Add sales summary
      summaryData.push(['SALES SUMMARY']);
      summaryData.push(['Total Sales:', reportData.totalSales.toString()]);
      summaryData.push(['Total Revenue:', formatCurrency(reportData.totalRevenue)]);
      summaryData.push([]);
      summaryData.push(['SALES DETAILS']);

      // Add sales table headers
      const salesHeaders = [['Date', 'Customer', 'Services', 'Amount', 'Payment Method', 'Recorded By', 'Discount Amount', 'Discount Reason', 'Notes']];
      const salesRows = reportData.sales.map(sale => {
        const date = formatDate(sale.saleDate);
        const customer = sale.customer?.fullName || 'Unknown';
        const services = sale.services?.map((s: any) => s.service?.name).join(', ') || 'N/A';
        const amount = formatCurrency(sale.finalAmount || 0);
        
        // Payment display
        let paymentDisplay = 'CASH';
        if (sale.payments && sale.payments.length > 0) {
          if (sale.payments.length === 1) {
            const method = sale.payments[0].paymentMethod;
            paymentDisplay = method === 'MOBILE_MONEY' ? 'MOBILE MONEY' :
                           method === 'BANK_TRANSFER' ? 'BANK TRANSFER' :
                           method === 'BANK_CARD' ? 'BANK CARD' : method;
          } else {
            paymentDisplay = sale.payments.map((p: any) => {
              const m = p.paymentMethod;
              return m === 'MOBILE_MONEY' ? 'MOBILE MONEY' :
                     m === 'BANK_TRANSFER' ? 'BANK TRANSFER' :
                     m === 'BANK_CARD' ? 'BANK CARD' : m;
            }).join(', ');
          }
        }

        const recordedBy = sale.createdBy?.name || 'Admin';
        const discountAmount = sale.manualDiscountAmount ? formatCurrency(sale.manualDiscountAmount) : '';
        const discountReason = sale.manualDiscountReason || '';
        const notes = sale.notes || '';

        return [date, customer, services, amount, paymentDisplay, recordedBy, discountAmount, discountReason, notes];
      });

      const salesSheetData = [...summaryData, ...salesHeaders, ...salesRows];
      const ws = XLSX.utils.aoa_to_sheet(salesSheetData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Date
        { wch: 25 }, // Customer
        { wch: 40 }, // Services
        { wch: 15 }, // Amount
        { wch: 18 }, // Payment Method
        { wch: 20 }, // Recorded By
        { wch: 18 }, // Discount Amount
        { wch: 25 }, // Discount Reason
        { wch: 40 }, // Notes
      ];

      // Style header rows
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '5A8621' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // Apply styles to title rows
      if (!ws['A1']) ws['A1'] = { t: 's', v: 'NAPPYHOOD SALON MANAGEMENT SYSTEM' };
      if (!ws['A2']) ws['A2'] = { t: 's', v: `${reportType.toUpperCase()} REPORT` };

      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    } else {
      // Customer report
      summaryData.push(['CUSTOMER DETAILS']);

      // Add customer table headers
      const customerHeaders = [['Date Registered', 'Name', 'Phone', 'Location', 'District', 'Province', 'Gender', 'Total Visits', 'Total Spent']];
      const customerRows = reportData.customers.map(customer => {
        const date = formatDate(customer.createdAt);
        const name = customer.fullName || 'Unknown';
        const phone = customer.phone || 'N/A';
        const location = customer.location || 'N/A';
        const district = customer.district || 'N/A';
        const province = customer.province || 'N/A';
        const gender = customer.gender || 'N/A';
        const visits = (customer.saleCount || 0).toString();
        const spent = customer.totalSpent ? formatCurrency(customer.totalSpent) : formatCurrency(0);

        return [date, name, phone, location, district, province, gender, visits, spent];
      });

      const customerSheetData = [...summaryData, ...customerHeaders, ...customerRows];
      const ws = XLSX.utils.aoa_to_sheet(customerSheetData);

      // Set column widths
      ws['!cols'] = [
        { wch: 15 }, // Date Registered
        { wch: 25 }, // Name
        { wch: 18 }, // Phone
        { wch: 30 }, // Location
        { wch: 20 }, // District
        { wch: 15 }, // Province
        { wch: 10 }, // Gender
        { wch: 12 }, // Total Visits
        { wch: 15 }, // Total Spent
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Customer Report');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header with filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as 'sales' | 'customers')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                >
                  <option value="sales">Sales Report</option>
                  <option value="customers">Customer Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as 'daily' | 'monthly' | 'yearly' | 'custom')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              <div className="flex space-x-2">
                {periodType === 'custom' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {periodType === 'daily' ? 'Date' : periodType === 'monthly' ? 'Month' : 'Year'}
                    </label>
                    {periodType === 'daily' && (
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                      />
                    )}
                    {periodType === 'monthly' && (
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                      />
                    )}
                    {periodType === 'yearly' && (
                      <input
                        type="number"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        min="2020"
                        max="2030"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={downloadReport}
              disabled={!reportData || loading}
              className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel Report</span>
            </button>
          </div>
        </div>

      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5A8621]"></div>
          </div>
        ) : !reportData ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">Unable to generate report</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === 'sales' ? (
              reportData.sales.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No sales found</h3>
                  <p className="mt-1 text-sm text-gray-500">No sales recorded for the selected period</p>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Report</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Services
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Payment
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                            Recorded by
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportData.sales.map((sale) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {formatDate(sale.saleDate)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              <div>
                                <div className="font-medium">{sale.customer?.fullName || 'Unknown'}</div>
                                {sale.manualDiscountAmount && Number(sale.manualDiscountAmount) > 0 && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Discount: {formatCurrency(sale.manualDiscountAmount)} - {sale.manualDiscountReason || 'No reason'}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sale.services?.map((s: any) => s.service?.name).join(', ') || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-[#5A8621] border-b">
                              {formatCurrency(sale.finalAmount || 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              <div>
                                {sale.payments && sale.payments.length > 0 ? (
                                  sale.payments.length === 1 ? (
                                    <span>{sale.payments[0].paymentMethod}</span>
                                  ) : (
                                    <div>
                                      <span className="font-medium text-blue-600">MIXED</span>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {sale.payments.map((p: any) =>
                                          `${p.paymentMethod}: ${formatCurrency(p.amount)}`
                                        ).join(', ')}
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <span>CASH</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sale.createdBy?.name || 'Admin'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              reportData.customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
                  <p className="mt-1 text-sm text-gray-500">No customers registered in the selected period</p>
                </div>
              ) : (
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
                  <div className="space-y-4">
                    {reportData.customers.map((customer) => (
                      <div key={customer.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{customer.fullName}</h4>
                            <p className="text-sm text-gray-600">{customer.phone || 'No phone'}</p>
                            <p className="text-sm text-gray-600">
                              {customer.location}, {customer.district}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Registered</p>
                            <p className="font-medium">{formatDate(customer.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;