// src/components/admin/PosterMaker/LivePreview.tsx
import React, { useRef, useEffect, useState } from 'react';
import { PosterTemplate, FieldValues, AspectRatio } from './types';

const DIMS: Record<AspectRatio, { w: number; h: number }> = {
  post:  { w: 1080, h: 1350 },
  story: { w: 1080, h: 1920 },
};

interface Props {
  template: PosterTemplate;
  fieldValues: FieldValues;
}

export const LivePreview: React.FC<Props> = ({ template, fieldValues }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const { w, h } = DIMS[template.aspectRatio];

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / w);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [w]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: h * scale, overflow: 'hidden', borderRadius: 12 }}>
      <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <template.Component {...fieldValues} />
      </div>
    </div>
  );
};
