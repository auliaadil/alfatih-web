import { FabricObject, Shadow } from 'fabric';

export interface ShadowState {
    enabled: boolean;
    blur: number;
    offsetX: number;
    offsetY: number;
    color: string;
    opacity: number;
}

export const DEFAULT_SHADOW: ShadowState = {
    enabled: false,
    blur: 10,
    offsetX: 5,
    offsetY: 5,
    color: '#000000',
    opacity: 50,
};

export function readShadowState(obj: FabricObject): ShadowState {
    const s = obj.shadow as Shadow | null | undefined;
    if (!s) return { ...DEFAULT_SHADOW };

    const colorStr = typeof s.color === 'string' ? s.color : '#000000';
    let color = '#000000';
    let opacity = 50;

    const rgba = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgba) {
        const r = parseInt(rgba[1]);
        const g = parseInt(rgba[2]);
        const b = parseInt(rgba[3]);
        opacity = rgba[4] !== undefined ? Math.round(parseFloat(rgba[4]) * 100) : 100;
        color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } else if (colorStr.startsWith('#')) {
        color = colorStr.substring(0, 7);
    }

    return {
        enabled: true,
        blur: s.blur ?? 10,
        offsetX: s.offsetX ?? 5,
        offsetY: s.offsetY ?? 5,
        color,
        opacity,
    };
}

export function applyShadow(obj: FabricObject, state: ShadowState, canvas: { requestRenderAll: () => void }) {
    if (!state.enabled) {
        obj.set({ shadow: null });
    } else {
        const hex = state.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = state.opacity / 100;
        obj.set({
            shadow: new Shadow({
                color: `rgba(${r},${g},${b},${a})`,
                blur: state.blur,
                offsetX: state.offsetX,
                offsetY: state.offsetY,
            }),
        });
    }
    canvas.requestRenderAll();
}
