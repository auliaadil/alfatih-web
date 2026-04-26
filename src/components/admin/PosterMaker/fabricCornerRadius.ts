import { FabricObject, Rect, FabricImage } from 'fabric';

export function getCornerRadius(obj: FabricObject): number {
    if (obj instanceof Rect) {
        return (obj.rx ?? 0);
    }
    if (obj instanceof FabricImage) {
        const cp = obj.clipPath as Rect | undefined;
        if (cp instanceof Rect) return cp.rx ?? 0;
    }
    return 0;
}

export function setCornerRadius(
    obj: FabricObject,
    radius: number,
    canvas: { requestRenderAll: () => void },
) {
    if (obj instanceof Rect) {
        obj.set({ rx: radius, ry: radius });
        canvas.requestRenderAll();
        return;
    }

    if (obj instanceof FabricImage) {
        const w = obj.width ?? 0;
        const h = obj.height ?? 0;

        const clip = new Rect({
            width: w,
            height: h,
            rx: radius,
            ry: radius,
            originX: 'center',
            originY: 'center',
            left: 0,
            top: 0,
        });

        obj.clipPath = clip;
        obj.setCoords();
        canvas.requestRenderAll();
    }
}
