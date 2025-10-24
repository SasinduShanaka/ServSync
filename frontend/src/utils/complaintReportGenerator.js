import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class ComplaintReportGenerator {
  constructor(complaints = []) {
    this.complaints = complaints;
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.yPosition = this.margin;
    this.lineHeight = 6;
    this.colors = {
      primary: [37, 99, 235],
      secondary: [75, 85, 99],
      success: [16, 185, 129],
      warning: [245, 158, 11],
      danger: [239, 68, 68],
      muted: [156, 163, 175]
    };
  }

  // Check if we need a new page
  checkPageBreak(requiredSpace = 15) {
    if (this.yPosition + requiredSpace > this.pageHeight - 30) {
      this.pdf.addPage();
      this.yPosition = this.margin;
      return true;
    }
    return false;
  }

  // Add modern header with enhanced branding
  addModernHeader() {
    // Modern solid background (gradient not supported in jsPDF)
    this.pdf.setFillColor(30, 58, 138);
    this.pdf.rect(0, 0, this.pageWidth, 45, 'F');
    
    // Company branding section
    this.pdf.setFillColor(255, 255, 255);
    this.pdf.roundedRect(this.margin, 10, 50, 25, 4, 4, 'F');
    
    // Modern logo design
    this.pdf.setFontSize(16);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(30, 58, 138);
    this.pdf.text('ServSync', this.margin + 4, 20);
    
    this.pdf.setFontSize(8);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(100, 116, 139);
    this.pdf.text('Analytics Platform', this.margin + 4, 28);
    
    // Modern report title section
    this.pdf.setFontSize(24);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text('COMPLAINT ANALYTICS', this.pageWidth - this.margin, 20, { align: 'right' });
    
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(203, 213, 225);
    this.pdf.text('Comprehensive Business Intelligence Report', this.pageWidth - this.margin, 28, { align: 'right' });
    
    // Generation timestamp
    const today = new Date();
    this.pdf.setFontSize(9);
    this.pdf.setTextColor(148, 163, 184);
    this.pdf.text(`Generated: ${today.toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}`, this.pageWidth - this.margin, 36, { align: 'right' });
    
    this.yPosition = 60;
  }

  // Add executive summary with key metrics
  addExecutiveSummary() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    this.addSectionHeader('EXECUTIVE SUMMARY', 16);
    
    // Create metric cards layout
    const cardWidth = (this.contentWidth - 15) / 4; // 4 cards with spacing
    const cardHeight = 25;
    const cardStartY = this.yPosition;
    
    const metrics = this.analyticsData ? [
      { title: 'Total Complaints', value: analytics.summary.totalComplaints, color: this.colors.primary, icon: '[C]' },
      { title: 'Resolution Rate', value: `${analytics.summary.resolutionRate}%`, color: this.colors.success, icon: '[R]' },
      { title: 'Avg Resolution', value: `${analytics.summary.avgResolutionTime} days`, color: this.colors.warning, icon: '[T]' },
      { title: 'Pending Cases', value: analytics.summary.pendingComplaints, color: this.colors.danger, icon: '[P]' }
    ] : [
      { title: 'Total Complaints', value: analytics.total, color: this.colors.primary, icon: '[C]' },
      { title: 'Resolution Rate', value: `${((analytics.resolvedCount / analytics.total) * 100).toFixed(1)}%`, color: this.colors.success, icon: '[R]' },
      { title: 'Resolved Cases', value: analytics.resolvedCount, color: this.colors.success, icon: '[S]' },
      { title: 'Active Cases', value: analytics.total - analytics.resolvedCount, color: this.colors.warning, icon: '[A]' }
    ];
    
    metrics.forEach((metric, index) => {
      const x = this.margin + (index * (cardWidth + 5));
      
      // Card background
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.roundedRect(x, cardStartY, cardWidth, cardHeight, 2, 2, 'F');
      
      // Card border
      this.pdf.setDrawColor(226, 232, 240);
      this.pdf.setLineWidth(0.5);
      this.pdf.roundedRect(x, cardStartY, cardWidth, cardHeight, 2, 2, 'S');
      
      // Icon (using text instead of emoji)
      this.pdf.setFontSize(12);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      this.pdf.text(metric.icon, x + 3, cardStartY + 8);
      
      // Value
      this.pdf.setFontSize(14);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      this.pdf.text(String(metric.value), x + 3, cardStartY + 16);
      
      // Title
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.text(metric.title, x + 3, cardStartY + 22);
    });
    
    this.yPosition = cardStartY + cardHeight + 15;
    
    // Key insights
    this.addText('KEY INSIGHTS:', 12, 0, this.colors.secondary);
    this.yPosition += 2;
    
    const insights = this.generateInsights(analytics);
    insights.forEach(insight => {
      this.addText(`- ${insight}`, 10, 5, this.colors.secondary);
    });
    
    this.yPosition += 10;
  }

  // Generate intelligent insights
  generateInsights(analytics) {
    const insights = [];
    
    if (this.analyticsData) {
      const summary = analytics.summary;
      const distributions = analytics.distributions;
      
      // Resolution rate insight
      if (summary.resolutionRate >= 80) {
        insights.push(`Excellent resolution rate of ${summary.resolutionRate}% indicates strong customer service performance.`);
      } else if (summary.resolutionRate >= 60) {
        insights.push(`Moderate resolution rate of ${summary.resolutionRate}% suggests room for process improvement.`);
      } else {
        insights.push(`Low resolution rate of ${summary.resolutionRate}% requires immediate attention and process optimization.`);
      }
      
      // Top category insight
      if (distributions.category.length > 0) {
        const topCategory = distributions.category.sort((a, b) => b.value - a.value)[0];
        insights.push(`"${topCategory.name}" is the most common complaint category with ${topCategory.value} cases (${((topCategory.value / summary.totalComplaints) * 100).toFixed(1)}%).`);
      }
      
      // Status distribution insight
      if (summary.pendingComplaints > summary.totalComplaints * 0.3) {
        insights.push(`High number of pending complaints (${summary.pendingComplaints}) may indicate resource constraints or process bottlenecks.`);
      }
      
    } else {
      // Fallback insights
      const resolutionRate = ((analytics.resolvedCount / analytics.total) * 100).toFixed(1);
      insights.push(`Overall resolution rate is ${resolutionRate}% based on ${analytics.total} total complaints.`);
      
      if (Object.keys(analytics.categoryCounts).length > 0) {
        const topCategory = Object.entries(analytics.categoryCounts).sort(([,a], [,b]) => b - a)[0];
        insights.push(`"${topCategory[0]}" category represents the highest volume with ${topCategory[1]} complaints.`);
      }
    }
    
    return insights;
  }

  // Add modern section header
  addSectionHeader(title, fontSize = 14) {
    this.checkPageBreak(20);
    
    // Modern section header with background card
    const cardHeight = 16;
    const cardPadding = 8;
    
    // Gradient background for header
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, cardHeight, 3, 3, 'F');
    
    // Accent border (left side)
    this.pdf.setFillColor(59, 130, 246);
    this.pdf.roundedRect(this.margin, this.yPosition, 4, cardHeight, 2, 2, 'F');
    
    // Title text
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text(title, this.margin + cardPadding + 4, this.yPosition + (cardHeight / 2) + 2);
    
    this.yPosition += cardHeight + 8;
  }

  // Add regular text
  addText(text, fontSize = 10, indent = 0, color = [0, 0, 0]) {
    this.checkPageBreak(8);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(color[0], color[1], color[2]);
    
    // Handle long text by splitting it
    const lines = this.pdf.splitTextToSize(text, this.contentWidth - indent);
    
    lines.forEach(line => {
      this.checkPageBreak(6);
      this.pdf.text(line, this.margin + indent, this.yPosition);
      this.yPosition += this.lineHeight;
    });
  }

  // Add key-value pair
  addKeyValue(key, value, indent = 0) {
    this.checkPageBreak(8);
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.text(`${key}:`, this.margin + indent, this.yPosition);
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(String(value), this.margin + indent + 45, this.yPosition);
    this.yPosition += this.lineHeight;
  }

  // Calculate analytics from complaints data
  calculateAnalytics() {
    const total = this.complaints.length;
    
    // Status distribution
    const statusCounts = this.complaints.reduce((acc, complaint) => {
      const status = complaint.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Category distribution
    const categoryCounts = this.complaints.reduce((acc, complaint) => {
      const category = complaint.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Branch distribution
    const branchCounts = this.complaints.reduce((acc, complaint) => {
      const branch = complaint.branch || complaint.customer?.branch || 'Unknown';
      acc[branch] = (acc[branch] || 0) + 1;
      return acc;
    }, {});

    // Monthly trend
    const monthlyTrend = this.complaints.reduce((acc, complaint) => {
      if (complaint.createdAt) {
        const date = new Date(complaint.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {});

    // Resolution time for resolved complaints
    const resolvedComplaints = this.complaints.filter(c => 
      c.status === 'resolved' && c.createdAt && c.updatedAt
    );
    
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalHours = resolvedComplaints.reduce((sum, complaint) => {
        const created = new Date(complaint.createdAt);
        const updated = new Date(complaint.updatedAt);
        return sum + (updated - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = totalHours / resolvedComplaints.length;
    }

    return {
      total,
      statusCounts,
      categoryCounts,
      branchCounts,
      monthlyTrend,
      avgResolutionHours,
      resolvedCount: resolvedComplaints.length
    };
  }

  // Add executive summary
  addExecutiveSummary() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    const today = new Date().toLocaleDateString();
    
    this.addSectionHeader('Executive Summary');
    
    if (this.analyticsData) {
      // Use server-provided analytics
      const summary = analytics.summary;
      this.addKeyValue('Report Generated', today);
      this.addKeyValue('Total Complaints', summary.totalComplaints);
      this.addKeyValue('Resolved Complaints', summary.resolvedComplaints);
      this.addKeyValue('Resolution Rate', `${summary.resolutionRate}%`);
      this.addKeyValue('Pending Complaints', summary.pendingComplaints);
      this.addKeyValue('In Progress', summary.inProgressComplaints);
      this.addKeyValue('Escalated', summary.escalatedComplaints);
      
      if (summary.avgResolutionTime > 0) {
        this.addKeyValue('Avg Resolution Time', `${summary.avgResolutionTime} days`);
      }
    } else {
      // Fallback to calculated analytics
      this.addKeyValue('Report Generated', today);
      this.addKeyValue('Total Complaints', analytics.total);
      this.addKeyValue('Resolved Complaints', analytics.resolvedCount);
      this.addKeyValue('Resolution Rate', `${((analytics.resolvedCount / analytics.total) * 100).toFixed(1)}%`);
      
      if (analytics.avgResolutionHours > 0) {
        const avgDays = (analytics.avgResolutionHours / 24).toFixed(1);
        this.addKeyValue('Avg Resolution Time', `${avgDays} days`);
      }
    }

    this.yPosition += 10;
  }

  // Add detailed analytics section with modern visualization
  addDetailedAnalytics() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    this.addSectionHeader('DETAILED ANALYTICS', 16);
    
    if (this.analyticsData) {
      const distributions = analytics.distributions;
      
      this.addSubsectionHeader('Status Distribution Analysis');
      this.addAnalyticsTable([
        ['Status', 'Count', 'Percentage', 'Trend'],
        ...distributions.status.map(item => {
          const percentage = ((item.value / analytics.summary.totalComplaints) * 100).toFixed(1);
          const trend = this.getStatusTrend(item.name);
          return [this.capitalizeStatus(item.name), item.value.toString(), `${percentage}%`, trend];
        })
      ]);

      this.yPosition += 10;

      // Category Analysis - Start on new page
      this.pdf.addPage();
      this.yPosition = this.margin;
      
      this.addSubsectionHeader('Category Performance Analysis');
      this.addAnalyticsTable([
        ['Category', 'Volume', 'Percentage', 'Priority'],
        ...distributions.category.map((item, index) => {
          const percentage = ((item.value / analytics.summary.totalComplaints) * 100).toFixed(1);
          const priority = index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low';
          return [item.name, item.value.toString(), `${percentage}%`, priority];
        })
      ]);

      this.yPosition += 10;

      // Branch Performance
      this.addSubsectionHeader('Branch Performance Overview');
      this.addAnalyticsTable([
        ['Branch', 'Complaints', 'Percentage', 'Performance'],
        ...distributions.branch.map(item => {
          const percentage = ((item.value / analytics.summary.totalComplaints) * 100).toFixed(1);
          const performance = parseFloat(percentage) > 30 ? 'Needs Attention' : parseFloat(percentage) > 20 ? 'Monitor' : 'Good';
          return [item.name, item.value.toString(), `${percentage}%`, performance];
        })
      ]);

    } else {
      // Fallback detailed analytics
      this.addSubsectionHeader('Status Distribution');
      Object.entries(analytics.statusCounts).forEach(([status, count]) => {
        const percentage = ((count / analytics.total) * 100).toFixed(1);
        this.addText(`- ${this.capitalizeStatus(status)}: ${count} complaints (${percentage}%)`, 10, 5);
      });

      this.yPosition += 8;

      this.addSubsectionHeader('Category Analysis');
      Object.entries(analytics.categoryCounts).forEach(([category, count]) => {
        const percentage = ((count / analytics.total) * 100).toFixed(1);
        this.addText(`- ${category}: ${count} complaints (${percentage}%)`, 10, 5);
      });
    }

    this.yPosition += 15;
  }

  // Add modern analytics table with better alignment
  addAnalyticsTable(data) {
    if (data.length === 0) return;
    
    const colWidths = [45, 25, 25, 35]; // Better balanced column widths
    const rowHeight = 10; // Increased for better readability
    const tableStartY = this.yPosition;
    
    // Modern table header with enhanced styling
    this.pdf.setFillColor(30, 64, 175);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, rowHeight, 2, 2, 'F');
    
    this.pdf.setFontSize(9);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    
    let xPos = this.margin + 4;
    data[0].forEach((header, i) => {
      // Center align headers for numeric columns
      if (i === 1 || i === 2) {
        const headerWidth = this.pdf.getTextWidth(header);
        const centeredX = xPos + (colWidths[i] - headerWidth) / 2;
        this.pdf.text(header, centeredX, this.yPosition + 6.5);
      } else {
        this.pdf.text(header, xPos, this.yPosition + 6.5);
      }
      xPos += colWidths[i];
    });
    
    this.yPosition += rowHeight;
    
    // Enhanced table rows with modern styling
    data.slice(1).forEach((row, index) => {
      this.checkPageBreak(rowHeight + 5);
      
      // Modern alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(249, 250, 251);
      } else {
        this.pdf.setFillColor(255, 255, 255);
      }
      this.pdf.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(15, 23, 42);
      
      xPos = this.margin + 4;
      row.forEach((cell, i) => {
        // Enhanced color coding for specific columns
        if (i === 3) { // Priority/Performance column
          if (cell.includes('Needs Attention') || cell.includes('High')) {
            this.pdf.setTextColor(220, 38, 38);
          } else if (cell.includes('Monitor') || cell.includes('Medium')) {
            this.pdf.setTextColor(217, 119, 6);
          } else if (cell.includes('Good') || cell.includes('Low')) {
            this.pdf.setTextColor(22, 163, 74);
          } else {
            this.pdf.setTextColor(15, 23, 42);
          }
        } else {
          this.pdf.setTextColor(15, 23, 42);
        }
        
        // Handle text properly based on column
        let cellText = String(cell);
        const maxWidth = colWidths[i] - 8;
        
        // Truncate text if too long
        while (this.pdf.getTextWidth(cellText) > maxWidth && cellText.length > 3) {
          cellText = cellText.slice(0, -1);
        }
        if (this.pdf.getTextWidth(cellText) > maxWidth) {
          cellText = cellText.slice(0, -3) + '...';
        }
        
        // Position text based on column type
        if (i === 1 || i === 2) { // Volume and Percentage columns - center align
          const textWidth = this.pdf.getTextWidth(cellText);
          const centeredX = xPos + (colWidths[i] - textWidth) / 2;
          this.pdf.text(cellText, centeredX, this.yPosition + 6.5);
        } else { // Category and Priority columns - left align
          this.pdf.text(cellText, xPos, this.yPosition + 6.5);
        }
        
        xPos += colWidths[i];
      });
      
      this.yPosition += rowHeight;
    });
    
    // Modern table border with column separators
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, tableStartY, this.contentWidth, this.yPosition - tableStartY, 2, 2, 'S');
    
    // Add column separators for clarity
    this.pdf.setDrawColor(241, 245, 249);
    this.pdf.setLineWidth(0.3);
    xPos = this.margin;
    colWidths.forEach((width, i) => {
      if (i < colWidths.length - 1) {
        xPos += width;
        this.pdf.line(xPos, tableStartY, xPos, this.yPosition);
      }
    });
    
    this.yPosition += 10;
  }

  // Helper methods
  capitalizeStatus(status) {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getStatusTrend(status) {
    // Mock trend data - in real implementation, this would compare with previous periods
    const trends = {
      'pending': '+5%',
      'in-progress': 'Stable',
      'resolved': '+12%',
      'escalated': '-3%'
    };
    return trends[status] || 'New';
  }

  addSubsectionHeader(title) {
    this.checkPageBreak(15);
    
    // Modern subsection header with subtle styling
    const headerHeight = 12;
    
    // Subtle background
    this.pdf.setFillColor(252, 252, 253);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, headerHeight, 2, 2, 'F');
    
    // Left accent line
    this.pdf.setFillColor(99, 102, 241);
    this.pdf.rect(this.margin + 4, this.yPosition + 3, 2, headerHeight - 6, 'F');
    
    // Title text
    this.pdf.setFontSize(12);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(51, 65, 85);
    this.pdf.text(title, this.margin + 12, this.yPosition + 8);
    
    this.yPosition += headerHeight + 6;
  }

  // Add modern complaint details table
  addComplaintDetailsTable() {
    // Start complaint details on a new page
    this.pdf.addPage();
    this.yPosition = this.margin;
    
    this.addSectionHeader('COMPLAINT DETAILS', 16);
    
    if (this.complaints.length === 0) {
      // Modern empty state
      this.pdf.setFillColor(249, 250, 251);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 25, 3, 3, 'F');
      
      this.pdf.setFontSize(10);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.text('No complaint details available to display.', this.margin + 10, this.yPosition + 15);
      
      this.yPosition += 30;
      return;
    }
    
    // Enhanced table design with better proportions
    const tableStartY = this.yPosition;
    const rowHeight = 10; // Increased height for better header visibility
    const colWidths = [30, 40, 20, 18, 20, 22]; // Adjusted Date column to 22 units
    
    // Modern table header with enhanced styling
    this.pdf.setFillColor(30, 64, 175);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, rowHeight, 2, 2, 'F');
    
    this.pdf.setFontSize(9); // Increased font size for headers
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    
    const headers = ['Reference ID', 'Customer', 'Category', 'Status', 'Branch', 'Date'];
    let xPos = this.margin + 5; // Increased padding
    headers.forEach((header, i) => {
      // Center align shorter headers, left align longer ones
      if (header.length <= 8) {
        const headerWidth = this.pdf.getTextWidth(header);
        const centeredX = xPos + (colWidths[i] - headerWidth) / 2;
        this.pdf.text(header, centeredX, this.yPosition + 6.5);
      } else {
        this.pdf.text(header, xPos, this.yPosition + 6.5);
      }
      xPos += colWidths[i];
    });
    
    this.yPosition += rowHeight;

    // Enhanced table rows (limit to first 25 for readability)
    const displayComplaints = this.complaints.slice(0, 25);
    
    displayComplaints.forEach((complaint, index) => {
      if (this.checkPageBreak(rowHeight + 5)) {
        // Redraw header on new page with improved styling
        this.pdf.setFillColor(30, 64, 175);
        this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, rowHeight, 2, 2, 'F');
        
        this.pdf.setFontSize(9); // Match the improved header font size
        this.pdf.setFont("helvetica", "bold");
        this.pdf.setTextColor(255, 255, 255);
        
        xPos = this.margin + 5; // Match the improved padding
        headers.forEach((header, i) => {
          // Center align shorter headers, left align longer ones
          if (header.length <= 8) {
            const headerWidth = this.pdf.getTextWidth(header);
            const centeredX = xPos + (colWidths[i] - headerWidth) / 2;
            this.pdf.text(header, centeredX, this.yPosition + 6.5);
          } else {
            this.pdf.text(header, xPos, this.yPosition + 6.5);
          }
          xPos += colWidths[i];
        });
        this.yPosition += rowHeight;
      }

      // Modern alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(249, 250, 251);
      } else {
        this.pdf.setFillColor(255, 255, 255);
      }
      this.pdf.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(15, 23, 42);
      
      const rowData = [
        complaint.referenceId || 'N/A',
        complaint.customer?.name || complaint.name || 'N/A',
        complaint.category || 'N/A',
        complaint.status || 'N/A',
        complaint.branch || complaint.customer?.branch || 'N/A',
        complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }) : 'N/A'
      ];

      xPos = this.margin + 5; // Match the improved padding
      rowData.forEach((data, i) => {
        // Status color coding
        if (i === 3) { // Status column
          const status = String(data).toLowerCase();
          if (status.includes('resolved')) {
            this.pdf.setTextColor(22, 163, 74); // Green
          } else if (status.includes('pending')) {
            this.pdf.setTextColor(217, 119, 6); // Orange
          } else if (status.includes('escalated')) {
            this.pdf.setTextColor(220, 38, 38); // Red
          } else {
            this.pdf.setTextColor(15, 23, 42);
          }
        } else {
          this.pdf.setTextColor(15, 23, 42);
        }
        
        let text = String(data);
        const maxWidth = colWidths[i] - 6; // Reduced padding for more space
        
        // Special handling for different columns
        if (i === 0) { // Reference ID - truncate intelligently
          if (this.pdf.getTextWidth(text) > maxWidth) {
            // Show first part and last part with ellipsis in middle
            const parts = text.split('-');
            if (parts.length >= 3) {
              text = parts[0] + '-...' + parts[parts.length - 1];
            }
          }
        } else if (i === 5) { // Date column - don't truncate, use smaller font if needed
          if (this.pdf.getTextWidth(text) > maxWidth) {
            this.pdf.setFontSize(6); // Smaller font for dates if needed
          }
        } else {
          // Regular truncation for other columns
          while (this.pdf.getTextWidth(text) > maxWidth && text.length > 3) {
            text = text.slice(0, -1);
          }
          if (this.pdf.getTextWidth(text) > maxWidth) {
            text = text.slice(0, -3) + '...';
          }
        }
        
        // Center align shorter columns (Status, Date), left align longer ones
        if (i === 3 || i === 5) { // Status and Date columns
          const textWidth = this.pdf.getTextWidth(text);
          const centeredX = xPos + (colWidths[i] - textWidth) / 2;
          this.pdf.text(text, centeredX, this.yPosition + 6.5);
        } else {
          this.pdf.text(text, xPos, this.yPosition + 6.5);
        }
        
        // Reset font size if it was changed for dates
        if (i === 5) {
          this.pdf.setFontSize(7);
        }
        
        xPos += colWidths[i];
      });

      this.yPosition += rowHeight;
    });

    // Modern table border with shadow
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, tableStartY, this.contentWidth, this.yPosition - tableStartY, 2, 2, 'S');

    // Add note if there are more complaints with modern styling
    if (this.complaints.length > 25) {
      this.yPosition += 8;
      
      this.pdf.setFillColor(245, 245, 247);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 12, 2, 2, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.text(`Showing first 25 of ${this.complaints.length} total complaints`, this.margin + 8, this.yPosition + 8);
      
      this.yPosition += 12;
    }

    this.yPosition += 15;
  }

  // Add actionable recommendations section
  addRecommendations() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    // Always start recommendations on a new page
    this.pdf.addPage();
    this.yPosition = this.margin;
    
    this.addSectionHeader('STRATEGIC RECOMMENDATIONS', 16);
    
    const recommendations = this.generateRecommendations(analytics);
    
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(35);
      
      // Modern recommendation card
      this.pdf.setFillColor(252, 252, 253);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 22, 3, 3, 'F');
      
      // Subtle border
      this.pdf.setDrawColor(226, 232, 240);
      this.pdf.setLineWidth(0.5);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 22, 3, 3, 'S');
      
      // Modern priority indicator
      const priorityColors = {
        'High': [220, 38, 38],
        'Medium': [217, 119, 6],
        'Low': [22, 163, 74]
      };
      
      // Priority badge
      this.pdf.setFillColor(...priorityColors[rec.priority]);
      this.pdf.roundedRect(this.margin + 5, this.yPosition + 4, 18, 6, 1.5, 1.5, 'F');
      
      this.pdf.setFontSize(7);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(rec.priority.toUpperCase(), this.margin + 7, this.yPosition + 8);
      
      // Recommendation title with modern typography
      this.pdf.setFontSize(11);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(15, 23, 42);
      this.pdf.text(`${index + 1}. ${rec.title}`, this.margin + 28, this.yPosition + 8);
      
      this.yPosition += 14;
      
      // Recommendation description with better spacing
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(71, 85, 105);
      const lines = this.pdf.splitTextToSize(rec.description, this.contentWidth - 16);
      
      lines.forEach(line => {
        this.checkPageBreak(5);
        this.pdf.text(line, this.margin + 8, this.yPosition);
        this.yPosition += 4.5;
      });
      
      this.yPosition += 8;
    });
    
    this.yPosition += 10;
  }

  // Generate intelligent recommendations
  generateRecommendations(analytics) {
    const recommendations = [];
    
    if (this.analyticsData) {
      const summary = analytics.summary;
      const distributions = analytics.distributions;
      
      // Resolution rate recommendations
      if (summary.resolutionRate < 70) {
        recommendations.push({
          title: 'Improve Resolution Process',
          description: `Current resolution rate of ${summary.resolutionRate}% is below industry standards. Consider implementing automated triage systems, enhancing staff training, and establishing clear SLA targets to improve efficiency.`,
          priority: 'High'
        });
      }
      
      // Pending complaints recommendations
      if (summary.pendingComplaints > summary.totalComplaints * 0.25) {
        recommendations.push({
          title: 'Address Pending Complaint Backlog',
          description: `High volume of pending complaints (${summary.pendingComplaints}) indicates resource constraints. Consider increasing support staff capacity or implementing automated first-response systems.`,
          priority: 'High'
        });
      }
      
      // Category-based recommendations
      if (distributions.category.length > 0) {
        const topCategory = distributions.category.sort((a, b) => b.value - a.value)[0];
        if (topCategory.value > summary.totalComplaints * 0.3) {
          recommendations.push({
            title: `Focus on ${topCategory.name} Category Improvements`,
            description: `${topCategory.name} represents ${((topCategory.value / summary.totalComplaints) * 100).toFixed(1)}% of all complaints. Investigate root causes and implement preventive measures in this area.`,
            priority: 'Medium'
          });
        }
      }
      
      // Resolution time recommendations
      if (summary.avgResolutionTime > 7) {
        recommendations.push({
          title: 'Optimize Resolution Timeline',
          description: `Average resolution time of ${summary.avgResolutionTime} days exceeds recommended standards. Implement escalation procedures and automated workflow management to reduce response times.`,
          priority: 'Medium'
        });
      }
      
    } else {
      // Fallback recommendations
      const resolutionRate = ((analytics.resolvedCount / analytics.total) * 100).toFixed(1);
      
      if (resolutionRate < 70) {
        recommendations.push({
          title: 'Enhance Resolution Efficiency',
          description: `Current resolution rate of ${resolutionRate}% requires improvement. Focus on staff training and process optimization.`,
          priority: 'High'
        });
      }
      
      recommendations.push({
        title: 'Implement Advanced Analytics',
        description: 'Deploy comprehensive analytics dashboard to track real-time metrics, identify trends, and enable data-driven decision making.',
        priority: 'Medium'
      });
    }
    
    // Always include monitoring recommendation
    recommendations.push({
      title: 'Establish Continuous Monitoring',
      description: 'Set up automated reporting and alert systems to monitor complaint volumes, resolution times, and customer satisfaction scores on an ongoing basis.',
      priority: 'Low'
    });
    
    return recommendations;
  }

  // Add footer to all pages
  addFooter() {
    const totalPages = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(100, 100, 100);
      
      // Page number
      this.pdf.text(
        `Page ${i} of ${totalPages}`, 
        this.pageWidth - this.margin, 
        this.pageHeight - 10, 
        { align: 'right' }
      );
      
      // Footer text
      this.pdf.text(
        'ServSync Complaints Management System', 
        this.margin, 
        this.pageHeight - 10
      );
      
      // Company info
      this.pdf.text(
        `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 
        this.pageWidth / 2, 
        this.pageHeight - 10, 
        { align: 'center' }
      );
    }
  }

  // Generate the complete modern report
  async generateReport(includeCharts = true) {
    try {
      // Add modern header
      this.addModernHeader();
      
      // Add executive summary
      this.addExecutiveSummary();
      
      // Add detailed analytics
      this.addDetailedAnalytics();
      
      // Add charts if requested and available
      if (includeCharts) {
        await this.addChartsSection();
      }
      
      // Add complaint details table (limited for readability)
      this.addComplaintDetailsTable();
      
      // Add strategic recommendations
      this.addRecommendations();
      
      // Add modern footer to all pages
      this.addModernFooter();
      
      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ServSync-Complaint-Analytics-${timestamp}.pdf`;
      this.pdf.save(filename);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Error generating modern complaint report:', error);
      return { success: false, error: error.message };
    }
  }

  // Add modern charts section with better formatting
  async addChartsSection() {
    this.checkPageBreak(50);
    this.addSectionHeader('VISUAL ANALYTICS', 16);
    
    try {
      // Try to find chart containers with specific data attributes
      const chartContainers = document.querySelectorAll('[data-chart-container]');
      
      if (chartContainers.length > 0) {
        let chartsAdded = 0;
        
        // Add all available charts
        for (let i = 0; i < chartContainers.length && chartsAdded < 6; i++) {
          try {
            const container = chartContainers[i];
            const chartType = container.getAttribute('data-chart-container');
            
            // Skip if chart is not visible or has no content
            if (container.offsetWidth === 0 || container.offsetHeight === 0) continue;
            
            const canvas = await html2canvas(container, {
              backgroundColor: '#ffffff',
              scale: 1.5,
              useCORS: true,
              allowTaint: true,
              logging: false,
              width: container.offsetWidth,
              height: container.offsetHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const maxWidth = this.contentWidth * 0.9;
            const imgWidth = Math.min(maxWidth, canvas.width * 0.25);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Check for page break
            if (this.yPosition + imgHeight + 25 > this.pageHeight - 30) {
              this.pdf.addPage();
              this.yPosition = this.margin;
            }

            // Add chart title
            this.pdf.setFontSize(11);
            this.pdf.setFont("helvetica", "bold");
            this.pdf.setTextColor(75, 85, 99);
            this.pdf.text(this.getChartTitle(chartType), this.margin, this.yPosition);
            this.yPosition += 8;

            // Center the image
            const xPos = this.margin + (this.contentWidth - imgWidth) / 2;
            
            // Add subtle border around chart
            this.pdf.setDrawColor(226, 232, 240);
            this.pdf.setLineWidth(0.5);
            this.pdf.rect(xPos - 2, this.yPosition - 2, imgWidth + 4, imgHeight + 4);
            
            this.pdf.addImage(imgData, 'PNG', xPos, this.yPosition, imgWidth, imgHeight);
            this.yPosition += imgHeight + 15;
            chartsAdded++;

          } catch (chartError) {
            console.warn(`Could not capture chart ${i + 1}:`, chartError);
          }
        }

        if (chartsAdded === 0) {
          this.addNoChartsMessage();
        }
      } else {
        this.addNoChartsMessage();
      }

    } catch (error) {
      console.warn('Could not add charts section:', error);
      this.addNoChartsMessage();
    }

    this.yPosition += 10;
  }

  // Helper method for chart titles
  getChartTitle(chartType) {
    const titles = {
      'category': 'Complaints by Category Distribution',
      'status': 'Status Distribution Analysis',
      'branch': 'Branch Performance Overview',
      'monthly': 'Monthly Trend Analysis',
      'urgency': 'Urgency Level Distribution',
      'resolution': 'Resolution Time Analysis'
    };
    return titles[chartType] || 'Analytics Chart';
  }

  // Helper method for no charts message
  addNoChartsMessage() {
    this.pdf.setFillColor(249, 250, 251);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 25, 3, 3, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(107, 114, 128);
    this.pdf.text('Charts will be available when analytics view is enabled', this.margin + 10, this.yPosition + 10);
    this.pdf.text('Enable "Analytics" toggle before generating report to include visual charts', this.margin + 10, this.yPosition + 18);
    
    this.yPosition += 30;
  }

  // Add modern footer to all pages
  addModernFooter() {
    const totalPages = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      
      // Footer background
      this.pdf.setFillColor(248, 250, 252);
      this.pdf.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F');
      
      // Footer content
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(100, 116, 139);
      
      // Left side - Company info
      this.pdf.text('ServSync Analytics Platform', this.margin, this.pageHeight - 12);
      this.pdf.text('Customer Service Management System', this.margin, this.pageHeight - 7);
      
      // Center - Generation info
      const now = new Date();
      this.pdf.text(
        `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 
        this.pageWidth / 2, 
        this.pageHeight - 10, 
        { align: 'center' }
      );
      
      // Right side - Page number
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text(
        `Page ${i} of ${totalPages}`, 
        this.pageWidth - this.margin, 
        this.pageHeight - 10, 
        { align: 'right' }
      );
    }
  }
}

// Utility function to fetch complaint data and generate report
export const generateComplaintReport = async (includeCharts = true) => {
  try {
    // Fetch complaints data and analytics
    const [complaintsResponse, analyticsResponse] = await Promise.allSettled([
      fetch('/api/complaints'),
      fetch('/api/complaints/analytics/overview')
    ]);
    
    let complaints = [];
    let analytics = null;
    
    if (complaintsResponse.status === 'fulfilled' && complaintsResponse.value.ok) {
      complaints = await complaintsResponse.value.json();
    }
    
    if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.ok) {
      analytics = await analyticsResponse.value.json();
    }
    
    // Create and generate report
    const generator = new ComplaintReportGenerator(complaints);
    
    // If we have analytics data, use it to enhance the report
    if (analytics) {
      generator.analyticsData = analytics;
    }
    
    return await generator.generateReport(includeCharts);
    
  } catch (error) {
    console.error('Error fetching complaints for report:', error);
    return { success: false, error: 'Failed to fetch complaint data' };
  }
};

export default ComplaintReportGenerator;