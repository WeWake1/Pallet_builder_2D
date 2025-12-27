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
  finalCanvasDataUrl?: string | null;
  finalViewConfig?: Record<ViewType, { x: number; y: number; scale: number }>;
  finalTextConfig?: Record<string, any>;
}

const VIEWS: ViewType[] = ['top', 'side', 'end', 'bottom'];

// Render a view to a canvas and return as data URL
async function renderViewToDataUrl(
  components: PalletComponent[],
  annotations: Annotation[],
  targetWidth: number,
  targetHeight: number,
  viewConfig?: { x: number; y: number; scale: number }
): Promise<string> {
  // Create an off-screen canvas
  const canvas = new fabric.StaticCanvas(undefined, {
    width: targetWidth,
    height: targetHeight,
    backgroundColor: undefined, // Transparent background
  });

  // Grid removed as per user request for final template

  // Draw components
  // Sort by Z-index to ensure correct layering
  const sortedComponents = [...components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  
  sortedComponents.forEach((comp) => {
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
      const text = new fabric.Text(ann.text || 'Text', {
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
        const dimText = new fabric.Text(`${Math.round(ann.value)} mm`, {
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
      
      const calloutText = new fabric.Text(ann.text || 'Note', {
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

  // Auto-scale to fit canvas
  const objects = canvas.getObjects();
  if (objects.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Use manual bounding box calculation to match FinalCanvas logic exactly
    // This ensures consistent behavior between editor and PDF
    const expandBounds = (x: number, y: number, w: number, h: number, rotation = 0) => {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      
      const bbW = w * cos + h * sin;
      const bbH = w * sin + h * cos;
      
      const cx = x + w / 2;
      const cy = y + h / 2;
      
      const bbX = cx - bbW / 2;
      const bbY = cy - bbH / 2;
      
      minX = Math.min(minX, bbX);
      minY = Math.min(minY, bbY);
      maxX = Math.max(maxX, bbX + bbW);
      maxY = Math.max(maxY, bbY + bbH);
    };

    // We need to iterate over the original components to get accurate dimensions/rotation
    // The fabric objects on canvas might have different properties
    components.forEach(comp => {
      expandBounds(
        comp.position.x * CANVAS_SCALE,
        comp.position.y * CANVAS_SCALE,
        comp.dimensions.width * CANVAS_SCALE,
        comp.dimensions.length * CANVAS_SCALE,
        comp.rotation
      );
    });

    // Also include annotations in bounds
    annotations.forEach(ann => {
      if (ann.type === 'text') {
        expandBounds(ann.position.x * CANVAS_SCALE, ann.position.y * CANVAS_SCALE, 50, 20, ann.rotation);
      } else if (ann.type === 'dimension') {
        minX = Math.min(minX, ann.startPosition.x * CANVAS_SCALE, ann.endPosition.x * CANVAS_SCALE);
        minY = Math.min(minY, ann.startPosition.y * CANVAS_SCALE, ann.endPosition.y * CANVAS_SCALE);
        maxX = Math.max(maxX, ann.startPosition.x * CANVAS_SCALE, ann.endPosition.x * CANVAS_SCALE);
        maxY = Math.max(maxY, ann.startPosition.y * CANVAS_SCALE, ann.endPosition.y * CANVAS_SCALE);
      } else if (ann.type === 'callout') {
        minX = Math.min(minX, ann.anchorPosition.x * CANVAS_SCALE, ann.textPosition.x * CANVAS_SCALE);
        minY = Math.min(minY, ann.anchorPosition.y * CANVAS_SCALE, ann.textPosition.y * CANVAS_SCALE);
        maxX = Math.max(maxX, ann.anchorPosition.x * CANVAS_SCALE, ann.textPosition.x * CANVAS_SCALE + 80);
        maxY = Math.max(maxY, ann.anchorPosition.y * CANVAS_SCALE, ann.textPosition.y * CANVAS_SCALE + 30);
      }
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    if (width > 0 && height > 0) {
      // Use proportional padding (5%) instead of fixed pixels to match editor
      const padding = Math.max(width, height) * 0.05;
      const availableWidth = targetWidth - padding * 2;
      const availableHeight = targetHeight - padding * 2;
      
      // Calculate auto-scale values
      const scaleX = availableWidth / width;
      const scaleY = availableHeight / height;
      let scale = Math.min(scaleX, scaleY);
      
      // Calculate center position
      const centerX = targetWidth / 2;
      const centerY = targetHeight / 2;
      
      const boundsCenterX = minX + width / 2;
      const boundsCenterY = minY + height / 2;
      
      let panX = centerX - boundsCenterX * scale;
      let panY = centerY - boundsCenterY * scale;

      // Apply manual overrides if present
      if (viewConfig) {
        const isConfigured = viewConfig.scale !== 1 || viewConfig.x !== 0 || viewConfig.y !== 0;
        
        if (isConfigured) {
          scale = viewConfig.scale;
          // Map the offset from editor (relative to view box) to PDF canvas
          // Editor: group.left = contentArea.x + viewConfig.x
          // PDF: panX = viewConfig.x - minX * scale
          panX = viewConfig.x - minX * scale;
          panY = viewConfig.y - minY * scale;
        }
      }
      
      canvas.setViewportTransform([scale, 0, 0, scale, panX, panY]);
    }
  }

  canvas.renderAll();
  
  // Convert to data URL with high resolution
  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 4, // Increased from 1.5 to 4 for high quality
  });
  
  canvas.dispose();
  return dataUrl;
}

// Main export function - creates a professional multi-view PDF
export async function exportToPDF(options: ExportOptions): Promise<void> {
  const { components, annotations, specification, branding, currentPreset, finalViewConfig, finalTextConfig } = options;
  
  // Create PDF in A4 landscape for better view layout
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = 297;
  const pageHeight = 210;

  // Always generate high-quality vector PDF instead of using canvas screenshot
  // This ensures consistent resolution, watermarks, and styling across browsers

  const margin = 12;
  const contentWidth = pageWidth - 2 * margin;
  const contentHeight = pageHeight - 2 * margin;

  // Helper to get text content and position (with overrides)
  const getTextProps = (id: string, defaultText: string, defaultX: number, defaultY: number, defaultSize: number) => {
    const override = finalTextConfig?.[id];
    if (override) {
      // Convert canvas coordinates (px) back to PDF coordinates (mm)
      // Canvas is 594x420 px (A4 landscape * 2)
      // PDF is 297x210 mm
      // So 1 mm = 2 px
      const scale = 0.5;
      
      return {
        text: override.text || defaultText,
        x: override.left * scale,
        y: override.top * scale,
        size: (override.scaleX || 1) * defaultSize, // Approximate font size scaling
        angle: override.angle || 0
      };
    }
    return { text: defaultText, x: defaultX, y: defaultY, size: defaultSize, angle: 0 };
  };

  // === WATERMARK (Background) ===
  // Draw this first so it appears behind everything else
  if (branding.watermarkText) {
    pdf.setTextColor(245, 245, 245); // Very light gray
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    
    const text = branding.watermarkText;
    const angle = 45;
    
    // Create a repeating pattern
    // We start negative and go beyond page dimensions to ensure coverage when rotated
    const stepX = 80; // Horizontal spacing
    const stepY = 80; // Vertical spacing
    
    for (let x = -100; x < pageWidth + 100; x += stepX) {
      for (let y = -100; y < pageHeight + 100; y += stepY) {
        // Offset every other row for a brick pattern look
        const xOffset = (y / stepY) % 2 === 0 ? 0 : stepX / 2;
        
        pdf.text(text, x + xOffset, y, { 
          angle: angle, 
          align: 'center',
          renderingMode: 'fill'
        });
      }
    }
  }
  
  // === HEADER ===
  let y = margin;
  
  // Company name
  const companyProps = getTextProps('header_companyName', branding.companyName, margin, y + 5, 18);
  pdf.setFontSize(companyProps.size);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 122, 201);
  pdf.text(companyProps.text, companyProps.x, companyProps.y, { angle: companyProps.angle });
  
  // Document title
  const titleProps = getTextProps('header_docTitle', 'Pallet Specification Drawing', margin, y + 12, 14);
  pdf.setFontSize(titleProps.size);
  pdf.setTextColor(60, 60, 60);
  pdf.text(titleProps.text, titleProps.x, titleProps.y, { angle: titleProps.angle });
  
  // Right side info
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  const templateProps = getTextProps('header_templateText', `Template: ${currentPreset.toUpperCase()}`, pageWidth - margin, y + 3, 9);
  pdf.text(templateProps.text, templateProps.x, templateProps.y, { align: 'right', angle: templateProps.angle });
  
  const dateProps = getTextProps('header_dateText', `Date: ${today}`, pageWidth - margin, y + 8, 9);
  pdf.text(dateProps.text, dateProps.x, dateProps.y, { align: 'right', angle: dateProps.angle });
  
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
  const specsTitleProps = getTextProps('specs_title', 'SPECIFICATIONS', margin + 3, y + 6, 10);
  pdf.setFontSize(specsTitleProps.size);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.text(specsTitleProps.text, specsTitleProps.x, specsTitleProps.y, { angle: specsTitleProps.angle });
  
  // Specs content
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(50, 50, 50);
  
  let specY = y + 14;
  const specLineHeight = 5;
  let specCounter = 0;
  
  // Helper for spec lines
  const addSpecLine = (label: string, isBold = false) => {
    const props = getTextProps(`spec_label_${specCounter++}`, label, margin + 3, specY, 8);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.text(props.text, props.x, props.y, { angle: props.angle });
    specY += specLineHeight;
  };
  
  // Dimensions section
  addSpecLine('Dimensions', true);
  addSpecLine(`L x W x H: ${specification.overallDimensions.length} x ${specification.overallDimensions.width} x ${specification.overallDimensions.height} mm`);
  
  specY += specLineHeight * 0.5;
  
  // Classification section
  addSpecLine('Classification', true);
  addSpecLine(`Type: ${specification.classification.type}`);
  addSpecLine(`Face: ${specification.classification.face}`);
  addSpecLine(`Entry: ${specification.classification.entry}`);
  
  specY += specLineHeight * 0.5;
  
  // Material section
  addSpecLine('Materials', true);
  addSpecLine(`Lumber: ${specification.materials.lumberId}`);
  addSpecLine(`Surface: ${specification.materials.surface}`);
  
  specY += specLineHeight * 0.5;
  
  // Load capacity section
  addSpecLine('Load Capacity', true);
  addSpecLine(`Static: ${specification.materials.staticLoadCapacity} kg`);
  addSpecLine(`Dynamic: ${specification.materials.dynamicLoadCapacity} kg`);
  
  specY += specLineHeight * 0.5;
  
  // Component count section
  addSpecLine('Components', true);
  VIEWS.forEach((view) => {
    const count = components[view].length;
    addSpecLine(`${VIEW_LABELS[view].label}: ${count}`);
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
    // Check for view config overrides
    const viewConfig = finalViewConfig?.[pos.view];
    
    // Render view to image
    const viewDataUrl = await renderViewToDataUrl(
      components[pos.view],
      annotations[pos.view] || [],
      viewWidth * CANVAS_SCALE,
      viewHeight * CANVAS_SCALE,
      viewConfig // Pass the config to the renderer
    );
    
    // View background
    // Transparent background to show watermark
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(pos.x, pos.y, viewWidth, viewHeight, 1, 1, 'S');
    
    // View title bar
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(pos.x, pos.y, viewWidth, 6, 1, 1, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(`${VIEW_LABELS[pos.view].label} (${VIEW_LABELS[pos.view].arrow})`, pos.x + 2, pos.y + 4.5);
    
    // Add the rendered view image
    // If we have a custom config, the image is already scaled/positioned correctly within the canvas
    // So we just draw it filling the view box (minus title bar)
    const imgY = pos.y + 7;
    const imgHeight = viewHeight - 8;
    const imgWidth = viewWidth - 2;
    
    // If we have manual config, we trust the renderViewToDataUrl to have handled the layout
    // If not, we do the aspect ratio fitting here (legacy behavior, but renderViewToDataUrl handles it now too)
    
    pdf.addImage(viewDataUrl, 'PNG', pos.x + 1, imgY, imgWidth, imgHeight);
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
