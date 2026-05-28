export const hexToRgba = (hex: string, alpha: number) => {
  if (hex === '#ffffff') return '#ffffff';
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  if (hex.length === 4) {
    hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return { r, g, b };
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const rgbToHsl = (r: number, g: number, b: number): { h: number, s: number, l: number } => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

export const getReadableTextColor = (hex: string): string => {
  if (!hex || hex === '#ffffff' || hex === '#000000') return hex;
  
  const { r, g, b } = hexToRgb(hex);
  const luminance = getLuminance(r, g, b);
  
  // If the color is light (luminance > 0.35 is a good threshold for text on light backgrounds)
  if (luminance > 0.35) {
    const { h, s, l } = rgbToHsl(r, g, b);
    // Darken the lightness to ensure readability (max 32% lightness is usually readable on white)
    const newL = Math.min(l, 32); 
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
  
  return hex;
};
