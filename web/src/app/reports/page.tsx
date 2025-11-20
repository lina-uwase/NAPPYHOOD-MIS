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
import jsPDF from 'jspdf';

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
  const [periodType, setPeriodType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle('Reports');
  }, [setTitle]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let startDate: string;
      let endDate: string;

      // Calculate date ranges based on period type
      if (periodType === 'daily') {
        startDate = selectedDate;
        endDate = selectedDate;
      } else if (periodType === 'monthly') {
        const monthStart = new Date(selectedMonth + '-01');
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
      } else {
        startDate = `${selectedYear}-01-01`;
        endDate = `${selectedYear}-12-31`;
      }

      const [salesResponse, customersResponse] = await Promise.all([
        salesService.getAll({
          startDate,
          endDate,
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
        return createdDate >= startDate && createdDate <= endDate;
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
  }, [reportType, periodType, selectedDate, selectedMonth, selectedYear]);

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

  const downloadReport = async () => {
    if (!reportData) return;

    const periodLabel = periodType === 'daily' ? selectedDate :
                       periodType === 'monthly' ? selectedMonth : selectedYear;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    let yPosition = 20;

    // Beautiful header with gradient background effect
    pdf.setFillColor(90, 134, 33); // Nappyhood green
    pdf.rect(0, 0, pageWidth, 40, 'F'); // Header background

    // Add actual Nappyhood logo image
    try {
      const logoImg = new Image();
      logoImg.src = '/assets/NAPPYHOODPHOTO.png';

      // Wait for image to load, then add it to PDF
      await new Promise((resolve) => {
        logoImg.onload = () => {
          // Create canvas to convert image to base64
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas size to crop out any unwanted parts
          const cropWidth = Math.min(logoImg.width, logoImg.height); // Make it square
          const cropHeight = cropWidth;
          canvas.width = cropWidth;
          canvas.height = cropHeight;

          // Fill with transparent background
          if (ctx) {
            ctx.clearRect(0, 0, cropWidth, cropHeight);

            // Calculate source crop area (center of the image)
            const sourceX = (logoImg.width - cropWidth) / 2;
            const sourceY = (logoImg.height - cropHeight) / 2;

            // Draw only the center part of the image (avoiding any borders/lines)
            ctx.drawImage(logoImg, sourceX, sourceY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          }

          // Add logo to PDF - centered
          const logoData = canvas.toDataURL('image/png');
          const logoWidth = 30;
          const logoHeight = 30;
          const logoX = (pageWidth - logoWidth) / 2; // Center horizontally
          const logoY = 5; // Top margin
          pdf.addImage(logoData, 'PNG', logoX, logoY, logoWidth, logoHeight);
          resolve(void 0);
        };

        logoImg.onerror = () => {
          console.warn('Logo image failed to load, skipping');
          resolve(void 0);
        };
      });
    } catch (error) {
      console.warn('Failed to load logo:', error);
    }

    // No text in header - just the centered logo

    // Reset position and add report details
    yPosition = 55;
    pdf.setFontSize(18);
    pdf.setTextColor(90, 134, 33);
    pdf.text(`${reportType.toUpperCase()} REPORT`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Report Period: ${periodType.toUpperCase()} - ${periodLabel}`, 20, yPosition);
    pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition + 5);
    pdf.text(`Generated by: Nappyhood Salon Management System`, 20, yPosition + 10);

    yPosition += 25;

    if (reportType === 'sales') {
      // Sales summary
      pdf.setFontSize(14);
      pdf.setTextColor(90, 134, 33);
      pdf.text('SALES SUMMARY', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Total Sales: ${reportData.totalSales}`, 20, yPosition);
      pdf.text(`Total Revenue: ${formatCurrency(reportData.totalRevenue)}`, 20, yPosition + 5);
      yPosition += 15;

      // Sales details header
      pdf.setFontSize(12);
      pdf.setTextColor(90, 134, 33);
      pdf.text('SALES DETAILS', 20, yPosition);
      yPosition += 8;

      // Table headers
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Date', 20, yPosition);
      pdf.text('Customer', 45, yPosition);
      pdf.text('Services', 85, yPosition);
      pdf.text('Recorded By', 135, yPosition);
      pdf.text('Amount', 175, yPosition);

      yPosition += 3;
      pdf.line(20, yPosition, 190, yPosition); // Underline
      yPosition += 5;

      reportData.sales.forEach(sale => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        const date = formatDate(sale.saleDate);
        const customer = (sale.customer?.fullName || 'Unknown').substring(0, 18);
        const services = (sale.services?.map(s => s.service?.name).join(', ') || 'N/A').substring(0, 25);
        const recordedBy = (sale.createdBy?.name || 'Admin').substring(0, 18);
        const amount = formatCurrency(sale.finalAmount || 0);

        pdf.text(date, 20, yPosition);
        pdf.text(customer, 45, yPosition);
        pdf.text(services, 85, yPosition);
        pdf.text(recordedBy, 135, yPosition);
        pdf.text(amount, 175, yPosition);
        yPosition += 5;
      });
    } else {
      // Customer details header
      pdf.setFontSize(14);
      pdf.setTextColor(90, 134, 33);
      pdf.text('CUSTOMER DETAILS', 20, yPosition);
      yPosition += 8;

      // Table headers
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Date Registered', 20, yPosition);
      pdf.text('Name', 55, yPosition);
      pdf.text('Phone', 105, yPosition);
      pdf.text('Location', 140, yPosition);

      yPosition += 3;
      pdf.line(20, yPosition, 190, yPosition); // Underline
      yPosition += 5;

      reportData.customers.forEach(customer => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        const date = formatDate(customer.createdAt);
        const name = (customer.fullName || 'Unknown').substring(0, 23);
        const phone = (customer.phone || 'N/A').substring(0, 15);
        const location = `${customer.location || 'N/A'}, ${customer.district || ''}`.substring(0, 25);

        pdf.text(date, 20, yPosition);
        pdf.text(name, 55, yPosition);
        pdf.text(phone, 105, yPosition);
        pdf.text(location, 140, yPosition);
        yPosition += 5;
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generated by Nappyhood Salon Management System', pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(`nappyhood-${reportType}-report-${periodLabel}.pdf`);
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
                  onChange={(e) => setPeriodType(e.target.value as 'daily' | 'monthly' | 'yearly')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5A8621]"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

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
            </div>

            <button
              onClick={downloadReport}
              disabled={!reportData || loading}
              className="bg-[#5A8621] text-white px-4 py-2 rounded-lg hover:bg-[#4A7318] flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Details</h3>
                  <div className="space-y-4">
                    {reportData.sales.map((sale) => (
                      <div key={sale.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {sale.customer?.fullName || 'Unknown Customer'}
                            </h4>
                            <p className="text-sm text-gray-600">{formatDate(sale.saleDate)}</p>
                            <p className="text-sm text-gray-500">
                              Recorded by: {sale.createdBy?.name || 'Admin'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#5A8621]">{formatCurrency(sale.finalAmount || 0)}</p>
                            <p className="text-sm text-gray-500">
                              {sale.services?.length || 0} service(s)
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Services: {sale.services?.map(s => s.service?.name).join(', ') || 'N/A'}
                        </div>
                      </div>
                    ))}
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