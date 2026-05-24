// src/components/admin/PosterMaker/exportPoster.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { toPng } from 'html-to-image';
import { PosterTemplate, FieldValues, AspectRatio } from './types';

const DIMS: Record<AspectRatio, { w: number; h: number }> = {
  post:  { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

export const exportPosterPng = async (
  template: PosterTemplate,
  fieldValues: FieldValues,
  pixelRatio: 2 | 4 = 2,
): Promise<void> => {
  const { w, h } = DIMS[template.aspectRatio];

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-${w * 2}px;top:0;width:${w}px;height:${h}px;overflow:hidden;`;
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(template.Component, fieldValues));

  await document.fonts.ready;
  // Let React finish painting
  await new Promise<void>(r => setTimeout(r, 150));

  try {
    const dataUrl = await toPng(container, { pixelRatio, width: w, height: h });
    const a = document.createElement('a');
    a.download = `alfatih-poster-${template.aspectRatio}-${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};

export const generateThumbnailDataUrl = async (
  template: PosterTemplate,
  fieldValues: FieldValues,
): Promise<string> => {
  const { w, h } = DIMS[template.aspectRatio];

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-${w * 2}px;top:0;width:${w}px;height:${h}px;overflow:hidden;`;
  document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(template.Component, fieldValues));

  await document.fonts.ready;
  await new Promise<void>(r => setTimeout(r, 150));

  try {
    return await toPng(container, { pixelRatio: 0.2, width: w, height: h });
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
};
