import jsPDF from 'jspdf';
import type { PalletComponent, ViewType, PalletSpecification, BrandingConfig, Annotation } from '../types';
import { VIEW_LABELS, CANVAS_SCALE, COMPONENT_COLORS, A4_WIDTH_PX, A4_HEIGHT_PX } from '../constants';
import * as fabric from 'fabric';

interface ExportOptions {
  components: Record<ViewType, PalletComponent[]>;
  annotations: Record<ViewType, Annotation[]>;
  specification: PalletSpecification;
  branding: BrandingConfig;
  currentPreset: string;
}

const VIEWS: ViewType[] = ['top', 'side', 'end', 'bottom'];

// Render a view to a canvas and return as data URL
async function renderViewToDataUrl(
  components: PalletComponent[],
  annotations: Annotation[]
): Promise<string> {
  // Create an off-screen canvas
  const canvas = new fabric.StaticCanvas(undefined, {
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    backgroundColor: '#ffffff',
  });

  // Grid removed as per user request for final template

  // Draw paper boundary
  canvas.add(new fabric.Rect({
    left: 0,
    top: 0,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    fill: 'transparent',
    stroke: '#cccccc',
    strokeWidth: 1,
    selectable: false,
    evented: false,
  }));

  // Draw components
  components.forEach((comp) => {
    // Use custom color if set, otherwise use default for component type
    const colors = comp.color || COMPONENT_COLORS[comp.type as keyof typeof COMPONENT_COLORS] || { fill: '#cccccc', stroke: '#999999' };
    const w = comp.dimensions.width * CANVAS_SCALE;
    const h = comp.dimensions.length * CANVAS_SCALE;
    // Position is stored as top-left but we draw with center origin
    const centerX = comp.position.x * CANVAS_SCALE + w / 2;
    const centerY = comp.position.y * CANVAS_SCALE + h / 2;
    const rotation = comp.rotation || 0;

    let shape: fabric.FabricObject;
    
    if (comp.type === 'notched-block') {
      const notchWidth = w * 0.3;
      const notchHeight = h * 0.25;
      const pathData = `M ${-w/2} ${-h/2} L ${w/2 - notchWidth} ${-h/2} L ${w/2 - notchWidth} ${-h/2 + notchHeight} L ${w/2} ${-h/2 + notchHeight} L ${w/2} ${h/2} L ${-w/2} ${h/2} Z`;
      shape = new fabric.Path(pathData, {
        left: centerX,
        top: centerY,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        angle: rotation,
        selectable: false,
        evented: false,
      });
    } else if (comp.type === 'chamfered-block') {
      const chamferSize = Math.min(w, h) * 0.2;
      const pathData = `M ${-w/2 + chamferSize} ${-h/2} L ${w/2 - chamferSize} ${-h/2} L ${w/2} ${-h/2 + chamferSize} L ${w/2} ${h/2 - chamferSize} L ${w/2 - chamferSize} ${h/2} L ${-w/2 + chamferSize} ${h/2} L ${-w/2} ${h/2 - chamferSize} L ${-w/2} ${-h/2 + chamferSize} Z`;
      shape = new fabric.Path(pathData, {
        left: centerX,
        top: centerY,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        angle: rotation,
        selectable: false,
        evented: false,
      });
    } else {
      shape = new fabric.Rect({
        left: centerX,
        top: centerY,
        width: w,
        height: h,
        fill: colors.fill,
        stroke: colors.stroke,
        strokeWidth: 1,
        originX: 'center',
        originY: 'center',
        angle: rotation,
        selectable: false,
        evented: false,
      });
    }
    canvas.add(shape);
  });

  // Draw annotations
  annotations.forEach((ann) => {
    if (ann.type === 'text') {
      const x = ann.position.x * CANVAS_SCALE;
      const y = ann.position.y * CANVAS_SCALE;
      const text = new fabric.FabricText(ann.text || 'Text', {
        left: x,
        top: y,
        fontSize: ann.fontSize || 14,
        fill: ann.color || '#1f2937',
        fontFamily: 'Arial',
        fontWeight: ann.fontWeight || 'normal',
        angle: ann.rotation || 0,
        selectable: false,
        evented: false,
      });
      canvas.add(text);
    } else if (ann.type === 'dimension') {
      const x = ann.startPosition.x * CANVAS_SCALE;
      const y = ann.startPosition.y * CANVAS_SCALE;
      const endX = ann.endPosition.x * CANVAS_SCALE;
      const endY = ann.endPosition.y * CANVAS_SCALE;
      
      // Main dimension line
      const line = new fabric.Line([x, y, endX, endY], {
        stroke: '#3b82f6',
        strokeWidth: 1.5,
        selectable: false,
        evented: false,
      });
      canvas.add(line);
      
      // End ticks
      const tickSize = 8;
      const angle = Math.atan2(endY - y, endX - x);
      const perpAngle = angle + Math.PI / 2;
      
      const tick1 = new fabric.Line([
        x - tickSize * Math.cos(perpAngle),
        y - tickSize * Math.sin(perpAngle),
        x + tickSize * Math.cos(perpAngle),
        y + tickSize * Math.sin(perpAngle),
      ], { stroke: '#3b82f6', strokeWidth: 1.5, selectable: false, evented: false });
      
      const tick2 = new fabric.Line([
        endX - tickSize * Math.cos(perpAngle),
        endY - tickSize * Math.sin(perpAngle),
        endX + tickSize * Math.cos(perpAngle),
        endY + tickSize * Math.sin(perpAngle),
      ], { stroke: '#3b82f6', strokeWidth: 1.5, selectable: false, evented: false });
      
      canvas.add(tick1, tick2);
      
      // Dimension text
      const midX = (x + endX) / 2;
      const midY = (y + endY) / 2;
      
      if (ann.showValue) {
        const dimText = new fabric.FabricText(`${Math.round(ann.value)} mm`, {
          left: midX,
          top: midY - 10,
          fontSize: 11,
          fill: '#3b82f6',
          fontFamily: 'Arial',
          originX: 'center',
          backgroundColor: 'white',
          selectable: false,
          evented: false,
        });
        canvas.add(dimText);
      }
    } else if (ann.type === 'callout') {
      const x = ann.textPosition.x * CANVAS_SCALE;
      const y = ann.textPosition.y * CANVAS_SCALE;
      const anchorX = ann.anchorPosition.x * CANVAS_SCALE;
      const anchorY = ann.anchorPosition.y * CANVAS_SCALE;
      
      // Leader line from anchor to text
      const leaderLine = new fabric.Line([anchorX, anchorY, x, y + 15], {
        stroke: '#f59e0b',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      canvas.add(leaderLine);
      
      // Callout box
      const boxWidth = 80;
      const boxHeight = 30;
      const box = new fabric.Rect({
        left: x,
        top: y,
        width: boxWidth,
        height: boxHeight,
        fill: '#fffbeb',
        stroke: '#f59e0b',
        strokeWidth: 1,
        rx: 4,
        ry: 4,
        selectable: false,
        evented: false,
      });
      canvas.add(box);
      
      const calloutText = new fabric.FabricText(ann.text || 'Note', {
        left: x + boxWidth / 2,
        top: y + boxHeight / 2,
        fontSize: 10,
        fill: '#92400e',
        fontFamily: 'Arial',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });
      canvas.add(calloutText);
    }
  });

  canvas.renderAll();
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 1.5,
  });
  
  canvas.dispose();
  return dataUrl;
}

// Main export function - creates a professional multi-view PDF
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { components, annotations, specification, branding, currentPreset } = options;
  
  // Create PDF in A4 landscape for better view layout
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - 2 * margin;
  
  // === HEADER ===
  let y = margin;
  
  // Company name
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 122, 201);
  pdf.text(branding.companyName, margin, y + 5);
  
  // Document title
  pdf.setFontSize(14);
  pdf.setTextColor(60, 60, 60);
  pdf.text('Pallet Specification Drawing', margin, y + 12);
  
  // Right side info
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  pdf.text(`Template: ${currentPreset.toUpperCase()}`, pageWidth - margin, y + 3, { align: 'right' });
  pdf.text(`Date: ${today}`, pageWidth - margin, y + 8, { align: 'right' });
  
  // Header line
  y += 16;
  pdf.setDrawColor(30, 122, 201);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, pageWidth - margin, y);
  
  // === SPECIFICATIONS BOX (left side) ===
  y += 4;
  const specBoxWidth = 65;
  const specBoxHeight = contentHeight - 25;
  
  // Specs background
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, y, specBoxWidth, specBoxHeight, 2, 2, 'FD');
  
  // Specs title
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.text('SPECIFICATIONS', margin + 3, y + 6);
  
  // Specs content
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  
  let specY = y + 14;
  const specLineHeight = 5;
  
  // Dimensions section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dimensions', margin + 3, specY);
  specY += specLineHeight;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`L x W x H: ${specification.overallDimensions.length} x ${specification.overallDimensions.width} x ${specification.overallDimensions.height} mm`, margin + 3, specY);
  
  specY += specLineHeight * 1.5;
  
  // Classification section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Classification', margin + 3, specY);
  specY += specLineHeight;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Type: ${specification.classification.type}`, margin + 3, specY);
  specY += specLineHeight;
  pdf.text(`Face: ${specification.classification.face}`, margin + 3, specY);
  specY += specLineHeight;
  pdf.text(`Entry: ${specification.classification.entry}`, margin + 3, specY);
  
  specY += specLineHeight * 1.5;
  
  // Material section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Materials', margin + 3, specY);
  specY += specLineHeight;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Lumber: ${specification.materials.lumberId}`, margin + 3, specY);
  specY += specLineHeight;
  pdf.text(`Surface: ${specification.materials.surface}`, margin + 3, specY);
  
  specY += specLineHeight * 1.5;
  
  // Load capacity section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Load Capacity', margin + 3, specY);
  specY += specLineHeight;
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Static: ${specification.materials.staticLoadCapacity} kg`, margin + 3, specY);
  specY += specLineHeight;
  pdf.text(`Dynamic: ${specification.materials.dynamicLoadCapacity} kg`, margin + 3, specY);
  
  specY += specLineHeight * 1.5;
  
  // Component count section
  pdf.setFont('helvetica', 'bold');
  pdf.text('Components', margin + 3, specY);
  specY += specLineHeight;
  pdf.setFont('helvetica', 'normal');
  VIEWS.forEach((view) => {
    const count = components[view].length;
    pdf.text(`${VIEW_LABELS[view].label}: ${count}`, margin + 3, specY);
    specY += specLineHeight;
  });
  
  // === VIEW GRID (right side) ===
  const viewAreaLeft = margin + specBoxWidth + 8;
  const viewAreaWidth = contentWidth - specBoxWidth - 8;
  const viewAreaTop = y;
  const viewAreaHeight = specBoxHeight;
  
  // 2x2 grid of views
  const viewGap = 4;
  const viewWidth = (viewAreaWidth - viewGap) / 2;
  const viewHeight = (viewAreaHeight - viewGap) / 2;
  
  const viewPositions = [
    { x: viewAreaLeft, y: viewAreaTop, view: 'top' as ViewType },
    { x: viewAreaLeft + viewWidth + viewGap, y: viewAreaTop, view: 'side' as ViewType },
    { x: viewAreaLeft, y: viewAreaTop + viewHeight + viewGap, view: 'end' as ViewType },
    { x: viewAreaLeft + viewWidth + viewGap, y: viewAreaTop + viewHeight + viewGap, view: 'bottom' as ViewType },
  ];
  
  // Render each view
  for (const pos of viewPositions) {
    // Render view to image
    const viewDataUrl = await renderViewToDataUrl(
      components[pos.view],
      annotations[pos.view] || []
    );
    
    // View background
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(pos.x, pos.y, viewWidth, viewHeight, 1, 1, 'FD');
    
    // View title bar
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(pos.x, pos.y, viewWidth, 6, 1, 1, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(`${VIEW_LABELS[pos.view].label} (${VIEW_LABELS[pos.view].arrow})`, pos.x + 2, pos.y + 4.5);
    
    // Add the rendered view image
    const imgY = pos.y + 7;
    const imgHeight = viewHeight - 8;
    const imgWidth = viewWidth - 2;
    
    // Calculate aspect ratio to fit
    const aspectRatio = A4_WIDTH_PX / A4_HEIGHT_PX;
    let finalWidth = imgWidth;
    let finalHeight = imgWidth / aspectRatio;
    
    if (finalHeight > imgHeight) {
      finalHeight = imgHeight;
      finalWidth = finalHeight * aspectRatio;
    }
    
    const imgX = pos.x + 1 + (imgWidth - finalWidth) / 2;
    const imgYCentered = imgY + (imgHeight - finalHeight) / 2;
    
    pdf.addImage(viewDataUrl, 'PNG', imgX, imgYCentered, finalWidth, finalHeight);
  }
  
  // === FOOTER ===
  const footerY = pageHeight - 6;
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
  if (branding.watermarkText) {
    pdf.setFontSize(50);
    pdf.setTextColor(245, 245, 245);
    pdf.setFont('helvetica', 'bold');
    pdf.text(
      branding.watermarkText,
      pageWidth / 2,
      pageHeight / 2,
      {
        align: 'center',
        angle: 30,
      }
    );
  }
  
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
