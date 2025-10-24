import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class FeedbackReportGenerator {
  constructor(feedbackData = []) {
    this.feedbackData = feedbackData;
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.yPosition = this.margin;
    this.lineHeight = 6;
    this.analyticsData = null;
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
    this.pdf.text('FEEDBACK ANALYTICS', this.pageWidth - this.margin, 20, { align: 'right' });
    
    this.pdf.setFontSize(11);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(203, 213, 225);
    this.pdf.text('Customer Experience Intelligence Report', this.pageWidth - this.margin, 28, { align: 'right' });
    
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

  // Add subsection header
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
    this.pdf.text(key + ':', this.margin + indent, this.yPosition);
    
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(80, 80, 80);
    this.pdf.text(String(value), this.margin + indent + 50, this.yPosition);
    this.yPosition += this.lineHeight;
  }

  // Calculate analytics from feedback data
  calculateAnalytics() {
    if (!this.feedbackData || this.feedbackData.length === 0) {
      return {
        summary: {
          totalFeedbacks: 0,
          avgRating: 0,
          responseRate: 0,
          satisfactionRate: 0
        },
        distributions: {
          rating: [],
          response: [],
          satisfaction: []
        }
      };
    }

    const totalFeedbacks = this.feedbackData.length;
    const avgRating = (this.feedbackData.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedbacks).toFixed(1);
    
    const respondedCount = this.feedbackData.filter(f => 
      f.replies?.some(r => r.sender === 'admin')
    ).length;
    const responseRate = ((respondedCount / totalFeedbacks) * 100).toFixed(1);
    
    const excellentCount = this.feedbackData.filter(f => (f.rating || 0) >= 4.5).length;
    const satisfactionRate = ((excellentCount / totalFeedbacks) * 100).toFixed(1);

    // Rating distribution
    const ratingCounts = this.feedbackData.reduce((acc, f) => {
      const rating = Math.floor(f.rating || 0);
      const key = `${rating}_star`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ratingDistribution = Object.entries(ratingCounts).map(([key, value]) => ({
      name: key.replace('_star', ' Star'),
      value
    }));

    // Response status distribution
    const responseCounts = this.feedbackData.reduce((acc, f) => {
      const hasAdminReply = f.replies?.some(r => r.sender === 'admin') || false;
      const key = hasAdminReply ? 'responded' : 'pending';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const responseDistribution = Object.entries(responseCounts).map(([key, value]) => ({
      name: key === 'responded' ? 'Responded' : 'Pending Response',
      value
    }));

    // Satisfaction categories
    const satisfactionCounts = this.feedbackData.reduce((acc, f) => {
      const rating = f.rating || 0;
      let category;
      if (rating >= 4.5) category = 'excellent';
      else if (rating >= 3.5) category = 'good';
      else if (rating >= 2.5) category = 'average';
      else if (rating >= 1.5) category = 'poor';
      else category = 'very_poor';
      
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const satisfactionDistribution = Object.entries(satisfactionCounts).map(([key, value]) => ({
      name: this.capitalizeSatisfaction(key),
      value
    }));

    return {
      summary: {
        totalFeedbacks,
        avgRating,
        responseRate,
        satisfactionRate,
        respondedCount
      },
      distributions: {
        rating: ratingDistribution,
        response: responseDistribution,
        satisfaction: satisfactionDistribution
      }
    };
  }

  // Helper method to capitalize satisfaction categories
  capitalizeSatisfaction(key) {
    const map = {
      'excellent': 'Excellent (4.5-5/5)',
      'good': 'Good (3.5-4.4/5)',
      'average': 'Average (2.5-3.4/5)',
      'poor': 'Poor (1.5-2.4/5)',
      'very_poor': 'Very Poor (1-1.4/5)'
    };
    return map[key] || key;
  }

  // Add executive summary with key metrics
  addExecutiveSummary() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    this.addSectionHeader('EXECUTIVE SUMMARY', 16);
    
    // Create metric cards layout
    const cardWidth = (this.contentWidth - 15) / 4; // 4 cards with spacing
    const cardHeight = 25;
    const cardStartY = this.yPosition;
    
    const metrics = [
      { title: 'Total Feedback', value: analytics.summary.totalFeedbacks, color: this.colors.primary },
      { title: 'Avg Rating', value: `${analytics.summary.avgRating}/5`, color: this.colors.success },
      { title: 'Response Rate', value: `${analytics.summary.responseRate}%`, color: this.colors.warning },
      { title: 'Satisfaction', value: `${analytics.summary.satisfactionRate}%`, color: this.colors.success }
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
      
      // Title
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.text(metric.title, x + 3, cardStartY + 8);
      
      // Value - positioned below title, larger and colored
      this.pdf.setFontSize(14);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      this.pdf.text(String(metric.value), x + 3, cardStartY + 18);
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
    const summary = analytics.summary;
    
    // Rating insight
    if (parseFloat(summary.avgRating) >= 4.0) {
      insights.push(`Excellent average rating of ${summary.avgRating}/5 indicates high customer satisfaction levels.`);
    } else if (parseFloat(summary.avgRating) >= 3.0) {
      insights.push(`Average rating of ${summary.avgRating}/5 shows room for improvement in customer experience.`);
    } else {
      insights.push(`Low average rating of ${summary.avgRating}/5 requires immediate attention to service quality.`);
    }
    
    // Response rate insight
    if (parseFloat(summary.responseRate) >= 80) {
      insights.push(`Strong response rate of ${summary.responseRate}% demonstrates excellent customer engagement.`);
    } else if (parseFloat(summary.responseRate) >= 60) {
      insights.push(`Moderate response rate of ${summary.responseRate}% indicates opportunity for better customer communication.`);
    } else {
      insights.push(`Low response rate of ${summary.responseRate}% suggests need for improved feedback response processes.`);
    }
    
    // Satisfaction insight
    if (parseFloat(summary.satisfactionRate) >= 70) {
      insights.push(`High satisfaction rate of ${summary.satisfactionRate}% shows strong customer loyalty potential.`);
    } else {
      insights.push(`Satisfaction rate of ${summary.satisfactionRate}% indicates need for service quality improvements.`);
    }
    
    return insights;
  }

  // Add detailed analytics section
  addDetailedAnalytics() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    this.addSectionHeader('DETAILED ANALYTICS', 16);
    
    const distributions = analytics.distributions;
    
    this.addSubsectionHeader('Rating Distribution Analysis');
    this.addAnalyticsTable([
      ['Rating', 'Count', 'Percentage', 'Trend'],
      ...distributions.rating.map(item => {
        const percentage = ((item.value / analytics.summary.totalFeedbacks) * 100).toFixed(1);
        const trend = this.getRatingTrend(item.name);
        return [item.name, item.value.toString(), `${percentage}%`, trend];
      })
    ]);

    this.yPosition += 10;

    // Response Analysis - Start on new page for better organization
    this.pdf.addPage();
    this.yPosition = this.margin;
    
    this.addSubsectionHeader('Response Status Analysis');
    this.addAnalyticsTable([
      ['Status', 'Count', 'Percentage', 'Impact'],
      ...distributions.response.map(item => {
        const percentage = ((item.value / analytics.summary.totalFeedbacks) * 100).toFixed(1);
        const impact = item.name.includes('Responded') ? 'Positive' : 'Needs Attention';
        return [item.name, item.value.toString(), `${percentage}%`, impact];
      })
    ]);

    this.yPosition += 10;

    this.addSubsectionHeader('Satisfaction Categories Analysis');
    this.addAnalyticsTable([
      ['Category', 'Count', 'Percentage', 'Action'],
      ...distributions.satisfaction.map(item => {
        const percentage = ((item.value / analytics.summary.totalFeedbacks) * 100).toFixed(1);
        const action = this.getSatisfactionAction(item.name);
        return [item.name, item.value.toString(), `${percentage}%`, action];
      })
    ]);

    this.yPosition += 15;
  }

  // Helper methods for trends and actions
  getRatingTrend(rating) {
    if (rating.includes('5')) return 'Excellent';
    if (rating.includes('4')) return 'Good';
    if (rating.includes('3')) return 'Average';
    if (rating.includes('2')) return 'Poor';
    return 'Critical';
  }

  getSatisfactionAction(category) {
    if (category.includes('Excellent')) return 'Maintain';
    if (category.includes('Good')) return 'Enhance';
    if (category.includes('Average')) return 'Improve';
    return 'Urgent Fix';
  }

  // Add actionable recommendations section with modern styling
  addRecommendations() {
    const analytics = this.analyticsData || this.calculateAnalytics();
    
    // Always start recommendations on a new page
    this.pdf.addPage();
    this.yPosition = this.margin;
    
    this.addSectionHeader('STRATEGIC RECOMMENDATIONS', 16);
    
    const recommendations = this.generateRecommendations(analytics);
    
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(40); // Increased space requirement
      
      // Modern recommendation card
      this.pdf.setFillColor(252, 252, 253);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 28, 3, 3, 'F'); // Increased height
      
      // Subtle border
      this.pdf.setDrawColor(226, 232, 240);
      this.pdf.setLineWidth(0.5);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 28, 3, 3, 'S'); // Increased height
      
      // Modern priority indicator
      const priorityColors = {
        'High': [220, 38, 38],
        'Medium': [217, 119, 6],
        'Low': [22, 163, 74]
      };
      
      // Priority badge
      this.pdf.setFillColor(...priorityColors[rec.priority]);
      this.pdf.roundedRect(this.margin + 5, this.yPosition + 4, 20, 6, 1.5, 1.5, 'F'); // Slightly wider badge
      
      this.pdf.setFontSize(7);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.text(rec.priority.toUpperCase(), this.margin + 7, this.yPosition + 8);
      
      // Recommendation title with modern typography
      this.pdf.setFontSize(11);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.setTextColor(15, 23, 42);
      this.pdf.text(`${index + 1}. ${rec.title}`, this.margin + 30, this.yPosition + 8);
      
      this.yPosition += 14;
      
      // Recommendation description with better spacing and wrapping
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(71, 85, 105);
      const lines = this.pdf.splitTextToSize(rec.description, this.contentWidth - 20); // More margin for wrapping
      
      lines.forEach(line => {
        this.checkPageBreak(6);
        this.pdf.text(line, this.margin + 8, this.yPosition);
        this.yPosition += 5;
      });
      
      this.yPosition += 10; // Increased spacing between recommendations
    });
    
    this.yPosition += 10;
  }

  // Add modern analytics table with better alignment
  addAnalyticsTable(data) {
    if (!data || data.length === 0) return;
    
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
        this.pdf.text(header, xPos + (colWidths[i] - headerWidth) / 2, this.yPosition + 6.5);
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
        this.pdf.setFillColor(255, 255, 255);
      } else {
        this.pdf.setFillColor(249, 250, 251);
      }
      this.pdf.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(15, 23, 42);
      
      xPos = this.margin + 4;
      row.forEach((cell, i) => {
        const maxWidth = colWidths[i] - 8;
        let cellText = String(cell);
        
        // Truncate text if too long
        while (this.pdf.getTextWidth(cellText) > maxWidth && cellText.length > 3) {
          cellText = cellText.substring(0, cellText.length - 1);
        }
        
        // Align text based on column type
        if (i === 1 || i === 2) {
          // Center align for numeric columns
          const textWidth = this.pdf.getTextWidth(cellText);
          this.pdf.text(cellText, xPos + (colWidths[i] - textWidth) / 2, this.yPosition + 6.5);
        } else {
          // Left align for text columns
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

  // Add modern charts section with better formatting
  async addChartsSection() {
    this.checkPageBreak(50);
    this.addSectionHeader('VISUAL ANALYTICS', 16);
    
    try {
      // Try to find chart containers with specific data attributes
      const chartContainers = document.querySelectorAll('[data-chart-container]');
      
      if (chartContainers.length > 0) {
        let chartsAdded = 0;
        
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
              logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const maxWidth = this.contentWidth * 0.85;
            const imgWidth = Math.min(maxWidth, canvas.width * 0.2);
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
          // Fall back to data-driven charts if DOM charts are not available
          await this.addChartsFromAnalyticsFallback();
        }
      } else {
        // Fall back to data-driven charts if DOM charts are not available
        await this.addChartsFromAnalyticsFallback();
      }

    } catch (error) {
      console.warn('Could not add charts section:', error);
      await this.addChartsFromAnalyticsFallback();
    }

    this.yPosition += 10;
  }

  // Simple data-driven charts drawn directly in the PDF as a reliable fallback
  async addChartsFromAnalyticsFallback() {
    const analytics = this.analyticsData || this.calculateAnalytics();

    // If no data at all, show a neutral, accurate message
    if (!analytics || !analytics.summary || analytics.summary.totalFeedbacks === 0) {
      this.addNoChartsMessage(true);
      return;
    }

    // Draw up to three compact bar charts from analytics distributions
    this.drawBarChart('Rating Distribution', analytics.distributions.rating || [], this.colors.primary);
    this.drawBarChart('Response Status', analytics.distributions.response || [], this.colors.success);
    this.drawBarChart('Satisfaction Categories', analytics.distributions.satisfaction || [], this.colors.warning);
  }

  // Minimal bar chart renderer for inline analytics
  drawBarChart(title, items = [], color = [59, 130, 246]) {
    if (!items || items.length === 0) return;

    const estimatedHeight = 90; // title + chart + labels
    this.checkPageBreak(estimatedHeight);

    // Title
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(51, 65, 85);
    this.pdf.text(title, this.margin, this.yPosition);
    this.yPosition += 6;

    // Chart box
    const paddingX = 8;
    const paddingY = 6;
    const chartX = this.margin + paddingX;
    const chartY = this.yPosition + paddingY;
    const chartWidth = this.contentWidth - paddingX * 2;
    const chartHeight = 50;

    // Frame
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, chartHeight + paddingY * 2 + 16, 2, 2, 'S');

    const values = items.map(i => Number(i.value) || 0);
    const maxVal = Math.max(1, ...values);
    const n = items.length;
    const gap = 6; // gap between bars
    const barWidth = Math.max(8, (chartWidth - (gap * (n - 1))) / n);

    // Bars
    this.pdf.setFillColor(...color);
    items.forEach((item, idx) => {
      const v = Number(item.value) || 0;
      const h = (v / maxVal) * chartHeight;
      const x = chartX + idx * (barWidth + gap);
      const y = chartY + (chartHeight - h);
      this.pdf.rect(x, y, barWidth, h, 'F');

      // Value label above bar
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(71, 85, 105);
      const valText = String(v);
      const textWidth = this.pdf.getTextWidth(valText);
      this.pdf.text(valText, x + (barWidth - textWidth) / 2, y - 2);

      // Category label below bar
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(100, 116, 139);
      const label = String(item.name || '');
      let short = label;
      // truncate label if too long for bar width
      while (this.pdf.getTextWidth(short) > barWidth && short.length > 3) {
        short = short.substring(0, short.length - 1);
      }
      if (short !== label && short.length > 2) short = short.substring(0, short.length - 2) + '…';
      this.pdf.text(short, x + (barWidth - this.pdf.getTextWidth(short)) / 2, chartY + chartHeight + 10);
    });

    this.yPosition += chartHeight + paddingY * 2 + 16 + 6; // box + labels + spacing
  }

  // Helper method for chart titles
  getChartTitle(chartType) {
    const titles = {
      'rating': 'Rating Distribution Analysis',
      'response': 'Response Status Distribution', 
      'satisfaction': 'Satisfaction Categories',
      'monthly': 'Monthly Feedback Trend',
      'responsetime': 'Response Time Analysis'
    };
    return titles[chartType] || 'Analytics Chart';
  }

  // Helper method for no charts message (neutral wording, no toggle mention)
  addNoChartsMessage(noData = false) {
    this.pdf.setFillColor(249, 250, 251);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 25, 3, 3, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "normal");
    this.pdf.setTextColor(107, 114, 128);
    if (noData) {
      this.pdf.text('No charts to display because there is no feedback data yet.', this.margin + 10, this.yPosition + 15);
    } else {
      this.pdf.text('Charts are unavailable in this view. Switch to the Analytics page to include charts,', this.margin + 10, this.yPosition + 10);
      this.pdf.text('or proceed without charts. Summary tables are included below.', this.margin + 10, this.yPosition + 18);
    }
    
    this.yPosition += 30;
  }

  // Add modern feedback details table
  addFeedbackDetailsTable() {
    // Start feedback details on a new page
    this.pdf.addPage();
    this.yPosition = this.margin;
    
    this.addSectionHeader('FEEDBACK DETAILS', 16);
    
    if (!this.feedbackData || this.feedbackData.length === 0) {
      // Modern empty state
      this.pdf.setFillColor(249, 250, 251);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 25, 3, 3, 'F');
      
      this.pdf.setFontSize(10);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(107, 114, 128);
      this.pdf.text('No feedback details available to display.', this.margin + 10, this.yPosition + 15);
      
      this.yPosition += 30;
      return;
    }
    
    // Enhanced table design with better proportions
    const tableStartY = this.yPosition;
    const rowHeight = 12; // Increased height for better readability
    const colWidths = [15, 28, 50, 22, 18, 30]; // Increased Date column to 30 units
    
    // Modern table header with enhanced styling
    this.pdf.setFillColor(30, 64, 175);
    this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, rowHeight, 2, 2, 'F');
    
    this.pdf.setFontSize(9); // Increased font size for headers
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    
    const headers = ['Rating', 'Customer', 'Message', 'Status', 'Response', 'Date'];
    let xPos = this.margin + 5; // Increased padding
    headers.forEach((header, i) => {
      // Center align shorter headers, left align longer ones
      if (header.length <= 8) {
        const headerWidth = this.pdf.getTextWidth(header);
        this.pdf.text(header, xPos + (colWidths[i] - headerWidth) / 2, this.yPosition + 6.5);
      } else {
        this.pdf.text(header, xPos, this.yPosition + 6.5);
      }
      xPos += colWidths[i];
    });
    
    this.yPosition += rowHeight;

    // Enhanced table rows (limit to first 25 for readability)
    const displayFeedback = this.feedbackData.slice(0, 25);
    
    displayFeedback.forEach((feedback, index) => {
      if (this.checkPageBreak(rowHeight + 5)) {
        // Re-add headers on new page
        this.pdf.setFillColor(30, 64, 175);
        this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, rowHeight, 2, 2, 'F');
        
        this.pdf.setFontSize(9);
        this.pdf.setFont("helvetica", "bold");
        this.pdf.setTextColor(255, 255, 255);
        
        xPos = this.margin + 5;
        headers.forEach((header, i) => {
          if (header.length <= 8) {
            const headerWidth = this.pdf.getTextWidth(header);
            this.pdf.text(header, xPos + (colWidths[i] - headerWidth) / 2, this.yPosition + 6.5);
          } else {
            this.pdf.text(header, xPos, this.yPosition + 6.5);
          }
          xPos += colWidths[i];
        });
        
        this.yPosition += rowHeight;
      }

      // Modern alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(255, 255, 255);
      } else {
        this.pdf.setFillColor(249, 250, 251);
      }
      this.pdf.rect(this.margin, this.yPosition, this.contentWidth, rowHeight, 'F');

      this.pdf.setFont("helvetica", "normal");
      this.pdf.setFontSize(7);
      this.pdf.setTextColor(15, 23, 42);
      
      const rowData = [
        `${feedback.rating || 0}/5`, // Use "/5" instead of star symbol for better compatibility
        feedback.username || 'Anonymous',
        feedback.message || 'No message',
        feedback.replies?.some(r => r.sender === 'admin') ? 'Responded' : 'Pending',
        feedback.replies?.some(r => r.sender === 'admin') ? 'Yes' : 'No',
        feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) : 'N/A'
      ];

      xPos = this.margin + 5; // Match the improved padding
      rowData.forEach((data, i) => {
        const maxWidth = colWidths[i] - 8;
        let cellText = String(data);
        
        // Special handling for different columns
        if (i === 2) { // Message column
          if (cellText.length > 25) {
            cellText = cellText.substring(0, 22) + '...';
          }
        } else if (i === 1) { // Customer name
          if (cellText.length > 12) {
            cellText = cellText.substring(0, 9) + '...';
          }
        } else if (i === 5) { // Date column - use smaller font and don't truncate
          this.pdf.setFontSize(6); // Smaller font for dates
        } else if (i === 3) { // Status column - ensure full text
          // Keep status text as-is (Responded/Pending)
        } else {
          // General truncation for other columns
          while (this.pdf.getTextWidth(cellText) > maxWidth && cellText.length > 3) {
            cellText = cellText.substring(0, cellText.length - 1);
          }
        }
        
        // Align text based on column type
        if (i === 0 || i === 3 || i === 4 || i === 5) {
          // Center align for Rating, Status, Response, Date
          const textWidth = this.pdf.getTextWidth(cellText);
          this.pdf.text(cellText, xPos + (colWidths[i] - textWidth) / 2, this.yPosition + 8);
        } else {
          // Left align for Customer and Message
          this.pdf.text(cellText, xPos, this.yPosition + 8);
        }
        
        // Reset font size for next column
        if (i === 5) {
          this.pdf.setFontSize(7); // Reset to normal size
        }
        
        xPos += colWidths[i];
      });

      this.yPosition += rowHeight;
    });

    // Modern table border with shadow
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(this.margin, tableStartY, this.contentWidth, this.yPosition - tableStartY, 2, 2, 'S');

    // Add note if there are more feedback with modern styling
    if (this.feedbackData.length > 25) {
      this.yPosition += 8;
      
      this.pdf.setFillColor(245, 245, 247);
      this.pdf.roundedRect(this.margin, this.yPosition, this.contentWidth, 12, 2, 2, 'F');
      
      this.pdf.setFontSize(8);
      this.pdf.setTextColor(100, 116, 139);
      this.pdf.text(`Showing first 25 of ${this.feedbackData.length} total feedback entries`, this.margin + 8, this.yPosition + 8);
      
      this.yPosition += 12;
    }

    this.yPosition += 15;
  }

  // Add modern text-based table without background colors
  addModernTextTable() {
    if (!this.feedbackData || this.feedbackData.length === 0) return;

    const colWidths = [30, 40, 80, 35, 35]; // Column widths
    const totalTableWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableStartX = this.margin + (this.contentWidth - totalTableWidth) / 2; // Center the table
    const rowHeight = 16; // Row height for better readability
    
    this.checkPageBreak(15 * rowHeight);

    // Table headers with better spacing and alignment
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(0, 0, 0);
    
    const headers = ['Rating', 'Customer', 'Feedback Message', 'Status', 'Date'];
    let xPos = tableStartX;
    
    // Draw header background
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(tableStartX, this.yPosition, totalTableWidth, 12, 'F');
    
    // Draw header border
    this.pdf.setLineWidth(1);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.rect(tableStartX, this.yPosition, totalTableWidth, 12, 'S');
    
    // Add header text with proper alignment
    headers.forEach((header, index) => {
      if (index === 0 || index === 3 || index === 4) {
        // Center align for Rating, Status, Date
        const textWidth = this.pdf.getTextWidth(header);
        this.pdf.text(header, xPos + (colWidths[index] - textWidth) / 2, this.yPosition + 8);
      } else {
        // Left align for Customer and Message
        this.pdf.text(header, xPos + 3, this.yPosition + 8);
      }
      
      // Draw column separators in header
      if (index < headers.length - 1) {
        this.pdf.setLineWidth(0.5);
        this.pdf.setDrawColor(120, 120, 120);
        this.pdf.line(xPos + colWidths[index], this.yPosition, xPos + colWidths[index], this.yPosition + 12);
      }
      
      xPos += colWidths[index];
    });
    
    this.yPosition += 16;

    // Data rows with proper alignment and spacing
    const recentFeedback = this.feedbackData.slice(0, 10);
    recentFeedback.forEach((feedback, index) => {
      this.checkPageBreak(rowHeight);
      
      const rating = `${feedback.rating || 0}/5`;
      const customer = (feedback.username || 'Anonymous').length > 20 
        ? (feedback.username || 'Anonymous').substring(0, 17) + '...' 
        : (feedback.username || 'Anonymous');
      
      let message = feedback.message || 'No message provided';
      if (message.length > 60) {
        message = message.substring(0, 57) + '...';
      }
      
      const hasResponse = feedback.replies?.some(r => r.sender === 'admin');
      const status = hasResponse ? 'Responded' : 'Pending';
      const date = feedback.createdAt 
        ? new Date(feedback.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: '2-digit'
          })
        : 'N/A';

      const rowData = [rating, customer, message, status, date];
      
      // Alternating row background - very subtle
      if (index % 2 === 1) {
        this.pdf.setFillColor(252, 252, 252);
        this.pdf.rect(tableStartX, this.yPosition, totalTableWidth, rowHeight - 2, 'F');
      }
      
      // Draw row border
      this.pdf.setLineWidth(0.3);
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.rect(tableStartX, this.yPosition, totalTableWidth, rowHeight - 2, 'S');
      
      xPos = tableStartX;
      rowData.forEach((cell, colIndex) => {
        this.pdf.setFontSize(9);
        
        // Style different columns
        if (colIndex === 1) { // Customer name
          this.pdf.setFont("helvetica", "bold");
          this.pdf.setTextColor(0, 0, 0);
        } else if (colIndex === 3) { // Status
          this.pdf.setFont("helvetica", "bold");
          if (cell === 'Responded') {
            this.pdf.setTextColor(0, 120, 0); // Green for responded
          } else {
            this.pdf.setTextColor(200, 0, 0); // Red for pending
          }
        } else {
          this.pdf.setFont("helvetica", "normal");
          this.pdf.setTextColor(0, 0, 0);
        }
        
        // Proper alignment for each column type
        let textX = xPos + 3; // Default left align with padding
        if (colIndex === 0 || colIndex === 3 || colIndex === 4) {
          // Center align for Rating, Status, Date
          const textWidth = this.pdf.getTextWidth(String(cell));
          textX = xPos + (colWidths[colIndex] - textWidth) / 2;
        }
        
        this.pdf.text(String(cell), textX, this.yPosition + 10);
        
        // Draw column separators
        if (colIndex < rowData.length - 1) {
          this.pdf.setLineWidth(0.3);
          this.pdf.setDrawColor(200, 200, 200);
          this.pdf.line(xPos + colWidths[colIndex], this.yPosition, xPos + colWidths[colIndex], this.yPosition + rowHeight - 2);
        }
        
        xPos += colWidths[colIndex];
      });
      
      this.yPosition += rowHeight;
    });

    // Final table border - complete border around entire table
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(1);
    const tableHeight = (recentFeedback.length * rowHeight) + 12; // Header + all rows
    this.pdf.rect(tableStartX, this.yPosition - tableHeight + 4, totalTableWidth, tableHeight, 'S');
    
    this.yPosition += 8;
  }

  // Add simple, reliable feedback table that actually shows content
  addProfessionalFeedbackTable(data) {
    if (!data || data.length === 0) return;

    const [headers, ...rows] = data;
    const colWidths = [25, 35, 75, 30, 30]; // Wider columns for better readability
    const rowHeight = 12; // Taller rows for better spacing
    
    this.checkPageBreak((Math.min(rows.length, 10) + 3) * rowHeight);

    // Simple header - just text with underline
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(0, 0, 0); // Pure black text
    
    let xPos = this.margin;
    headers.forEach((header, index) => {
      this.pdf.text(header, xPos + 2, this.yPosition + 8);
      xPos += colWidths[index];
    });
    
    // Draw header underline
    this.pdf.setLineWidth(0.5);
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.line(this.margin, this.yPosition + 10, this.margin + colWidths.reduce((a, b) => a + b, 0), this.yPosition + 10);
    
    this.yPosition += rowHeight + 2;

    // Data rows - simple text only, no background colors
    const limitedRows = rows.slice(0, 10);
    limitedRows.forEach((row, rowIndex) => {
      this.checkPageBreak(rowHeight);
      
      this.pdf.setFontSize(9);
      this.pdf.setFont("helvetica", "normal");
      this.pdf.setTextColor(0, 0, 0); // Pure black text
      
      xPos = this.margin;
      row.forEach((cell, colIndex) => {
        let cellText = String(cell);
        
        // Make customer names bold
        if (colIndex === 1) {
          this.pdf.setFont("helvetica", "bold");
        } else {
          this.pdf.setFont("helvetica", "normal");
        }
        
        // Truncate long text for feedback column
        if (colIndex === 2 && cellText.length > 45) {
          cellText = cellText.substring(0, 42) + '...';
        }
        
        // Truncate customer names if too long
        if (colIndex === 1 && cellText.length > 18) {
          cellText = cellText.substring(0, 15) + '...';
        }
        
        this.pdf.text(cellText, xPos + 2, this.yPosition + 8);
        xPos += colWidths[colIndex];
      });
      
      // Add subtle separator line every few rows
      if ((rowIndex + 1) % 3 === 0) {
        this.pdf.setDrawColor(200, 200, 200);
        this.pdf.setLineWidth(0.2);
        this.pdf.line(this.margin, this.yPosition + 10, this.margin + colWidths.reduce((a, b) => a + b, 0), this.yPosition + 10);
      }
      
      this.yPosition += rowHeight;
    });

    // Final bottom line
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(this.margin, this.yPosition + 2, this.margin + colWidths.reduce((a, b) => a + b, 0), this.yPosition + 2);
    this.yPosition += 10;
  }

  // Add modern footer with enhanced styling
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
      this.pdf.text('Customer Experience Management System', this.margin, this.pageHeight - 7);
      
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

  // Generate intelligent recommendations
  generateRecommendations(analytics) {
    const recommendations = [];
    const { summary, distributions } = analytics;

    // Rating-based recommendations
    if (parseFloat(summary.avgRating) < 3.5) {
      recommendations.push({
        title: 'Improve Service Quality Standards',
        description: 'Average rating is below satisfactory level. Implement comprehensive service training programs and establish quality monitoring systems to enhance customer experience.',
        priority: 'High'
      });
    } else if (parseFloat(summary.avgRating) >= 4.5) {
      recommendations.push({
        title: 'Maintain Excellence Standards',
        description: 'Excellent ratings achieved. Continue current practices and consider implementing customer loyalty programs to maintain high satisfaction levels.',
        priority: 'Low'
      });
    }

    // Response rate recommendations
    if (parseFloat(summary.responseRate) < 70) {
      recommendations.push({
        title: 'Enhance Response Protocols',
        description: 'Low response rate indicates communication gaps. Implement automated acknowledgment systems and establish response time targets for all feedback.',
        priority: 'High'
      });
    }

    // Satisfaction rate recommendations
    if (parseFloat(summary.satisfactionRate) < 60) {
      recommendations.push({
        title: 'Address Customer Dissatisfaction',
        description: 'Investigate root causes of customer dissatisfaction through detailed analysis and implement corrective measures across all service touchpoints.',
        priority: 'High'
      });
    }

    // Volume-based recommendations
    if (summary.totalFeedbacks < 50) {
      recommendations.push({
        title: 'Increase Feedback Collection',
        description: 'Low feedback volume may indicate limited customer engagement. Implement feedback incentive programs and simplify the feedback submission process.',
        priority: 'Medium'
      });
    }

    // Poor ratings analysis
    const poorRatings = distributions.rating?.filter(r => r.name.includes('1') || r.name.includes('2')).reduce((sum, r) => sum + r.value, 0) || 0;
    if (poorRatings > summary.totalFeedbacks * 0.2) {
      recommendations.push({
        title: 'Address Systemic Issues',
        description: 'High percentage of negative ratings indicates systemic problems. Conduct comprehensive service audit and implement immediate corrective actions.',
        priority: 'High'
      });
    }

    // Default recommendations if none generated
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Continue Excellence Journey',
        description: 'Maintain current service standards and explore opportunities for innovation in customer experience delivery.',
        priority: 'Low'
      });
      
      recommendations.push({
        title: 'Implement Continuous Monitoring',
        description: 'Establish regular feedback analysis cycles and proactive customer satisfaction monitoring to maintain high service quality.',
        priority: 'Medium'
      });
    }

    return recommendations;
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
      
      // Add feedback details table (limited for readability)
      this.addFeedbackDetailsTable();
      
      // Add strategic recommendations
      this.addRecommendations();
      
      // Add modern footer to all pages
      this.addModernFooter();
      
      // Save the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `ServSync-Feedback-Analytics-${timestamp}.pdf`;
      this.pdf.save(filename);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Error generating modern feedback report:', error);
      return { success: false, error: error.message };
    }
  }

  // Main generation method (legacy compatibility)
  async generate(includeAnalytics = false) {
    try {
      // Fetch feedback data if not provided
      if (!this.feedbackData || this.feedbackData.length === 0) {
        const response = await fetch('/api/feedback');
        const data = await response.json();
        this.feedbackData = Array.isArray(data) ? data : data?.data || [];
      }

      // Calculate analytics
      this.analyticsData = this.calculateAnalytics();

      return await this.generateReport(includeAnalytics);

    } catch (error) {
      console.error('Error generating feedback report:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate feedback report'
      };
    }
  }
}

// Utility function to fetch feedback data and generate report
export const generateFeedbackReport = async (includeCharts = true) => {
  try {
    // Fetch feedback data and analytics
    const [feedbackResponse, analyticsResponse] = await Promise.allSettled([
      fetch('/api/feedback'),
      fetch('/api/feedback/analytics/overview')
    ]);
    
    let feedbackData = [];
    let analytics = null;
    
    if (feedbackResponse.status === 'fulfilled' && feedbackResponse.value.ok) {
      const data = await feedbackResponse.value.json();
      feedbackData = Array.isArray(data) ? data : data?.data || [];
    }
    
    if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.ok) {
      analytics = await analyticsResponse.value.json();
    }
    
    // Create and generate report
    const generator = new FeedbackReportGenerator(feedbackData);
    
    // If we have analytics data, use it to enhance the report
    if (analytics) {
      generator.analyticsData = analytics;
    }
    
    return await generator.generateReport(includeCharts);
    
  } catch (error) {
    console.error('Error fetching feedback for report:', error);
    return { success: false, error: 'Failed to fetch feedback data' };
  }
};

export default FeedbackReportGenerator;