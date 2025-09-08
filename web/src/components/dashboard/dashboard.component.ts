import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';

interface SelectOption {
  label: string;
  value: string | number;
}

interface ChartData {
  title: string;
  chartType: 'line' | 'bar' | 'pie';
  data: any;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, DropdownModule, ChartModule, ToastModule]
})
export class DashboardComponent implements OnInit {
  // Filters
  period: 'WEEK' | 'MONTH' | 'YEAR' = 'WEEK';
  periodOptions: SelectOption[] = [
    { label: 'This Week', value: 'WEEK' },
    { label: 'This Month', value: 'MONTH' },
    { label: 'This Year', value: 'YEAR' }
  ];

  // KPI cards
  totalCustomers = 0;
  totalAppointments = 0;
  returningRate = 0; // %
  totalRevenue = 0;  // $

  // Charts
  visitsChart: ChartData = { title: 'Visits Over Time', chartType: 'line', data: {} };
  revenueChart: ChartData = { title: 'Revenue Trend', chartType: 'bar', data: {} };
  servicesPieChart: ChartData = { title: 'Service Mix', chartType: 'pie', data: {} };
  topServicesChart: ChartData = { title: 'Top Services', chartType: 'bar', data: {} };

  chartOptions: any;

  ngOnInit(): void {
    this.initChartOptions();
    this.refreshWithDummyData();
  }

  initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true } },
        tooltip: { enabled: true }
      }
    };
  }

  onPeriodChange(): void {
    this.refreshWithDummyData();
  }

  private refreshWithDummyData(): void {
    // Generate dummy series by period
    if (this.period === 'WEEK') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const visits = [22, 30, 28, 35, 41, 52, 46];
      const revenue = [120, 180, 160, 210, 260, 320, 280];

      this.setKpis(visits, revenue, 0.42);
      this.setVisitsChart(days, visits);
      this.setRevenueChart(days, revenue);
    } else if (this.period === 'MONTH') {
      const weeks = ['W1', 'W2', 'W3', 'W4'];
      const visits = [140, 155, 170, 160];
      const revenue = [880, 960, 1040, 980];

      this.setKpis(visits, revenue, 0.45);
      this.setVisitsChart(weeks, visits);
      this.setRevenueChart(weeks, revenue);
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const visits = [520, 480, 610, 700, 740, 780, 820, 790, 760, 810, 850, 900];
      const revenue = [3200, 3000, 3800, 4200, 4480, 4700, 4980, 4920, 4800, 5050, 5300, 5600];

      this.setKpis(visits, revenue, 0.48);
      this.setVisitsChart(months, visits);
      this.setRevenueChart(months, revenue);
    }

    // Static dummy service mix and top services
    const serviceMixLabels = ['Haircut', 'Braids', 'Color', 'Treatment', 'Shave', 'Manicure'];
    const serviceMixValues = [35, 20, 15, 10, 12, 8];

    this.servicesPieChart = {
      title: 'Service Mix',
            chartType: 'pie',
            data: {
        labels: serviceMixLabels,
              datasets: [{
          data: serviceMixValues,
          backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      }
    };

    const topServicesCounts = [120, 96, 72, 54, 48];
    const topServicesNames = ['Haircut', 'Braids', 'Color', 'Treatment', 'Shave'];
    this.topServicesChart = {
      title: 'Top Services',
      chartType: 'bar',
            data: {
        labels: topServicesNames,
              datasets: [{
          label: 'Appointments',
          data: topServicesCounts,
          backgroundColor: '#5A8621'
        }]
      }
    };
  }

  private setKpis(visitsSeries: number[], revenueSeries: number[], returning: number): void {
    this.totalCustomers = visitsSeries.reduce((a, b) => a + b, 0);
    this.totalAppointments = Math.round(this.totalCustomers * 0.95);
    this.returningRate = Math.round(returning * 100);
    this.totalRevenue = revenueSeries.reduce((a, b) => a + b, 0);
  }

  private setVisitsChart(labels: string[], values: number[]): void {
    this.visitsChart = {
      title: 'Visits Over Time',
      chartType: 'line',
          data: {
        labels,
            datasets: [{
          label: 'Customers',
          data: values,
          borderColor: '#5A8621',
          backgroundColor: 'rgba(90,134,33,0.15)',
          fill: true,
          tension: 0.35
        }]
      }
    };
  }

  private setRevenueChart(labels: string[], values: number[]): void {
    this.revenueChart = {
      title: 'Revenue Trend',
            chartType: 'bar',
            data: {
        labels,
        datasets: [{
          label: 'Revenue ($)',
          data: values,
                  backgroundColor: '#3B82F6'
        }]
      }
    };
  }

  getChartOptions(): any {
    return this.chartOptions;
  }
}