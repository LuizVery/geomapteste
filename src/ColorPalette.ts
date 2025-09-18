// src/ColorPalette.ts

// This is a simple color palette that assigns a color to each unique value.
class ColorPalette {
  private colors: string[];
  private colorMap: Map<any, string>;

  constructor(values: any[]) {
    this.colors = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
    ];
    this.colorMap = new Map();
    const uniqueValues = [...new Set(values)];
    uniqueValues.forEach((value, index) => {
      this.colorMap.set(value, this.colors[index % this.colors.length]);
    });
  }

  getColor(value: any): string {
    return this.colorMap.get(value) || '#000000';
  }
}

export default ColorPalette;
