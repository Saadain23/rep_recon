import { NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { readFile } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  try {
    const report = await req.json()

    // Read and convert logo to base64
    let logoBase64 = ''
    try {
      const logoPath = join(process.cwd(), 'public', 'withsecure_logo.webp')
      const logoBuffer = await readFile(logoPath)
      logoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`
    } catch (error) {
      console.warn('Could not load logo:', error)
      // Continue without logo if file not found
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()

    // Generate HTML content with logo
    const htmlContent = generateReportHTML(report, logoBase64)

    // Set viewport for better rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
    })

    // Set content and wait for everything to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    })

    // Wait a bit more to ensure all content is rendered
    await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 500)
      })
    })

    // Generate PDF with better page break handling
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      displayHeaderFooter: false,
    })

    await browser.close()

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="security-assessment-${report.product?.productName || 'report'}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateReportHTML(report: any, logoBase64: string = ''): string {
  // Helper to escape HTML
  const escapeHtml = (text: any): string => {
    if (text === null || text === undefined) return ''
    const str = String(text)
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return '#10b981'
      case 'medium': return '#f59e0b'
      case 'high': return '#f97316'
      case 'critical': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    if (score >= 40) return '#f97316'
    return '#ef4444'
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Assessment Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #ffffff;
    }
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
      position: relative;
    }
    .header h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    .header-logo {
      position: absolute;
      top: 0;
      right: 0;
      max-width: 150px;
      max-height: 60px;
      object-fit: contain;
    }
    .product-info {
      margin-bottom: 20px;
    }
    .product-name {
      font-size: 22px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 5px;
    }
    .vendor {
      color: #6b7280;
      font-size: 16px;
    }
    .metrics {
      display: flex;
      gap: 20px;
      margin: 30px 0;
    }
    .metric-card {
      flex: 1;
      padding: 20px;
      border: 2px solid;
      border-radius: 8px;
      text-align: center;
    }
    .metric-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      color: #6b7280;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
    }
    .section {
      margin: 30px 0;
      page-break-inside: auto;
      break-inside: auto;
    }
    .card {
      page-break-inside: auto;
      break-inside: auto;
      min-height: 50px;
    }
    .page-break-before {
      page-break-before: always;
      break-before: page;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .recommendation {
      padding: 20px;
      border: 2px solid;
      border-radius: 8px;
      margin: 20px 0;
      background: #f9fafb;
    }
    .recommendation.approve {
      border-color: #10b981;
      background: #ecfdf5;
    }
    .recommendation.reject {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .recommendation.conditional {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 15px 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin: 2px;
    }
    .badge-primary {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .list-item {
      padding: 10px;
      margin: 5px 0;
      border-left: 3px solid #e5e7eb;
      padding-left: 15px;
    }
    .list-item.risk {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    .list-item.strength {
      border-left-color: #10b981;
      background: #ecfdf5;
    }
    .severity-box {
      text-align: center;
      padding: 15px;
      border: 1px solid;
      border-radius: 6px;
    }
    .severity-critical {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .severity-high {
      border-color: #f97316;
      background: #fff7ed;
    }
    .severity-medium {
      border-color: #f59e0b;
      background: #fffbeb;
    }
    .severity-low {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .text-muted {
      color: #6b7280;
      font-size: 14px;
    }
    .text-sm {
      font-size: 14px;
    }
    .font-bold {
      font-weight: bold;
    }
    .mt-4 {
      margin-top: 16px;
    }
    .mb-2 {
      margin-bottom: 8px;
    }
    .sources {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .source-link {
      display: inline-block;
      padding: 6px 12px;
      margin: 4px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 12px;
      color: #3b82f6;
      text-decoration: none;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      .section {
        page-break-inside: auto;
        break-inside: auto;
      }
      .card {
        page-break-inside: auto;
        break-inside: auto;
      }
      .list-item {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      /* Prevent breaking within small elements */
      .metric-card, .severity-box {
        page-break-inside: avoid;
        break-inside: avoid;
      }
    }
    /* Allow page breaks for very long sections */
    .section-large {
      page-break-inside: auto;
      break-inside: auto;
    }
    .section-large .card {
      page-break-inside: auto;
      break-inside: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="WithSecure Logo" class="header-logo" />` : ''}
      <h1>Security Assessment Report</h1>
      ${report.product ? `
        <div class="product-info">
          <div class="product-name">${report.product.productName || 'Unknown Product'}</div>
          <div class="vendor">by ${report.product.vendorName || 'Unknown Vendor'}</div>
          ${report.product.websiteUrl ? `<div class="text-muted text-sm mt-4">${report.product.websiteUrl}</div>` : ''}
        </div>
      ` : ''}
    </div>

    <div class="metrics">
      <div class="metric-card" style="border-color: ${getTrustScoreColor(report.trustScore || 0)}; color: ${getTrustScoreColor(report.trustScore || 0)};">
        <div class="metric-label">Trust Score</div>
        <div class="metric-value">${report.trustScore || 0}/100</div>
      </div>
      <div class="metric-card" style="border-color: ${getRiskColor(report.riskLevel || 'Unknown')}; color: ${getRiskColor(report.riskLevel || 'Unknown')};">
        <div class="metric-label">Risk Level</div>
        <div class="metric-value">${report.riskLevel || 'Unknown'}</div>
      </div>
    </div>

    ${report.recommendation ? `
      <div class="recommendation ${
        report.recommendation.toLowerCase().includes('approve') && !report.recommendation.toLowerCase().includes('reject') ? 'approve' :
        report.recommendation.toLowerCase().includes('reject') ? 'reject' : 'conditional'
      }">
        <div class="font-bold mb-2">Recommendation</div>
        <div>${escapeHtml(report.recommendation)}</div>
      </div>
    ` : ''}

    ${report.executiveSummary ? `
      <div class="section">
        <div class="section-title">Executive Summary</div>
        <div class="card">
          <p>${escapeHtml(report.executiveSummary).replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    ` : ''}

    ${report.product && (report.product.headquarters || report.product.yearFounded || report.product.companyOverview) ? `
      <div class="section">
        <div class="section-title">Product Information</div>
        <div class="card">
          <div class="grid-2">
            ${report.product.headquarters ? `
              <div>
                <div class="text-muted text-sm mb-2">Headquarters</div>
                <div class="font-bold">${report.product.headquarters}</div>
              </div>
            ` : ''}
            ${report.product.yearFounded ? `
              <div>
                <div class="text-muted text-sm mb-2">Founded</div>
                <div class="font-bold">${report.product.yearFounded}</div>
              </div>
            ` : ''}
          </div>
          ${report.product.companyOverview ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Company Overview</div>
              <p>${escapeHtml(report.product.companyOverview)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.classification ? `
      <div class="section">
        <div class="section-title">Classification</div>
        <div class="card">
          <div class="grid-2">
            <div>
              <div class="text-muted text-sm mb-2">Primary Category</div>
              <span class="badge badge-primary">${report.classification.primaryCategory || 'Unknown'}</span>
            </div>
            ${report.classification.deploymentModel ? `
              <div>
                <div class="text-muted text-sm mb-2">Deployment Model</div>
                <span class="badge badge-primary">${report.classification.deploymentModel}</span>
              </div>
            ` : ''}
            ${report.classification.targetUsers ? `
              <div>
                <div class="text-muted text-sm mb-2">Target Users</div>
                <span class="badge badge-primary">${report.classification.targetUsers}</span>
              </div>
            ` : ''}
          </div>
          ${report.classification.keyFeatures && report.classification.keyFeatures.length > 0 ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Key Features</div>
              ${report.classification.keyFeatures.map((feature: string) => `
                <span class="badge badge-primary">${feature}</span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.productOverview ? `
      <div class="section">
        <div class="section-title">Product Overview</div>
        <div class="card">
          <p>${escapeHtml(report.productOverview).replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    ` : ''}

    ${report.securityPostureSummary ? `
      <div class="section">
        <div class="section-title">Security Posture Summary</div>
        <div class="card">
          <p>${escapeHtml(report.securityPostureSummary).replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    ` : ''}

    ${report.trustScoreRationale ? `
      <div class="section">
        <div class="section-title">Trust Score Rationale</div>
        <div class="card">
          <p>${escapeHtml(report.trustScoreRationale).replace(/\n/g, '<br>')}</p>
        </div>
      </div>
    ` : ''}

    ${report.keyFindings ? `
      <div class="section">
        <div class="section-title">Key Findings</div>
        <div class="card">
          ${report.keyFindings.risks && report.keyFindings.risks.length > 0 ? `
            <div class="mb-2 font-bold" style="color: #ef4444;">Risks</div>
            ${report.keyFindings.risks.map((risk: string) => `
              <div class="list-item risk">${escapeHtml(risk)}</div>
            `).join('')}
          ` : ''}
          ${report.keyFindings.strengths && report.keyFindings.strengths.length > 0 ? `
            <div class="mb-2 font-bold mt-4" style="color: #10b981;">Strengths</div>
            ${report.keyFindings.strengths.map((strength: string) => `
              <div class="list-item strength">${escapeHtml(strength)}</div>
            `).join('')}
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.detailedFindings?.cve ? `
      <div class="section">
        <div class="section-title">CVE Analysis</div>
        <div class="card">
          <div class="grid-2">
            ${report.detailedFindings.cve.totalCVEs !== undefined ? `
              <div>
                <div class="text-muted text-sm mb-2">Total CVEs (2 years)</div>
                <div class="font-bold" style="font-size: 24px;">${report.detailedFindings.cve.totalCVEs}</div>
              </div>
            ` : ''}
            ${report.detailedFindings.cve.trend ? `
              <div>
                <div class="text-muted text-sm mb-2">Trend</div>
                <div class="font-bold" style="font-size: 20px; text-transform: capitalize;">${report.detailedFindings.cve.trend}</div>
              </div>
            ` : ''}
          </div>
          ${report.detailedFindings.cve.severityBreakdown ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Severity Breakdown</div>
              <div class="grid-4">
                <div class="severity-box severity-critical">
                  <div class="text-muted text-sm">Critical</div>
                  <div class="font-bold" style="font-size: 20px; color: #ef4444;">${report.detailedFindings.cve.severityBreakdown.critical || 0}</div>
                </div>
                <div class="severity-box severity-high">
                  <div class="text-muted text-sm">High</div>
                  <div class="font-bold" style="font-size: 20px; color: #f97316;">${report.detailedFindings.cve.severityBreakdown.high || 0}</div>
                </div>
                <div class="severity-box severity-medium">
                  <div class="text-muted text-sm">Medium</div>
                  <div class="font-bold" style="font-size: 20px; color: #f59e0b;">${report.detailedFindings.cve.severityBreakdown.medium || 0}</div>
                </div>
                <div class="severity-box severity-low">
                  <div class="text-muted text-sm">Low</div>
                  <div class="font-bold" style="font-size: 20px; color: #3b82f6;">${report.detailedFindings.cve.severityBreakdown.low || 0}</div>
                </div>
              </div>
            </div>
          ` : ''}
          ${report.detailedFindings.cve.recentCritical && report.detailedFindings.cve.recentCritical.length > 0 ? `
            <div class="mt-4">
              <div class="font-bold mb-2" style="color: #ef4444;">Recent Critical Vulnerabilities</div>
              ${report.detailedFindings.cve.recentCritical.map((cve: any) => `
                <div class="list-item risk" style="margin-bottom: 10px;">
                  ${cve.cveId ? `<div class="font-bold text-sm" style="color: #ef4444;">${escapeHtml(cve.cveId)}</div>` : ''}
                  <div>${escapeHtml(cve.description || '')}</div>
                  ${cve.date ? `<div class="text-muted text-sm mt-1">Date: ${escapeHtml(cve.date)}</div>` : ''}
                  ${cve.severity ? `<div class="text-muted text-sm">Severity: ${escapeHtml(cve.severity)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.cve.avgPatchTime ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Average Patch Response Time</div>
              <div class="font-bold">${escapeHtml(report.detailedFindings.cve.avgPatchTime)}</div>
            </div>
          ` : ''}
          ${report.detailedFindings.cve.notableIncidents && report.detailedFindings.cve.notableIncidents.length > 0 ? `
            <div class="mt-4">
              <div class="font-bold mb-2">Notable Incidents</div>
              <ul style="list-style: disc; padding-left: 20px;">
                ${report.detailedFindings.cve.notableIncidents.map((incident: string) => `
                  <li style="margin-bottom: 5px;">${escapeHtml(incident)}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.detailedFindings?.incidents ? `
      <div class="section">
        <div class="section-title">Incident & Abuse Analysis</div>
        <div class="card">
          ${report.detailedFindings.incidents.summary ? `<p class="mb-2">${escapeHtml(report.detailedFindings.incidents.summary)}</p>` : ''}
          <div class="grid-2">
            ${report.detailedFindings.incidents.vendorSecurityRating !== undefined ? `
              <div>
                <div class="text-muted text-sm mb-2">Vendor Security Rating</div>
                <div class="font-bold" style="font-size: 24px;">${report.detailedFindings.incidents.vendorSecurityRating}/10</div>
              </div>
            ` : ''}
            ${report.detailedFindings.incidents.transparency !== undefined ? `
              <div>
                <div class="text-muted text-sm mb-2">Transparency Rating</div>
                <div class="font-bold" style="font-size: 24px;">${report.detailedFindings.incidents.transparency}/10</div>
              </div>
            ` : ''}
          </div>
          ${report.detailedFindings.incidents.dataBreaches && report.detailedFindings.incidents.dataBreaches.length > 0 ? `
            <div class="mt-4">
              <div class="font-bold mb-2" style="color: #ef4444;">Data Breaches</div>
              ${report.detailedFindings.incidents.dataBreaches.map((breach: any) => `
                <div class="list-item risk" style="margin-bottom: 10px;">
                  ${breach.date ? `<div class="text-muted text-sm">${escapeHtml(breach.date)}</div>` : ''}
                  <div>${escapeHtml(breach.description || '')}</div>
                  ${breach.impact ? `<div class="text-muted text-sm mt-1">Impact: ${escapeHtml(breach.impact)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.incidents.securityIncidents && report.detailedFindings.incidents.securityIncidents.length > 0 ? `
            <div class="mt-4">
              <div class="font-bold mb-2" style="color: #f97316;">Security Incidents</div>
              ${report.detailedFindings.incidents.securityIncidents.map((incident: any) => `
                <div class="list-item" style="border-left-color: #f97316; background: #fff7ed; margin-bottom: 10px;">
                  ${incident.date ? `<div class="text-muted text-sm">${escapeHtml(incident.date)}</div>` : ''}
                  <div>${escapeHtml(incident.description || '')}</div>
                  ${incident.severity ? `<div class="text-muted text-sm mt-1">Severity: ${escapeHtml(incident.severity)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.incidents.abuseSignals && report.detailedFindings.incidents.abuseSignals.length > 0 ? `
            <div class="mt-4">
              <div class="font-bold mb-2" style="color: #f59e0b;">Abuse Signals</div>
              ${report.detailedFindings.incidents.abuseSignals.map((abuse: any) => `
                <div class="list-item" style="border-left-color: #f59e0b; background: #fffbeb; margin-bottom: 10px;">
                  ${abuse.type ? `<div class="font-bold text-sm">${escapeHtml(abuse.type)}</div>` : ''}
                  <div>${escapeHtml(abuse.description || '')}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.incidents.ransomwareAssociations ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Ransomware/Malware Associations</div>
              <div class="font-bold">${escapeHtml(report.detailedFindings.incidents.ransomwareAssociations)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.detailedFindings?.compliance ? `
      <div class="section">
        <div class="section-title">Compliance & Data Handling</div>
        <div class="card">
          ${report.detailedFindings.compliance.summary ? `<p class="mb-2">${escapeHtml(report.detailedFindings.compliance.summary)}</p>` : ''}
          <div class="grid-2">
            ${report.detailedFindings.compliance.complianceScore !== undefined ? `
              <div>
                <div class="text-muted text-sm mb-2">Compliance Score</div>
                <div class="font-bold" style="font-size: 24px;">${report.detailedFindings.compliance.complianceScore}/10</div>
              </div>
            ` : ''}
            ${report.detailedFindings.compliance.privacyScore !== undefined ? `
              <div>
                <div class="text-muted text-sm mb-2">Privacy Score</div>
                <div class="font-bold" style="font-size: 24px;">${report.detailedFindings.compliance.privacyScore}/10</div>
              </div>
            ` : ''}
          </div>
          ${report.detailedFindings.compliance.certifications && report.detailedFindings.compliance.certifications.length > 0 ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Certifications</div>
              ${report.detailedFindings.compliance.certifications.map((cert: string) => `
                <span class="badge badge-success">${cert}</span>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.compliance.dataHandling ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Data Handling Practices</div>
              <p>${escapeHtml(report.detailedFindings.compliance.dataHandling)}</p>
            </div>
          ` : ''}
          ${report.detailedFindings.compliance.dataResidency ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Data Residency</div>
              <p>${escapeHtml(report.detailedFindings.compliance.dataResidency)}</p>
            </div>
          ` : ''}
          ${report.detailedFindings.compliance.encryption ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Encryption</div>
              <p>${escapeHtml(report.detailedFindings.compliance.encryption)}</p>
            </div>
          ` : ''}
          ${report.detailedFindings.compliance.adminControls ? `
            <div class="mt-4">
              <div class="text-muted text-sm mb-2">Admin Controls</div>
              <p>${escapeHtml(report.detailedFindings.compliance.adminControls)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${report.detailedFindings?.riskAnalysis ? `
      <div class="section">
        <div class="section-title">Risk Analysis Details</div>
        <div class="card">
          ${report.detailedFindings.riskAnalysis.rationale ? `
            <div class="mb-4">
              <div class="font-bold mb-2">Rationale</div>
              <p>${escapeHtml(report.detailedFindings.riskAnalysis.rationale)}</p>
            </div>
          ` : ''}
          ${report.detailedFindings.riskAnalysis.confidenceLevel ? `
            <div class="mb-4">
              <div class="text-muted text-sm mb-2">Confidence Level</div>
              <div class="font-bold" style="font-size: 20px;">${report.detailedFindings.riskAnalysis.confidenceLevel}</div>
            </div>
          ` : ''}
          ${report.detailedFindings.riskAnalysis.keyRisks && report.detailedFindings.riskAnalysis.keyRisks.length > 0 ? `
            <div class="mb-4">
              <div class="font-bold mb-2" style="color: #ef4444;">Key Risks</div>
              ${report.detailedFindings.riskAnalysis.keyRisks.map((risk: string) => `
                <div class="list-item risk">${escapeHtml(risk)}</div>
              `).join('')}
            </div>
          ` : ''}
          ${report.detailedFindings.riskAnalysis.keyStrengths && report.detailedFindings.riskAnalysis.keyStrengths.length > 0 ? `
            <div>
              <div class="font-bold mb-2" style="color: #10b981;">Key Strengths</div>
              ${report.detailedFindings.riskAnalysis.keyStrengths.map((strength: string) => `
                <div class="list-item strength">${escapeHtml(strength)}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    ${(() => {
      const alternativesArray = Array.isArray(report.alternatives) 
        ? report.alternatives 
        : report.alternatives?.alternatives
      
      if (!alternativesArray || alternativesArray.length === 0) return ''
      
      return `
        <div class="section">
          <div class="section-title">Alternative Options</div>
          ${alternativesArray.map((alt: any) => `
            <div class="card" style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                  <div class="font-bold" style="font-size: 18px;">${alt.name || alt.product || 'Unknown'}</div>
                  ${alt.vendor ? `<div class="text-muted text-sm">by ${alt.vendor}</div>` : ''}
                </div>
                ${alt.trustScore !== undefined ? `
                  <div style="padding: 10px; border: 1px solid; border-radius: 6px; text-align: center; min-width: 80px;">
                    <div class="text-muted text-sm">Trust Score</div>
                    <div class="font-bold" style="font-size: 20px; color: ${getTrustScoreColor(alt.trustScore)};">${alt.trustScore}/100</div>
                  </div>
                ` : ''}
              </div>
              ${alt.reason ? `
                <div class="mt-4">
                  <div class="text-muted text-sm mb-2">Why this alternative?</div>
                  <p>${escapeHtml(alt.reason)}</p>
                </div>
              ` : ''}
              ${alt.website ? `
                <div class="mt-4">
                  <a href="${alt.website}" class="source-link">${alt.website}</a>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `
    })()}

    <div class="footer">
      <div>Assessment Date: ${formatDate(report.assessmentDate)}</div>
      ${report.generatedBy ? `<div>Generated by: ${report.generatedBy}</div>` : ''}
    </div>
  </div>
</body>
</html>
  `
}

