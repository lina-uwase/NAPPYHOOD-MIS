import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
interface SelectOption {
  label: string;
  value: string | number;
}

interface ServiceData {
  value: number;
  percentage: number;
}

interface WaterSupplyData {
  waterSupplyAccess: {
    totalHouseholds: number;
    basicWaterServices: ServiceData;
    limitedWaterServices: ServiceData;
    unimprovedWaterServices: ServiceData;
    surfaceWaterServices: ServiceData;
  };
  waterSupplyBySettlementType: {
    totalHhWithBasicWaterServices: number;
    ruralHouseholds: ServiceData;
    urbanHouseholds: ServiceData;
  };
  householdsByWaterSupplyServices: Array<{
    level: string;
    name: string;
    totalHouseholds: number;
    basicWaterServices: ServiceData;
    limitedWaterServices: ServiceData;
    unimprovedWaterServices: ServiceData;
    surfaceWaterServices: ServiceData;
  }>;
}

interface SanitationData {
  sanitationServicesAcess: {
    totalHouseholds: number;
    safelyManagedSanitationServices: ServiceData;
    basicSanitationServices: ServiceData;
    limitedSanitationServices: ServiceData;
    unimprovedSanitationServices: ServiceData;
    openDefecationServices: ServiceData;
  };
  householdsBySanitationServices: Array<{
    level: string;
    name: string;
    totalHouseholds: number;
    safelyManagedSanitationServices: ServiceData;
    basicSanitationServices: ServiceData;
    limitedSanitationServices: ServiceData;
    unimprovedSanitationServices: ServiceData;
    openDefecationServices: ServiceData;
  }>;
}

interface HygieneData {
  householdsByHygieneFacility: {
    totalHouseholds: number;
    householdsWithHygieneFacility: ServiceData;
    householdsWithoutHygieneFacility: ServiceData;
  };
  householdsByHygieneStatus: {
    totalHouseholds: number;
    basicHygiene: ServiceData;
    limitedHygiene: ServiceData;
    noHygiene: ServiceData;
  };
  householdsByHygieneServices: Array<{
    level: string;
    name: string;
    totalHouseholds: number;
    basicHygiene: ServiceData;
    limitedHygiene: ServiceData;
    noHygiene: ServiceData;
  }>;
}

interface ApiResponse {
  waterSupply: WaterSupplyData[];
  sanitation: SanitationData[];
  hygiene: HygieneData[];
  solidWaste: any[];
  liquidWaste: any[];
}

interface ChartData {
  title: string;
  chartType: 'pie' | 'bar';  
  data: any;
  totalHouseholds: number;
  showBySettlement?: boolean;
}

interface SummaryCard {
  title: string;
  subtitle: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  providers: [MessageService],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    ChartModule,
    CardModule,
    DropdownModule,
    CalendarModule,
    InputTextModule
  ]
})
export class DashboardComponent implements OnInit {
  dashboardData: ApiResponse | null = null;
  nationalData: ApiResponse | null = null;
  loading = false;
  nationalDataLoading = false;
  lastUpdated = new Date();
  chartData: ChartData[] = [];
  nationalSummaryCards: SummaryCard[] = [];
  chartOptions: any;
  level = 'NATIONAL';
  startDate: Date;
  endDate: Date;
  facilityType = 'HOUSEHOLD';
  hasAppliedFilters = false;
  // FontAwesome icons removed to avoid dependency issues
  // Chart type selection for National level
  showBySettlement = false;

  // Dropdown options - Only 3 levels
  levelOptions = [
    { label: 'National', value: 'NATIONAL' },
    { label: 'Province', value: 'PROVINCE' },
    { label: 'District', value: 'DISTRICT' }
  ];

  constructor(
    private http: HttpClient, 
    private messageService: MessageService
  ) {
    this.initializeChartOptions();
    const currentYear = new Date().getFullYear();
    this.startDate = new Date(`${currentYear}-01-01`);
    this.endDate = new Date(`${currentYear}-12-31`);
  }

  ngOnInit() {
    this.fetchNationalData();
    this.fetchDashboardData(); // Load charts immediately
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            font: {
              size: 12
            },
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = context.dataset.percentages?.[context.dataIndex];
              return percentage ? 
                `${label}: ${value.toLocaleString()} (${percentage.toFixed(1)}%)` :
                `${label}: ${value.toLocaleString()}`;
            }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }

  fetchNationalData(): void {
    this.nationalDataLoading = true;
    
    const apiUrl = `${environment.API_BASE_URL}/dashboard/household`;
    
    let params = new HttpParams()
      .set('level', 'NATIONAL')
      .set('startDate', this.formatDate(this.startDate))
      .set('endDate', this.formatDate(this.endDate));

    this.http.get<ApiResponse>(apiUrl, { params }).subscribe({
      next: (response) => {
        this.nationalData = response;
        this.prepareNationalSummaryCards();
        this.nationalDataLoading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load national summary data'
        });
        this.nationalDataLoading = false;
      }
    });
  }

  fetchDashboardData(): void {
    this.loading = true;
    this.lastUpdated = new Date();
    
    const apiUrl = `${environment.API_BASE_URL}/dashboard/household`;
    
    let params = new HttpParams()
      .set('level', this.getApiLevel())
      .set('startDate', this.formatDate(this.startDate))
      .set('endDate', this.formatDate(this.endDate));

    // Add levelId for province level only
    if (this.level === 'PROVINCE') {
      params = params.set('levelId', '1');
    }

    this.http.get<ApiResponse>(apiUrl, { params }).subscribe({
      next: (response) => {
        this.dashboardData = response;
        this.prepareChartData();
        this.loading = false;
        this.hasAppliedFilters = true;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.status === 401 ? 'Unauthorized - Please login again' : 'Failed to load dashboard data'
        });
        this.loading = false;
      }
    });
  }

  // Helper method to get API level
  getApiLevel(): string {
    // For district level display, we use national API
    return this.level === 'DISTRICT' ? 'NATIONAL' : this.level;
  }

  prepareNationalSummaryCards(): void {
    if (!this.nationalData) return;

    this.nationalSummaryCards = [];

    // Water Access Card
    if (this.nationalData.waterSupply && this.nationalData.waterSupply.length > 0) {
      const waterData = this.nationalData.waterSupply.find(item => item.waterSupplyAccess);
      if (waterData?.waterSupplyAccess) {
        const basicWater = waterData.waterSupplyAccess.basicWaterServices;
        this.nationalSummaryCards.push({
          title: 'Water Supply',
          subtitle: 'National Level Coverage',
          value: basicWater.value,
          percentage: Math.round(basicWater.percentage * 10) / 10,
          color: '#3B82F6'
        });
      }
    }

    // Sanitation Card
    if (this.nationalData.sanitation && this.nationalData.sanitation.length > 0) {
      const sanitationData = this.nationalData.sanitation.find(item => item.sanitationServicesAcess);
      if (sanitationData?.sanitationServicesAcess) {
        const basicSanitation = sanitationData.sanitationServicesAcess.basicSanitationServices;
        this.nationalSummaryCards.push({
          title: 'Sanitation',
          subtitle: 'National Level Coverage',
          value: basicSanitation.value,
          percentage: Math.round(basicSanitation.percentage * 10) / 10,
          color: '#10B981'
        });
      }
    }

    // Hygiene Card
    if (this.nationalData.hygiene && this.nationalData.hygiene.length > 0) {
      const hygieneData = this.nationalData.hygiene.find(item => item.householdsByHygieneStatus);
      if (hygieneData?.householdsByHygieneStatus) {
        const basicHygiene = hygieneData.householdsByHygieneStatus.basicHygiene;
        this.nationalSummaryCards.push({
          title: 'Hygiene',
          subtitle: 'National Level Coverage',
          value: basicHygiene.value,
          percentage: Math.round(basicHygiene.percentage * 10) / 10,
          color: '#8B5CF6'
        });
      }
    }

    // Waste Management Card (placeholder as no data provided)
    this.nationalSummaryCards.push({
      title: 'Waste Management',
      subtitle: 'National Level Coverage',
      value: 0,
      percentage: 0,
      color: '#EF4444'
    });
  }

  prepareChartData(): void {
    if (!this.dashboardData) return;
  
    this.chartData = [];
  
    // For National level with settlement type view, only show water supply charts
    if (this.level === 'NATIONAL' && this.showBySettlement) {
      // Only prepare water supply charts when showing by settlement
      if (this.dashboardData.waterSupply && this.dashboardData.waterSupply.length > 0) {
        this.prepareWaterSupplyCharts();
      }
    } else {
      // Prepare all charts for other views
      // Prepare Water Supply Charts
      if (this.dashboardData.waterSupply && this.dashboardData.waterSupply.length > 0) {
        this.prepareWaterSupplyCharts();
      }
  
      // Prepare Sanitation Charts
      if (this.dashboardData.sanitation && this.dashboardData.sanitation.length > 0) {
        this.prepareSanitationCharts();
      }
  
      // Prepare Hygiene Charts
      if (this.dashboardData.hygiene && this.dashboardData.hygiene.length > 0) {
        this.prepareHygieneCharts();
      }
    }
  }

  prepareWaterSupplyCharts(): void {
    const waterData = this.dashboardData!.waterSupply;

    // For National level, show either service type or settlement type based on selection
    if (this.level === 'NATIONAL') {
      if (this.showBySettlement) {
        // Show by settlement type (Rural vs Urban) - ONLY for water services
        const settlementData = waterData.find(item => item.waterSupplyBySettlementType);
        if (settlementData?.waterSupplyBySettlementType) {
          const settlement = settlementData.waterSupplyBySettlementType;
          this.chartData.push({
            title: 'Access of Basic Water Services by Settlement Type at National Level',
            chartType: 'pie',
            totalHouseholds: settlement.totalHhWithBasicWaterServices,
            data: {
              labels: ['Rural Households', 'Urban Households'],
              datasets: [{
                data: [settlement.ruralHouseholds.value, settlement.urbanHouseholds.value],
                percentages: [
                  Math.round(settlement.ruralHouseholds.percentage * 10) / 10,
                  Math.round(settlement.urbanHouseholds.percentage * 10) / 10
                ],
                backgroundColor: ['#10B981', '#3B82F6'],
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            }
          });
        }
      } else {
        // Show by service type (Basic, Limited, etc.)
        const accessData = waterData.find(item => item.waterSupplyAccess);
        if (accessData?.waterSupplyAccess) {
          const access = accessData.waterSupplyAccess;
          const services = [
            { name: 'Basic Water Services', data: access.basicWaterServices, color: '#3B82F6' },
            { name: 'Limited Water Services', data: access.limitedWaterServices, color: '#F59E0B' },
            { name: 'Unimproved Water Services', data: access.unimprovedWaterServices, color: '#EF4444' },
            { name: 'Surface Water Services', data: access.surfaceWaterServices, color: '#DC2626' }
          ].filter(service => service.data.value > 0);

          this.chartData.push({
            title: 'Access of Water Supply Services at National Level',
            chartType: 'pie',
            totalHouseholds: access.totalHouseholds,
            data: {
              labels: services.map(s => s.name),
              datasets: [{
                data: services.map(s => s.data.value),
                percentages: services.map(s => Math.round(s.data.percentage * 10) / 10),
                backgroundColor: services.map(s => s.color),
                borderWidth: 2,
                borderColor: '#ffffff'
              }]
            }
          });
        }
      }
    } else {
      // For Province and District levels, show bar chart by location
      const locationData = waterData.find(item => item.householdsByWaterSupplyServices);
      if (locationData?.householdsByWaterSupplyServices) {
        let locations: Array<{
          level: string;
          name: string;
          totalHouseholds: number;
          basicWaterServices: ServiceData;
          limitedWaterServices: ServiceData;
          unimprovedWaterServices: ServiceData;
          surfaceWaterServices: ServiceData;
        }>;
        
        if (this.level === 'DISTRICT') {
          locations = locationData.householdsByWaterSupplyServices
            .filter(loc => loc.level !== 'PROVINCE' && 
                          loc.level !== 'NATIONAL' && 
                          loc.name !== 'NATIONAL' && 
                          loc.name !== 'PROVINCE');
        } else if (this.level === 'PROVINCE') {
          locations = locationData.householdsByWaterSupplyServices
            .filter(loc => loc.level === 'PROVINCE');
        } else {
          locations = [];
        }

        if (locations.length > 0) {
          const processedLocations = locations.map(loc => {
            const total = (loc.basicWaterServices.percentage || 0) + 
                         (loc.limitedWaterServices.percentage || 0) + 
                         (loc.unimprovedWaterServices.percentage || 0) + 
                         (loc.surfaceWaterServices.percentage || 0);
            
            const factor = total > 0 ? 100 / total : 0;
            
            return {
              name: loc.name,
              basic: Math.round((loc.basicWaterServices.percentage || 0) * factor * 100) / 100,
              limited: Math.round((loc.limitedWaterServices.percentage || 0) * factor * 100) / 100,
              unimproved: Math.round((loc.unimprovedWaterServices.percentage || 0) * factor * 100) / 100,
              surface: Math.round((loc.surfaceWaterServices.percentage || 0) * factor * 100) / 100
            };
          });

          this.chartData.push({
            title: `Access of Water Supply Services at ${this.level === 'DISTRICT' ? 'District' : 'Province'} Level`,
            chartType: 'bar',
            totalHouseholds: locations.reduce((sum, loc) => sum + loc.totalHouseholds, 0),
            data: {
              labels: locations.map(loc => loc.name),
              datasets: [
                {
                  label: 'Basic Water Services',
                  data: processedLocations.map(loc => loc.basic),
                  backgroundColor: '#3B82F6'
                },
                {
                  label: 'Limited Water Services',
                  data: processedLocations.map(loc => loc.limited),
                  backgroundColor: '#F59E0B'
                },
                {
                  label: 'Unimproved Water Services',
                  data: processedLocations.map(loc => loc.unimproved),
                  backgroundColor: '#EF4444'
                },
                {
                  label: 'Surface Water Services',
                  data: processedLocations.map(loc => loc.surface),
                  backgroundColor: '#DC2626'
                }
              ]
            }
          });
        }
      }
    }
  }

  prepareSanitationCharts(): void {
    const sanitationData = this.dashboardData!.sanitation;

    if (this.level === 'NATIONAL') {
      const accessData = sanitationData.find(item => item.sanitationServicesAcess);
      if (accessData?.sanitationServicesAcess) {
        const access = accessData.sanitationServicesAcess;
        const services = [
          { name: 'Safely Managed', data: access.safelyManagedSanitationServices, color: '#10B981' },
          { name: 'Basic Services', data: access.basicSanitationServices, color: '#3B82F6' },
          { name: 'Limited Services', data: access.limitedSanitationServices, color: '#F59E0B' },
          { name: 'Unimproved Services', data: access.unimprovedSanitationServices, color: '#EF4444' },
          { name: 'Open Defecation', data: access.openDefecationServices, color: '#DC2626' }
        ].filter(service => service.data.value > 0);

        this.chartData.push({
          title: 'Access of Sanitation Services at National Level',
          chartType: 'pie',
          totalHouseholds: access.totalHouseholds,
          data: {
            labels: services.map(s => s.name),
            datasets: [{
              data: services.map(s => s.data.value),
              percentages: services.map(s => Math.round(s.data.percentage * 10) / 10),
              backgroundColor: services.map(s => s.color),
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          }
        });
      }
    } else {
      const locationData = sanitationData.find(item => item.householdsBySanitationServices);
      if (locationData?.householdsBySanitationServices) {
        let locations: Array<{
          level: string;
          name: string;
          totalHouseholds: number;
          safelyManagedSanitationServices: ServiceData;
          basicSanitationServices: ServiceData;
          limitedSanitationServices: ServiceData;
          unimprovedSanitationServices: ServiceData;
          openDefecationServices: ServiceData;
        }>;
        
        if (this.level === 'DISTRICT') {
          locations = locationData.householdsBySanitationServices
            .filter(loc => loc.level !== 'PROVINCE' && 
                          loc.level !== 'NATIONAL' && 
                          loc.name !== 'NATIONAL' && 
                          loc.name !== 'PROVINCE');
        } else if (this.level === 'PROVINCE') {
          locations = locationData.householdsBySanitationServices
            .filter(loc => loc.level === 'PROVINCE');
        } else {
          locations = [];
        }

        if (locations.length > 0) {
          const processedLocations = locations.map(loc => {
            const total = (loc.safelyManagedSanitationServices.percentage || 0) + 
                         (loc.basicSanitationServices.percentage || 0) + 
                         (loc.limitedSanitationServices.percentage || 0) + 
                         (loc.unimprovedSanitationServices.percentage || 0) + 
                         (loc.openDefecationServices.percentage || 0);
            
            const factor = total > 0 ? 100 / total : 0;
            
            return {
              name: loc.name,
              safelyManaged: (loc.safelyManagedSanitationServices.percentage || 0) * factor,
              basic: (loc.basicSanitationServices.percentage || 0) * factor,
              limited: (loc.limitedSanitationServices.percentage || 0) * factor,
              unimproved: (loc.unimprovedSanitationServices.percentage || 0) * factor,
              openDefecation: (loc.openDefecationServices.percentage || 0) * factor
            };
          });

          this.chartData.push({
            title: `Access of Sanitation Services at ${this.level === 'DISTRICT' ? 'District' : 'Province'} Level`,
            chartType: 'bar',
            totalHouseholds: locations.reduce((sum, loc) => sum + loc.totalHouseholds, 0),
            data: {
              labels: locations.map(loc => loc.name),
              datasets: [
                {
                  label: 'Safely Managed',
                  data: processedLocations.map(loc => Math.round(loc.safelyManaged * 100) / 100),
                  backgroundColor: '#10B981'
                },
                {
                  label: 'Basic Services',
                  data: processedLocations.map(loc => Math.round(loc.basic * 100) / 100),
                  backgroundColor: '#3B82F6'
                },
                {
                  label: 'Limited Services',
                  data: processedLocations.map(loc => Math.round(loc.limited * 100) / 100),
                  backgroundColor: '#F59E0B'
                },
                {
                  label: 'Unimproved Services',
                  data: processedLocations.map(loc => Math.round(loc.unimproved * 100) / 100),
                  backgroundColor: '#EF4444'
                },
                {
                  label: 'Open Defecation',
                  data: processedLocations.map(loc => Math.round(loc.openDefecation * 100) / 100),
                  backgroundColor: '#DC2626'
                }
              ]
            }
          });
        }
      }
    }
  }

  prepareHygieneCharts(): void {
    const hygieneData = this.dashboardData!.hygiene;

    if (this.level === 'NATIONAL') {
      const statusData = hygieneData.find(item => item.householdsByHygieneStatus);
      if (statusData?.householdsByHygieneStatus) {
        const status = statusData.householdsByHygieneStatus;
        const services = [
          { name: 'Basic Hygiene', data: status.basicHygiene, color: '#8B5CF6' },
          { name: 'Limited Hygiene', data: status.limitedHygiene, color: '#F59E0B' },
          { name: 'No Hygiene', data: status.noHygiene, color: '#EF4444' }
        ].filter(service => service.data.value > 0);

        this.chartData.push({
          title: 'Access of Hygiene Services at National Level',
          chartType: 'pie',
          totalHouseholds: status.totalHouseholds,
          data: {
            labels: services.map(s => s.name),
            datasets: [{
              data: services.map(s => s.data.value),
              percentages: services.map(s => Math.round(s.data.percentage * 10) / 10),
              backgroundColor: services.map(s => s.color),
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          }
        });
      }
    } else {
      const locationData = hygieneData.find(item => item.householdsByHygieneServices);
      if (locationData?.householdsByHygieneServices) {
        let locations: Array<{
          level: string;
          name: string;
          totalHouseholds: number;
          basicHygiene: ServiceData;
          limitedHygiene: ServiceData;
          noHygiene: ServiceData;
        }>;
        
        if (this.level === 'DISTRICT') {
          locations = locationData.householdsByHygieneServices
            .filter(loc => loc.level !== 'PROVINCE' && 
                          loc.level !== 'NATIONAL' && 
                          loc.name !== 'NATIONAL' && 
                          loc.name !== 'PROVINCE');
        } else if (this.level === 'PROVINCE') {
          locations = locationData.householdsByHygieneServices
            .filter(loc => loc.level === 'PROVINCE');
        } else {
          locations = [];
        }

        if (locations.length > 0) {
          const processedLocations = locations.map(loc => {
            const total = (loc.basicHygiene.percentage || 0) + 
                         (loc.limitedHygiene.percentage || 0) + 
                         (loc.noHygiene.percentage || 0);
            
            const factor = total > 0 ? 100 / total : 0;
            
            return {
              name: loc.name,
              basic: (loc.basicHygiene.percentage || 0) * factor,
              limited: (loc.limitedHygiene.percentage || 0) * factor,
              none: (loc.noHygiene.percentage || 0) * factor
            };
          });

          this.chartData.push({
            title: `Access of Hygiene Services at ${this.level === 'DISTRICT' ? 'District' : 'Province'} Level`,
            chartType: 'bar',
            totalHouseholds: locations.reduce((sum, loc) => sum + loc.totalHouseholds, 0),
            data: {
              labels: locations.map(loc => loc.name),
              datasets: [
                {
                  label: 'Basic Hygiene',
                  data: processedLocations.map(loc => Math.round(loc.basic * 100) / 100),
                  backgroundColor: '#8B5CF6'
                },
                {
                  label: 'Limited Hygiene',
                  data: processedLocations.map(loc => Math.round(loc.limited * 100) / 100),
                  backgroundColor: '#F59E0B'
                },
                {
                  label: 'No Hygiene',
                  data: processedLocations.map(loc => Math.round(loc.none * 100) / 100),
                  backgroundColor: '#EF4444'
                }
              ]
            }
          });
        }
      }
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  applyFilters(): void {
    this.fetchDashboardData();
  }

  onFilterChange(): void {
    // Apply filters immediately when any filter value changes
    this.fetchDashboardData();
  }

  onChartTypeChange(): void {
    // Only refresh chart data without API call
    this.prepareChartData();
  }

  getChartOptions(chartType: string): any {
    const baseOptions = {
      ...this.chartOptions,
      animation: { duration: 0 }, 
      transitions: {
        active: { animation: { duration: 0 } },
        show: { animations: { appear: { duration: 0 } } },
        hide: { animations: { disappear: { duration: 0 } } }
      },
      plugins: {
        ...this.chartOptions?.plugins,
        tooltip: {
          ...this.chartOptions?.plugins?.tooltip,
          animation: { duration: 0 }
        }
      }
    };
  
    switch (chartType) {
      case 'pie':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              ...baseOptions.plugins?.legend,
              position: 'right'
            }
          }
        };
  
      case 'bar':
        return {
          ...baseOptions,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            ...baseOptions.plugins,
            legend: { position: 'bottom' },
            tooltip: {
              ...baseOptions.plugins?.tooltip,
              callbacks: {
                label: (context: any) => {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y || 0;
                  return `${label}: ${value.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              ticks: {
                maxRotation: 45,
                minRotation: 0,
                font: { size: 10 }
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function (value: any): string {
                  return value + '%';
                }
              }
            }
          }
        };
  
      default:
        return baseOptions;
    }
  }
  

  getCurrentLevelDisplayName(): string {
    return this.level.charAt(0).toUpperCase() + this.level.slice(1).toLowerCase();
  }

  getLocationBreadcrumb(): string {
    switch (this.level) {
      case 'NATIONAL':
        return 'Rwanda (National Level)';
      case 'PROVINCE':
        return 'Rwanda > All Provinces';
      case 'DISTRICT':
        return 'Rwanda > All Districts';
      default:
        return 'Rwanda';
    }
  }

  refreshData(): void {
    this.fetchNationalData();
    if (this.hasAppliedFilters) {
      this.fetchDashboardData();
    }
  }
  isShowingBySettlement(): boolean {
    return this.isNationalLevel() && this.showBySettlement;
  }
  isShowingByServiceType(): boolean {
    return this.isNationalLevel() && !this.showBySettlement;
  }
  isNationalLevel(): boolean {
    return this.level === 'NATIONAL';
  }

  isProvinceOrDistrictLevel(): boolean {
    return ['PROVINCE', 'DISTRICT'].includes(this.level);
  }

  trackByTitle(index: number, item: ChartData): string {
    return item.title;
  }

  hasWaterData(): boolean {
    return !!(this.dashboardData?.waterSupply && this.dashboardData.waterSupply.length > 0);
  }
}