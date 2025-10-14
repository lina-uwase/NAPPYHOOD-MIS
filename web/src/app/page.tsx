"use client";
import React, { useEffect, useState } from 'react';
import { useTitle } from '../contexts/TitleContext';
import { Users, Calendar, DollarSign, AlertTriangle, ShieldCheck, Scissors, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import customersService, { Customer } from '../services/customersService';
import api from '../config/api';

interface SalonMetrics {
  totalCustomers: number;
  totalVisits: number;
  totalRevenue: number;
  totalServices: number;
  activeCustomers: number;
  averageVisitValue: number;
  todayVisits: number;
  monthlyGrowth: number;
}


interface RevenueTrendItem {
  date: string;
  revenue: number;
}

interface TopServiceItem {
  service?: {
    name: string;
  };
  quantity?: number;
  revenue?: number;
}

export default function Dashboard() {
  const { setTitle } = useTitle();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<SalonMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<{ day: string; value: number }[]>([]);
  const [topServices, setTopServices] = useState<{ count: number; revenue: number; name: string }[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    setTitle("Dashboard");
  }, [setTitle]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [user, isAuthenticated, authLoading, router]);

  const fetchDashboardData = async (period = selectedPeriod) => {
    try {
      setError(null);
      console.log('🔍 Fetching dashboard data for period:', period);
      console.log('🔍 Auth state:', { isAuthenticated, user: user?.name, role: user?.role });

      // Use the dashboard API with period parameter
      const dashboardRes = await api.get(`/dashboard/stats?period=${period}`);
      console.log('🔍 Dashboard API response:', dashboardRes.data);
      const dashboardData = dashboardRes.data;
      const data = dashboardData.data;

      // Debug logging
      // console.log('🔍 Dashboard API Response:', dashboardData);
      // console.log('🔍 Dashboard data:', data);

      // Use the properly calculated metrics from the backend
      const totalRevenue = data.overview.totalRevenue;
      const todayVisits = data.overview.periodSales;

      // Use all data from the dashboard API
      setMetrics({
        totalCustomers: data.overview.totalCustomers,
        totalVisits: data.overview.allTimeSales,
        totalRevenue,
        totalServices: data.overview.totalServices,
        activeCustomers: data.overview.totalCustomers, // Use total customers as active for now
        averageVisitValue: data.overview.averageSaleValue,
        todayVisits,
        monthlyGrowth: 12.5 // This would be calculated from historical data
      });

      // Use revenue trend data from the API directly
      let revenueByDay = [];
      if (data.revenueTrend && data.revenueTrend.length > 0) {
        revenueByDay = data.revenueTrend.map((item: any) => ({
          day: item.day,
          value: item.revenue || 0
        }));
      } else {
        // Generate empty data for the last 7 days if no data
        const today = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          last7Days.push({
            day: dayName,
            value: 0
          });
        }
        revenueByDay = last7Days;
      }

      setRevenueData(revenueByDay);

      // Set top services from dashboard API
      setTopServices(data.topServices || []);

      // Set top customers from dashboard API
      setTopCustomers(data.topCustomers || []);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);

      if (err.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(`Failed to load dashboard data: ${err.response?.data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    fetchDashboardData(period);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <ShieldCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Redirecting to sales page...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data</h2>
          <p className="text-gray-600">No salon data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening at your salon today.</p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#5A8621] focus:border-[#5A8621]"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-[#5A8621]/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#5A8621]" />
            </div>
            <div>
              <p className="text-gray-700 text-sm">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {metrics.activeCustomers} active customers
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-gray-700 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalVisits}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {metrics.todayVisits} sales today
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-gray-700 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">RWF {metrics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +{metrics.monthlyGrowth}% this month
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-gray-700 text-sm">Available Services</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalServices}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Avg. visit: RWF {metrics.averageVisitValue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Daily Revenue (Last 7 Days)</h3>
              <div className="text-sm text-gray-500">
                This Week
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 16, right: 12, left: 12, bottom: 16 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(90,134,33,0.08)' }}
                    formatter={(value: number) => [`RWF ${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#5A8621" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Recent Customers</h3>
              <div className="space-y-4">
                {topCustomers.length > 0 ? (
                  topCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#5A8621] rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {(customer.fullName || customer.name)?.charAt(0) || 'C'}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.fullName || customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          RWF {customer.totalSpent?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.totalSales || 0} sales
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>Customer data will be displayed here once you start recording visits</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Trends</h3>
              <div className="text-sm text-gray-500">
                Last 7 Days
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 16, right: 12, left: 12, bottom: 16 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, borderColor: '#E5E7EB' }}
                    formatter={(value: number) => [`RWF ${value.toLocaleString()}`, 'Sales Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#5A8621"
                    strokeWidth={2}
                    dot={{ fill: '#5A8621', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#5A8621', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Services</h3>
              <div className="text-sm text-gray-500">
                By Revenue
              </div>
            </div>
            <div className="h-64">
              {topServices.length > 0 ? (
                <div className="flex items-center h-full">
                  <div className="w-3/5 h-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topServices.map((service) => ({
                            name: service.name,
                            value: service.revenue,
                            count: service.count
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {topServices.map((entry, serviceIndex) => (
                            <Cell
                              key={`cell-${serviceIndex}`}
                              fill={serviceIndex === 0 ? '#5A8621' : serviceIndex === 1 ? '#7BA428' : serviceIndex === 2 ? '#9BC53D' : '#A78BFA'}
                            />
                          ))}
                        </Pie>
                        <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="text-xs font-medium text-gray-500">
                          Total
                        </text>
                        <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold text-gray-900">
                          RWF {topServices.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-2/5 pl-4">
                    <div className="space-y-3">
                      {topServices.map((service, serviceIdx) => (
                        <div key={service.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: serviceIdx === 0 ? '#5A8621' : serviceIdx === 1 ? '#7BA428' : serviceIdx === 2 ? '#9BC53D' : '#A78BFA'
                              }}
                            ></div>
                            <div>
                              <div className="text-sm text-gray-900 font-medium">{service.name}</div>
                              <div className="text-xs text-gray-500">{service.count} visits</div>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            RWF {service.revenue.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p>Service data will appear here once you start recording visits</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}