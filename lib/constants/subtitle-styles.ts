// Available font options for subtitles
export const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

// Centralized subtitle styling configuration using system theme
export const SUBTITLE_STYLES = {
  // Basic styles
  fontSize: 12,
  fontFamily: 'Arial, sans-serif', // Default font, will be customizable
  backgroundColor: 'oklch(from var(--background) l c h / 0.9)', // Semi-transparent background
  textColor: 'var(--foreground)', // System foreground color
  borderColor: 'var(--border)', // System border color
  padding: '2px 2px',
  borderRadius: 'var(--radius)', // System border radius
  opacity: 0.95,
  
  // Karaoke highlight styles using system primary color
  highlightColor: 'var(--primary)', // System primary color
  highlightBackground: 'oklch(from var(--primary) l c h / 0.2)', // Primary with transparency
  highlightTextShadow: '0 1px 2px oklch(from var(--background) l c h / 0.8)',
  
  // ASS format colors (BGR format) - converted from system colors
  ass: {
    primaryColour: '&Hffffff',      // white (will be converted properly)
    outlineColour: '&H80000000',    // black with transparency
    backColour: '&H80000000',       // black with transparency  
    highlightColour: '&H00ffff',    // yellow (BGR format)
  }
};

// Generate VTT CSS with custom font
export function generateVttCss(customFont?: string): string {
  const fontFamily = customFont ? `${customFont}, sans-serif` : SUBTITLE_STYLES.fontFamily;
  return `STYLE
::cue {
  background-color: ${SUBTITLE_STYLES.backgroundColor};
  color: ${SUBTITLE_STYLES.textColor};
  font-family: ${fontFamily};
  font-size: ${SUBTITLE_STYLES.fontSize}px;
  text-align: center;
  line-height: 1;
  padding: ${SUBTITLE_STYLES.padding};
  border-radius: ${SUBTITLE_STYLES.borderRadius};
  opacity: ${SUBTITLE_STYLES.opacity};
  border: 1px solid ${SUBTITLE_STYLES.borderColor};
}

::cue(.highlight) {
  color: ${SUBTITLE_STYLES.highlightColor};
  font-weight: bold;
  text-shadow: ${SUBTITLE_STYLES.highlightTextShadow};
  background-color: ${SUBTITLE_STYLES.highlightBackground};
}

`;
}

// Generate ASS Style line with custom font
export function generateAssStyle(customFont?: string): string {
  const s = SUBTITLE_STYLES;
  const fontName = customFont || 'Arial';
  return `Style: Default,${fontName},${s.fontSize},${s.ass.primaryColour},${s.ass.primaryColour},${s.ass.outlineColour},${s.ass.backColour},1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1`;
}

// Generate FFmpeg force_style for SRT with custom font
export function generateSrtForceStyle(customFont?: string): string {
  const s = SUBTITLE_STYLES;
  const fontName = customFont || 'Arial';
  return `FontName=${fontName},FontSize=${s.fontSize},PrimaryColour=${s.ass.primaryColour},BackColour=${s.ass.backColour},BorderStyle=3,Outline=2`;
}