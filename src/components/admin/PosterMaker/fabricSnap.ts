import { Canvas, FabricObject, TPointerEventInfo } from 'fabric';

const SNAP_THRESHOLD = 5;

function getObjectBounds(obj: FabricObject) {
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();
    return {
        left, top,
        right: left + w,
        bottom: top + h,
        centerX: left + w / 2,
        centerY: top + h / 2,
    };
}

export function installSceneSnap(canvas: Canvas) {
    const onMoving = (e: TPointerEventInfo) => {
        const moving = e.target as FabricObject | undefined;
        if (!moving) return;

        const others = canvas.getObjects().filter(o => o !== moving);
        if (others.length === 0) return;

        const mb = getObjectBounds(moving);

        let deltaX = 0;
        let deltaY = 0;

        const snapX = { left: mb.left, centerX: mb.centerX, right: mb.right };
        const snapY = { top: mb.top, centerY: mb.centerY, bottom: mb.bottom };

        for (const other of others) {
            const ob = getObjectBounds(other);

            for (const val of Object.values(snapX)) {
                for (const tx of [ob.left, ob.centerX, ob.right]) {
                    const diff = tx - val;
                    if (Math.abs(diff) < SNAP_THRESHOLD && (deltaX === 0 || Math.abs(diff) < Math.abs(deltaX))) {
                        deltaX = diff;
                    }
                }
            }

            for (const val of Object.values(snapY)) {
                for (const ty of [ob.top, ob.centerY, ob.bottom]) {
                    const diff = ty - val;
                    if (Math.abs(diff) < SNAP_THRESHOLD && (deltaY === 0 || Math.abs(diff) < Math.abs(deltaY))) {
                        deltaY = diff;
                    }
                }
            }
        }

        if (deltaX !== 0 || deltaY !== 0) {
            moving.set({
                left: (moving.left ?? 0) + deltaX,
                top: (moving.top ?? 0) + deltaY,
            });
        }
    };

    canvas.on('object:moving', onMoving);
}
