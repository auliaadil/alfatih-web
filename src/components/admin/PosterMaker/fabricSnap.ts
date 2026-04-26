import { Canvas, FabricObject, Point, TPointerEventInfo } from 'fabric';

const SNAP_THRESHOLD = 5;
const GUIDE_COLOR = 'magenta';
const GUIDE_WIDTH = 1;

interface SnapLine {
    type: 'v' | 'h';
    pos: number;
}

function getObjectBounds(obj: FabricObject) {
    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const w = obj.getScaledWidth();
    const h = obj.getScaledHeight();
    return {
        left,
        top,
        right: left + w,
        bottom: top + h,
        centerX: left + w / 2,
        centerY: top + h / 2,
        width: w,
        height: h,
    };
}

function drawGuides(canvas: Canvas, lines: SnapLine[]) {
    const ctx = canvas.getTopContext();
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = GUIDE_COLOR;
    ctx.lineWidth = GUIDE_WIDTH / canvas.getZoom();
    ctx.setLineDash([4, 4]);

    for (const line of lines) {
        ctx.beginPath();
        if (line.type === 'v') {
            ctx.moveTo(line.pos, 0);
            ctx.lineTo(line.pos, canvas.height!);
        } else {
            ctx.moveTo(0, line.pos);
            ctx.lineTo(canvas.width!, line.pos);
        }
        ctx.stroke();
    }

    ctx.restore();
}

export function installSceneSnap(canvas: Canvas) {
    let activeGuides: SnapLine[] = [];

    const onMoving = (e: TPointerEventInfo) => {
        const moving = e.target as FabricObject | undefined;
        if (!moving) return;

        const others = canvas.getObjects().filter(o => o !== moving);
        if (others.length === 0) return;

        const mb = getObjectBounds(moving);
        const guides: SnapLine[] = [];

        let deltaX = 0;
        let deltaY = 0;

        const snapPoints = {
            left: mb.left,
            centerX: mb.centerX,
            right: mb.right,
        };

        const snapPointsY = {
            top: mb.top,
            centerY: mb.centerY,
            bottom: mb.bottom,
        };

        for (const other of others) {
            const ob = getObjectBounds(other);

            const targetXs = [ob.left, ob.centerX, ob.right];
            const targetYs = [ob.top, ob.centerY, ob.bottom];

            for (const [key, val] of Object.entries(snapPoints)) {
                for (const tx of targetXs) {
                    if (Math.abs(val - tx) < SNAP_THRESHOLD) {
                        const diff = tx - val;
                        if (Math.abs(diff) < Math.abs(deltaX) || deltaX === 0) {
                            deltaX = diff;
                        }
                        guides.push({ type: 'v', pos: tx });
                    }
                }
            }

            for (const [key, val] of Object.entries(snapPointsY)) {
                for (const ty of targetYs) {
                    if (Math.abs(val - ty) < SNAP_THRESHOLD) {
                        const diff = ty - val;
                        if (Math.abs(diff) < Math.abs(deltaY) || deltaY === 0) {
                            deltaY = diff;
                        }
                        guides.push({ type: 'h', pos: ty });
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

        activeGuides = guides;
        canvas.requestRenderAll();

        if (guides.length > 0) {
            drawGuides(canvas, guides);
        }
    };

    const clearGuides = () => {
        if (activeGuides.length > 0) {
            activeGuides = [];
            canvas.requestRenderAll();
        }
    };

    canvas.on('object:moving', onMoving);
    canvas.on('object:modified', clearGuides);
    canvas.on('mouse:up', clearGuides);
}
