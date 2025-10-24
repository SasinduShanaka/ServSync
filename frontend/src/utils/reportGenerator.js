import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utility function to calculate age
function getAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export class AnalyticsReportGenerator {
  constructor(users, staff = []) {
    this.users = users;
    this.staff = staff;
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.yPosition = 20;
    this.margin = 20;
    this.primaryColor = [41, 98, 255]; // Blue
    this.secondaryColor = [100, 100, 100]; // Gray
  }

  // Check if we need a new page
  checkPageBreak(requiredSpace) {
    if (this.yPosition + requiredSpace > this.pageHeight - 25) {
      this.pdf.addPage();
      this.yPosition = 20;
      return true;
    }
    return false;
  }

  // Add a styled section header with background
  addSectionHeader(title, color = this.primaryColor) {
    this.checkPageBreak(20);
    
    // Draw background rectangle
    this.pdf.setFillColor(color[0], color[1], color[2]);
    this.pdf.rect(this.margin, this.yPosition - 5, this.pageWidth - (this.margin * 2), 12, 'F');
    
    // Add text
    this.pdf.setFontSize(14);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.text(title, this.margin + 5, this.yPosition + 3);
    
    // Reset text color
    this.pdf.setTextColor(0, 0, 0);
    this.yPosition += 18;
  }

  // Add title to PDF
  addTitle(title, fontSize = 16) {
    this.checkPageBreak(15);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.pdf.text(title, this.margin, this.yPosition);
    this.pdf.setTextColor(0, 0, 0);
    this.yPosition += fontSize * 0.5 + 5;
  }

  // Add regular text
  addText(text, fontSize = 10, indent = 0, bold = false) {
    this.checkPageBreak(8);
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont("helvetica", bold ? "bold" : "normal");
    this.pdf.text(text, this.margin + indent, this.yPosition);
    this.yPosition += fontSize * 0.4 + 3;
  }

  // Add a table
  addTable(headers, rows) {
    const startX = this.margin;
    const colWidth = (this.pageWidth - (this.margin * 2)) / headers.length;
    const rowHeight = 8;
    const totalTableHeight = rowHeight * (rows.length + 1);

    // Check if entire table fits, if not start on new page
    if (this.yPosition + totalTableHeight > this.pageHeight - 25) {
      this.pdf.addPage();
      this.yPosition = 20;
    }

    const startY = this.yPosition;

    // Draw header
    this.pdf.setFillColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.pdf.rect(startX, startY, this.pageWidth - (this.margin * 2), rowHeight, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setFont("helvetica", "bold");
    this.pdf.setTextColor(255, 255, 255);
    
    headers.forEach((header, i) => {
      const x = startX + (i * colWidth) + 2;
      this.pdf.text(String(header), x, startY + 5.5);
    });
    
    this.pdf.setTextColor(0, 0, 0);
    this.yPosition += rowHeight;

    // Draw rows
    this.pdf.setFontSize(9);
    this.pdf.setFont("helvetica", "normal");
    rows.forEach((row, rowIndex) => {
      const y = startY + ((rowIndex + 1) * rowHeight);
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(startX, y, this.pageWidth - (this.margin * 2), rowHeight, 'F');
      }
      
      row.forEach((cell, colIndex) => {
        const x = startX + (colIndex * colWidth) + 2;
        const cellText = String(cell);
        
        // Truncate text if too long for cell
        const maxWidth = colWidth - 4;
        this.pdf.text(cellText, x, y + 5.5, { maxWidth: maxWidth });
      });
    });

    this.yPosition += rows.length * rowHeight + 5;
  }

  // Add a divider line
  addDivider() {
    this.checkPageBreak(5);
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.yPosition, this.pageWidth - this.margin, this.yPosition);
    this.yPosition += 5;
  }

  // Add statistics section
  addStatisticsSection() {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(u => u.status === 'active').length;
    const totalStaff = this.staff.length;
    const activeStaff = this.staff.filter(s => s.status === 'active').length;
    
    // Gender distribution
    const genderCounts = this.users.reduce((acc, u) => {
      const g = (u.gender || "Unknown").trim();
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});

    // Insurance type distribution
    const insuranceCounts = {};
    this.users.forEach((u) => {
      const type = (u.insuranceType || "Unknown").trim();
      insuranceCounts[type] = (insuranceCounts[type] || 0) + 1;
    });

    // Age distribution
    const ageGroups = { "0-18": 0, "19-30": 0, "31-45": 0, "46-60": 0, "61+": 0, Unknown: 0 };
    this.users.forEach((u) => {
      const age = getAge(u.dateOfBirth || u.dob);
      if (age === null || isNaN(age)) ageGroups.Unknown++;
      else if (age <= 18) ageGroups["0-18"]++;
      else if (age <= 30) ageGroups["19-30"]++;
      else if (age <= 45) ageGroups["31-45"]++;
      else if (age <= 60) ageGroups["46-60"]++;
      else ageGroups["61+"]++;
    });

    // Registration trend
    const regCounts = {};
    this.users.forEach((u) => {
      if (u.createdAt) {
        const d = new Date(u.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        regCounts[key] = (regCounts[key] || 0) + 1;
      }
    });

    // Recent registrations (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const recentRegistrations = this.users.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Peak login hour analytics
    const hourCounts = Array(24).fill(0);
    this.users.forEach(u => {
      if (Array.isArray(u.loginTimestamps)) {
        u.loginTimestamps.forEach(ts => {
          const d = new Date(ts);
          if (!isNaN(d.getTime())) hourCounts[d.getHours()]++;
        });
      }
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const peakCount = Math.max(...hourCounts);
    const totalLogins = hourCounts.reduce((a, b) => a + b, 0);

    // === EXECUTIVE SUMMARY ===
    this.addSectionHeader('EXECUTIVE SUMMARY');
    
    this.addText(`Report Generated: ${new Date().toLocaleString()}`, 11, 0, true);
    this.yPosition += 2;

    // System Overview Table
    const systemOverview = [
      ['Total Registered Users', totalUsers.toString(), `Active: ${activeUsers}`],
      ['Total Staff Members', totalStaff.toString(), `Active: ${activeStaff}`],
      ['New Registrations (This Month)', recentRegistrations.toString(), `${((recentRegistrations/totalUsers)*100).toFixed(1)}% of total`],
      ['Peak Login Hour', `${peakHour}:00`, `${peakCount} logins`],
      ['Total Login Activity', totalLogins.toString(), 'All time']
    ];
    
    this.addTable(['Metric', 'Value', 'Details'], systemOverview);
    
    this.yPosition += 5;

    // Key insights in a box
    const sortedTypes = Object.entries(insuranceCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([type]) => type !== "Unknown");
    const topInsurance = sortedTypes.length > 0 ? sortedTypes[0] : ["None", 0];
    
    this.pdf.setDrawColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.margin, this.yPosition, this.pageWidth - (this.margin * 2), 30);
    
    this.yPosition += 7;
    this.addText(`KEY INSIGHTS`, 11, 5, true);
    this.addText(`Most Popular Insurance: ${topInsurance[0]} (${topInsurance[1]} users, ${((topInsurance[1] / totalUsers) * 100).toFixed(1)}%)`, 10, 5);
    this.addText(`Gender Split: Male ${genderCounts['Male'] || 0} (${((genderCounts['Male'] || 0) / totalUsers * 100).toFixed(1)}%) | Female ${genderCounts['Female'] || 0} (${((genderCounts['Female'] || 0) / totalUsers * 100).toFixed(1)}%)`, 10, 5);
    this.addText(`User Engagement: ${totalLogins} total logins recorded, peak activity at ${peakHour}:00`, 10, 5);
    this.yPosition += 5;

    this.yPosition += 5;
    this.addDivider();
    
    // === INSURANCE TYPE DISTRIBUTION ===
    this.checkPageBreak(80);
    this.addSectionHeader('INSURANCE TYPE BREAKDOWN');
    
    const insuranceRows = Object.entries(insuranceCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => [
        type,
        count.toString(),
        `${((count / totalUsers) * 100).toFixed(1)}%`
      ]);
    
    this.addTable(['Insurance Type', 'Count', 'Percentage'], insuranceRows);

    this.yPosition += 5;
    this.addDivider();

    // === AGE GROUP DISTRIBUTION ===
    this.checkPageBreak(80);
    this.addSectionHeader('AGE GROUP ANALYSIS');
    
    const ageRows = Object.entries(ageGroups)
      .filter(([_, count]) => count > 0)
      .map(([ageRange, count]) => [
        ageRange + ' years',
        count.toString(),
        `${((count / totalUsers) * 100).toFixed(1)}%`
      ]);
    
    this.addTable(['Age Range', 'Count', 'Percentage'], ageRows);

    this.yPosition += 5;
    this.addDivider();

    // === GENDER DISTRIBUTION ===
    this.checkPageBreak(60);
    this.addSectionHeader('GENDER DISTRIBUTION');
    
    const genderRows = Object.entries(genderCounts).map(([gender, count]) => [
      gender,
      count.toString(),
      `${((count / totalUsers) * 100).toFixed(1)}%`
    ]);
    
    this.addTable(['Gender', 'Count', 'Percentage'], genderRows);

    // === REGISTRATION TREND ===
    if (Object.keys(regCounts).length > 0) {
      this.checkPageBreak(80);
      this.yPosition += 5;
      this.addDivider();
      this.addSectionHeader('REGISTRATION TRENDS');
      
      const sortedRegCounts = Object.entries(regCounts).sort((a, b) => a[0].localeCompare(b[0]));
      const regRows = sortedRegCounts.map(([month, count]) => [
        month,
        count.toString(),
        `${((count / totalUsers) * 100).toFixed(1)}%`
      ]);
      
      this.addTable(['Month', 'New Registrations', '% of Total'], regRows);
    }

    // === LOGIN ACTIVITY ANALYSIS ===
    if (totalLogins > 0) {
      this.checkPageBreak(80);
      this.yPosition += 5;
      this.addDivider();
      this.addSectionHeader('LOGIN ACTIVITY BY HOUR');
      
      // Group hours into time periods for better readability
      const timePeriods = [
        { name: 'Early Morning (00:00-05:59)', hours: [0,1,2,3,4,5] },
        { name: 'Morning (06:00-11:59)', hours: [6,7,8,9,10,11] },
        { name: 'Afternoon (12:00-17:59)', hours: [12,13,14,15,16,17] },
        { name: 'Evening (18:00-23:59)', hours: [18,19,20,21,22,23] }
      ];
      
      const periodRows = timePeriods.map(period => {
        const periodTotal = period.hours.reduce((sum, hour) => sum + hourCounts[hour], 0);
        return [
          period.name,
          periodTotal.toString(),
          `${((periodTotal / totalLogins) * 100).toFixed(1)}%`
        ];
      });
      
      this.addTable(['Time Period', 'Total Logins', 'Percentage'], periodRows);
      
      this.yPosition += 3;
      this.pdf.setFontSize(10);
      this.pdf.setFont("helvetica", "bold");
      const peakText = `Peak Activity Hour: ${peakHour}:00 with ${peakCount} logins (${((peakCount/totalLogins)*100).toFixed(1)}% of all activity)`;
      this.pdf.text(peakText, this.margin, this.yPosition);
      this.pdf.setFont("helvetica", "normal");
      this.yPosition += 8;
    }

    // === STAFF OVERVIEW ===
    if (totalStaff > 0) {
      this.checkPageBreak(60);
      this.yPosition += 5;
      this.addDivider();
      this.addSectionHeader('STAFF OVERVIEW');
      
      const staffRows = [
        ['Total Staff Members', totalStaff.toString()],
        ['Active Staff', activeStaff.toString()],
        ['Inactive Staff', (totalStaff - activeStaff).toString()],
        ['Activity Rate', `${((activeStaff/totalStaff)*100).toFixed(1)}%`]
      ];
      
      this.addTable(['Metric', 'Count'], staffRows);
    }
  }

  // Capture and add charts
  async addChartsSection() {
    try {
      this.pdf.addPage();
      this.yPosition = 20;
      this.addSectionHeader('VISUAL ANALYTICS');

      const chartElements = document.querySelectorAll('canvas');
      
      if (chartElements.length === 0) {
        this.addText('No charts available to display.', 11);
        return;
      }
      
      for (let i = 0; i < chartElements.length && i < 4; i++) {
        try {
          const canvas = await html2canvas(chartElements[i], { 
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = this.pageWidth - (this.margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add chart title
          const chartTitles = ['Insurance Distribution', 'Age Groups', 'Gender Split', 'Registration Trend'];
          if (i < chartTitles.length) {
            this.checkPageBreak(imgHeight + 25);
            this.addText(chartTitles[i], 12, 0, true);
            this.yPosition += 2;
          }
          
          // Check if we need a new page
          if (this.checkPageBreak(imgHeight + 10)) {
            this.yPosition += 10;
          }
          
          this.pdf.addImage(imgData, 'PNG', this.margin, this.yPosition, imgWidth, imgHeight);
          this.yPosition += imgHeight + 15;
          
        } catch (chartError) {
          console.warn(`Could not capture chart ${i + 1}:`, chartError);
          this.addText(`[Chart ${i + 1} - Capture failed]`, 10);
          this.yPosition += 5;
        }
      }
    } catch (error) {
      console.warn('Could not add charts section:', error);
      this.addText('Charts could not be captured in this PDF report.', 10);
    }
  }

  // Add footer to each page
  addFooter() {
    const totalPages = this.pdf.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setFont("helvetica", "italic");
      
      // Page number
      this.pdf.text(
        `Page ${i} of ${totalPages}`, 
        this.pageWidth - this.margin, 
        this.pageHeight - 10, 
        { align: 'right' }
      );
      
      // Footer text
      this.pdf.text(
        'Generated by ServSync Analytics System', 
        this.pageWidth / 2, 
        this.pageHeight - 10, 
        { align: 'center' }
      );
    }
  }

  // Generate the complete report
  async generateReport(includeCharts = true) {
    try {
      // Add header
      this.pdf.setFontSize(22);
      this.pdf.setFont("helvetica", "bold");
      this.pdf.text('ServSync User Analytics Report', this.pageWidth / 2, 25, { align: 'center' });
      
      this.yPosition = 40;
      
      // Add statistics section
      this.addStatisticsSection();
      
      // Add charts if requested
      if (includeCharts) {
        await this.addChartsSection();
      }
      
      // Add footer to all pages
      this.addFooter();
      
      // Save the PDF
      const filename = `ServSync-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      this.pdf.save(filename);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export a simple function for direct use
export const generateUserAnalyticsReport = async (users, includeCharts = true, staff = []) => {
  const generator = new AnalyticsReportGenerator(users, staff);
  return await generator.generateReport(includeCharts);
};