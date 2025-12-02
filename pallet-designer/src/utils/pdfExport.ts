import jsPDF from 'jspdf';
import type { PalletComponent, ViewType, PalletSpecification, BrandingConfig } from '../types';
import { VIEW_LABELS } from '../constants';

interface ExportOptions {
  components: Record<ViewType, PalletComponent[]>;
  specification: PalletSpecification;
  branding: BrandingConfig;
  currentPreset: string;
  canvasDataUrl?: string; // Optional current canvas snapshot
}

// Helper to draw a component on PDF
function drawComponent(
  pdf: jsPDF,
  component: PalletComponent,
  offsetX: number,
  offsetY: number,
  scale: number
) {
  const x = offsetX + component.position.x * scale;
  const y = offsetY + component.position.y * scale;
  const w = component.dimensions.width * scale;
  const h = component.dimensions.length * scale;

  // Set colors based on component type
  const colors: Record<string, { fill: number[]; stroke: number[] }> = {
    'deck-board': { fill: [212, 165, 116], stroke: [139, 105, 20] },
    'stringer': { fill: [196, 149, 106], stroke: [139, 105, 20] },
    'block': { fill: [229, 196, 154], stroke: [139, 105, 20] },
    'notched-block': { fill: [219, 184, 138], stroke: [139, 105, 20] },
    'chamfered-block': { fill: [217, 176, 128], stroke: [139, 105, 20] },
    'lead-board': { fill: [207, 168, 112], stroke: [139, 105, 20] },
  };

  const color = colors[component.type] || colors['block'];
  
  // Draw filled rectangle
  pdf.setFillColor(color.fill[0], color.fill[1], color.fill[2]);
  pdf.setDrawColor(color.stroke[0], color.stroke[1], color.stroke[2]);
  pdf.setLineWidth(0.3);
  pdf.rect(x, y, w, h, 'FD');
}

// Draw a view with title
function drawView(
  pdf: jsPDF,
  view: ViewType,
  components: PalletComponent[],
  startX: number,
  startY: number,
  viewWidth: number,
  viewHeight: number,
  scale: number
) {
  const padding = 3;
  const titleHeight = 6;
  
  // View title
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 122, 201);
  pdf.text(`${VIEW_LABELS[view].label} (${VIEW_LABELS[view].arrow})`, startX, startY);
  
  // View border
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.rect(startX, startY + 2, viewWidth, viewHeight - titleHeight);
  
  // Draw components
  components.forEach((comp) => {
    drawComponent(pdf, comp, startX + padding, startY + titleHeight, scale);
  });
  
  // Component count
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `${components.length} component${components.length !== 1 ? 's' : ''}`,
    startX + viewWidth - 2,
    startY + viewHeight - 1,
    { align: 'right' }
  );
}

// Main export function
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { components, specification, branding, currentPreset } = options;
  
  // Create PDF in A4 portrait
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  // === HEADER ===
  let y = margin;
  
  // Company name
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 122, 201);
  pdf.text(branding.companyName, margin, y);
  
  // Document title
  y += 8;
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Pallet Specification Drawing', margin, y);
  
  // Preset name
  y += 5;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Template: ${currentPreset.toUpperCase()}`, margin, y);
  
  // Date
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(today, pageWidth - margin, y, { align: 'right' });
  
  // Horizontal line
  y += 3;
  pdf.setDrawColor(30, 122, 201);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  
  // === PALLET SPECIFICATIONS ===
  y += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Pallet Specifications', margin, y);
  
  y += 6;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  
  // Two columns for specs
  const col1X = margin;
  const col2X = margin + contentWidth / 2;
  const lineSpacing = 4.5;
  
  // Column 1
  pdf.text(`Overall Dimensions: ${specification.overallDimensions.length} × ${specification.overallDimensions.width} × ${specification.overallDimensions.height} mm`, col1X, y);
  pdf.text(`Classification: ${specification.classification.type}`, col1X, y + lineSpacing);
  pdf.text(`Face: ${specification.classification.face}`, col1X, y + lineSpacing * 2);
  pdf.text(`Entry: ${specification.classification.entry}`, col1X, y + lineSpacing * 3);
  
  // Column 2
  pdf.text(`Material: ${specification.materials.lumberId}`, col2X, y);
  pdf.text(`Surface: ${specification.materials.surface}`, col2X, y + lineSpacing);
  pdf.text(`Static Load: ${specification.materials.staticLoadCapacity} kg`, col2X, y + lineSpacing * 2);
  pdf.text(`Dynamic Load: ${specification.materials.dynamicLoadCapacity} kg`, col2X, y + lineSpacing * 3);
  
  // === VIEWS ===
  y += lineSpacing * 4 + 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Pallet Views', margin, y);
  
  y += 4;
  
  // Calculate view grid layout - 2x2 grid
  const viewAreaHeight = pageHeight - y - margin - 20; // Leave room for footer
  const viewWidth = (contentWidth - 5) / 2; // 5mm gap between columns
  const viewHeight = (viewAreaHeight - 5) / 2; // 5mm gap between rows
  
  // Scale factor for drawing (fit 300mm into viewWidth)
  const maxPalletDim = Math.max(specification.overallDimensions.length, specification.overallDimensions.width);
  const scale = (viewWidth - 10) / maxPalletDim; // 10mm padding in view
  
  const views: ViewType[] = ['top', 'side', 'end', 'bottom'];
  const positions = [
    { x: margin, y: y },
    { x: margin + viewWidth + 5, y: y },
    { x: margin, y: y + viewHeight + 5 },
    { x: margin + viewWidth + 5, y: y + viewHeight + 5 },
  ];
  
  views.forEach((view, index) => {
    const pos = positions[index];
    drawView(
      pdf,
      view,
      components[view],
      pos.x,
      pos.y,
      viewWidth,
      viewHeight,
      scale * 0.8 // Scale down a bit more for better fit
    );
  });
  
  // === FOOTER ===
  const footerY = pageHeight - margin;
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    `Generated by ${branding.companyName} Pallet Designer`,
    margin,
    footerY
  );
  pdf.text(
    'Page 1 of 1',
    pageWidth - margin,
    footerY,
    { align: 'right' }
  );
  
  // Watermark (subtle)
  pdf.setFontSize(60);
  pdf.setTextColor(240, 240, 240);
  pdf.setFont('helvetica', 'bold');
  // Center watermark diagonally
  pdf.text(
    branding.watermarkText || branding.companyName,
    pageWidth / 2,
    pageHeight / 2,
    {
      align: 'center',
      angle: 45,
    }
  );
  
  // Save the PDF
  const fileName = `pallet-design-${currentPreset}-${Date.now()}.pdf`;
  pdf.save(fileName);
}

// Export Fabric canvas as data URL (for PDF embedding)
export function exportFabricCanvasAsDataUrl(fabricCanvas: { toDataURL: (options: { format: string; multiplier?: number }) => string } | null): string | null {
  if (!fabricCanvas) return null;
  
  try {
    return fabricCanvas.toDataURL({
      format: 'png',
      multiplier: 2
    });
  } catch (error) {
    console.error('Failed to export canvas:', error);
    return null;
  }
}
