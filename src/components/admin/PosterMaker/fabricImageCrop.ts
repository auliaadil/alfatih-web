import { Canvas, FabricImage, FabricObject, Control, Point, util, controlsUtils } from 'fabric';

// Fabric.js v7 ships an official cropping-controls extension (fabric/extensions), but its
// package.json `exports` only expose the whole-barrel entry point, which also pulls in
// unrelated extensions (aligning guidelines, gradient updater, and a `westures` gesture
// integration that isn't installed here and breaks the production bundle). So the small,
// self-contained pieces we need are reproduced here from fabric's own
// extensions/cropping_controls/*.ts, using only the core `fabric` package's public API.

const { wrapWithFixedAnchor, wrapWithFireEvent, scaleCursorStyleHandler, changeObjectWidth, changeObjectHeight, getLocalPoint } = controlsUtils as any;

function renderCornerControl(
    this: Control,
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    styleOverride: any,
    fabricObject: any,
) {
    ctx.save();
    const { stroke, xSize, ySize, opName } = (this as any).commonRenderProps(ctx, left, top, fabricObject, styleOverride);
    const xSizeBy2 = xSize / 2;
    const ySizeBy2 = ySize / 2;
    ctx.rotate(util.degreesToRadians(this.angle));
    ctx.beginPath();
    ctx.moveTo(-ySizeBy2, 0);
    ctx.lineTo(-ySizeBy2, xSizeBy2);
    ctx.lineTo(ySizeBy2, xSizeBy2);
    ctx.lineTo(ySizeBy2, ySizeBy2);
    ctx.lineTo(xSizeBy2, ySizeBy2);
    ctx.lineTo(xSizeBy2, -ySizeBy2);
    ctx.lineTo(-ySizeBy2, -ySizeBy2);
    ctx.closePath();
    (ctx as any)[opName]();
    stroke && ctx.stroke();
    ctx.restore();
}

const changeImageWidth = (eventData: any, transform: any, x: number, y: number) => {
    const { target } = transform;
    const { width } = target;
    const image = target as FabricImage & { _element: { width: number } };
    const modified = changeObjectWidth(eventData, transform, x, y);
    const availableWidth = image._element.width - image.cropX;
    if (modified) {
        if (image.width > availableWidth) image.width = availableWidth;
        if (image.width < 1) image.width = 1;
    }
    return width !== image.width;
};
const changeCropWidth = wrapWithFireEvent('CROPPING', wrapWithFixedAnchor(changeImageWidth));

const changeImageHeight = (eventData: any, transform: any, x: number, y: number) => {
    const { target } = transform;
    const { height } = target;
    const image = target as FabricImage & { _element: { height: number } };
    const modified = changeObjectHeight(eventData, transform, x, y);
    const availableHeight = image._element.height - image.cropY;
    if (modified) {
        if (image.height > availableHeight) image.height = availableHeight;
        if (image.height < 1) image.height = 1;
    }
    return height !== image.height;
};
const changeCropHeight = wrapWithFireEvent('CROPPING', wrapWithFixedAnchor(changeImageHeight));

const changeImageCropX = (eventData: any, transform: any, x: number, y: number) => {
    const { target } = transform;
    const image = target as FabricImage;
    const { width, cropX } = image;
    const modified = changeObjectWidth(eventData, transform, x, y);
    let newCropX = cropX + width - image.width;
    image.width = width;
    if (modified) {
        if (newCropX < 0) newCropX = 0;
        image.cropX = newCropX;
        image.width += cropX - newCropX;
    }
    return newCropX !== cropX;
};
const changeCropX = wrapWithFireEvent('CROPPING', wrapWithFixedAnchor(changeImageCropX));

const changeImageCropY = (eventData: any, transform: any, x: number, y: number) => {
    const { target } = transform;
    const image = target as FabricImage;
    const { height, cropY } = image;
    const modified = changeObjectHeight(eventData, transform, x, y);
    let newCropY = cropY + height - image.height;
    image.height = height;
    if (modified) {
        if (newCropY < 0) newCropY = 0;
        image.cropY = newCropY;
        image.height += cropY - newCropY;
    }
    return newCropY !== cropY;
};
const changeCropY = wrapWithFireEvent('CROPPING', wrapWithFixedAnchor(changeImageCropY));

function cropPanMoveHandler({ transform }: { transform: any }) {
    const { target, original } = transform;
    const fabricImage = target as FabricImage;
    const p = new Point(
        target.left - original.left,
        target.top - original.top,
    ).transform(
        util.invertTransform(
            util.createRotateMatrix({ angle: fabricImage.getTotalAngle() }),
        ),
    );
    let cropX = original.cropX - p.x / fabricImage.scaleX;
    let cropY = original.cropY - p.y / fabricImage.scaleY;
    const { width, height } = fabricImage;
    const element = (fabricImage as any)._element as { width: number; height: number };
    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropX + width > element.width) cropX = element.width - width;
    if (cropY + height > element.height) cropY = element.height - height;
    fabricImage.cropX = cropX;
    fabricImage.cropY = cropY;
    fabricImage.left = original.left;
    fabricImage.top = original.top;
}

function ghostScalePositionHandler(this: Control, _dim: Point, finalMatrix: any, fabricObject: FabricImage) {
    const matrix = fabricObject.calcTransformMatrix();
    const vpt = fabricObject.getViewportTransform();
    const _finalMatrix = util.multiplyTransformMatrices(vpt, matrix);
    let x = 0;
    let y = 0;
    const element = fabricObject.getElement();
    if (this.x < 0) x = -fabricObject.width / 2 - fabricObject.cropX;
    else x = element.width - fabricObject.width / 2 - fabricObject.cropX;
    if (this.y < 0) y = -fabricObject.height / 2 - fabricObject.cropY;
    else y = element.height - fabricObject.height / 2 - fabricObject.cropY;
    return new Point(x, y).transform(_finalMatrix);
}

const calcScale = (currentPoint: Point, height: number, width: number) =>
    Math.min(Math.abs(currentPoint.x / width), Math.abs(currentPoint.y / height));

const scaleEquallyCropGenerator = (cx: number, cy: number) =>
    (eventData: any, transform: any, x: number, y: number) => {
        const target = transform.target as FabricImage;
        const { width: fullWidth, height: fullHeight } = target.getElement();
        const remainderX = fullWidth - target.width - target.cropX;
        const remainderY = fullHeight - target.height - target.cropY;
        const anchorOriginX = cx < 0 ? 1 + remainderX / target.width : -target.cropX / target.width;
        const anchorOriginY = cy < 0 ? 1 + remainderY / target.height : -target.cropY / target.height;
        const constraint = target.translateToOriginPoint(target.getCenterPoint(), anchorOriginX, anchorOriginY);
        const newPoint = getLocalPoint(transform, anchorOriginX, anchorOriginY, x, y);
        const scale = calcScale(newPoint, fullHeight, fullWidth);
        const scaleChangeX = scale / target.scaleX;
        const scaleChangeY = scale / target.scaleY;
        const scaledRemainderX = remainderX / scaleChangeX;
        const scaledRemainderY = remainderY / scaleChangeY;
        const newWidth = target.width / scaleChangeX;
        const newHeight = target.height / scaleChangeY;
        const newCropX = cx < 0 ? fullWidth - newWidth - scaledRemainderX : target.cropX / scaleChangeX;
        const newCropY = cy < 0 ? fullHeight - newHeight - scaledRemainderY : target.cropY / scaleChangeY;

        if (
            (cx < 0 ? scaledRemainderX : newCropX) + newWidth > fullWidth ||
            (cy < 0 ? scaledRemainderY : newCropY) + newHeight > fullHeight
        ) {
            return false;
        }

        target.scaleX = scale;
        target.scaleY = scale;
        target.width = newWidth;
        target.height = newHeight;
        target.cropX = newCropX;
        target.cropY = newCropY;
        const newAnchorOriginX = cx < 0 ? 1 + scaledRemainderX / newWidth : -newCropX / newWidth;
        const newAnchorOriginY = cy < 0 ? 1 + scaledRemainderY / newHeight : -newCropY / newHeight;
        target.setPositionByOrigin(constraint, newAnchorOriginX, newAnchorOriginY);
        return true;
    };

function renderGhostImage(this: FabricImage, { ctx }: { ctx: CanvasRenderingContext2D }) {
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha *= 0.5;
    ctx.drawImage(
        (this as any)._element,
        -this.width / 2 - this.cropX,
        -this.height / 2 - this.cropY,
    );
    ctx.globalAlpha = alpha;
}

const cropActionName = () => 'crop';

function createImageCroppingControls() {
    return {
        tls: new Control({ x: -0.5, y: -0.5, cursorStyleHandler: scaleCursorStyleHandler, positionHandler: ghostScalePositionHandler, actionHandler: scaleEquallyCropGenerator(-0.5, -0.5) }),
        brs: new Control({ x: 0.5, y: 0.5, cursorStyleHandler: scaleCursorStyleHandler, positionHandler: ghostScalePositionHandler, actionHandler: scaleEquallyCropGenerator(0.5, 0.5) }),
        trs: new Control({ x: 0.5, y: -0.5, cursorStyleHandler: scaleCursorStyleHandler, positionHandler: ghostScalePositionHandler, actionHandler: scaleEquallyCropGenerator(0.5, -0.5) }),
        bls: new Control({ x: -0.5, y: 0.5, cursorStyleHandler: scaleCursorStyleHandler, positionHandler: ghostScalePositionHandler, actionHandler: scaleEquallyCropGenerator(-0.5, 0.5) }),
        mlc: new Control({ x: -0.5, y: 0, sizeX: 4, sizeY: 20, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: changeCropX, getActionName: cropActionName }),
        mrc: new Control({ x: 0.5, y: 0, sizeX: 4, sizeY: 20, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: changeCropWidth, getActionName: cropActionName }),
        mbc: new Control({ x: 0, y: 0.5, sizeX: 20, sizeY: 4, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: changeCropHeight, getActionName: cropActionName }),
        mtc: new Control({ x: 0, y: -0.5, sizeX: 20, sizeY: 4, cursorStyleHandler: scaleCursorStyleHandler, actionHandler: changeCropY, getActionName: cropActionName }),
        tlc: new Control({
            angle: 0, x: -0.5, y: -0.5, sizeX: 20, sizeY: 4, render: renderCornerControl, cursorStyleHandler: scaleCursorStyleHandler,
            actionHandler: (...args: any[]) => {
                const cropX = (changeCropX as any)(...args);
                const cropY = (changeCropY as any)(...args);
                return cropX || cropY;
            },
            getActionName: cropActionName,
        }),
        trc: new Control({
            angle: 90, x: 0.5, y: -0.5, sizeX: 20, sizeY: 4, render: renderCornerControl, cursorStyleHandler: scaleCursorStyleHandler,
            actionHandler: (...args: any[]) => {
                const width = (changeCropWidth as any)(...args);
                const cropY = (changeCropY as any)(...args);
                return width || cropY;
            },
            getActionName: cropActionName,
        }),
        blc: new Control({
            angle: 270, x: -0.5, y: 0.5, sizeX: 20, sizeY: 4, render: renderCornerControl, cursorStyleHandler: scaleCursorStyleHandler,
            actionHandler: (...args: any[]) => {
                const height = (changeCropHeight as any)(...args);
                const cropX = (changeCropX as any)(...args);
                return height || cropX;
            },
            getActionName: cropActionName,
        }),
        brc: new Control({
            angle: 180, x: 0.5, y: 0.5, sizeX: 20, sizeY: 4, render: renderCornerControl, cursorStyleHandler: scaleCursorStyleHandler,
            actionHandler: (...args: any[]) => {
                const height = (changeCropHeight as any)(...args);
                const width = (changeCropWidth as any)(...args);
                return height || width;
            },
            getActionName: cropActionName,
        }),
    };
}

const CROP_ACTIVE = '__cropModeActive';
const ORIG_CONTROLS = '__cropOrigControls';
const ORIG_PADDING = '__cropOrigPadding';

type CropImage = FabricImage & {
    [CROP_ACTIVE]?: boolean;
    [ORIG_CONTROLS]?: Record<string, Control>;
    [ORIG_PADDING]?: number;
};

export function isInCropMode(obj: FabricObject | null | undefined): boolean {
    return !!obj && obj.type === 'image' && !!(obj as CropImage)[CROP_ACTIVE];
}

function enterCropMode(img: CropImage) {
    if (img[CROP_ACTIVE]) return;
    img[ORIG_CONTROLS] = img.controls;
    img[ORIG_PADDING] = img.padding;
    img.padding = 0;
    img.controls = createImageCroppingControls();
    img.on('moving', cropPanMoveHandler as any);
    img.on('before:render', renderGhostImage as any);
    img.setCoords();
    img[CROP_ACTIVE] = true;
    img.canvas?.requestRenderAll();
}

function exitCropMode(img: CropImage) {
    if (!img[CROP_ACTIVE]) return;
    img.padding = img[ORIG_PADDING] ?? 0;
    img.controls = img[ORIG_CONTROLS] ?? img.controls;
    img.off('moving', cropPanMoveHandler as any);
    img.off('before:render', renderGhostImage as any);
    img.setCoords();
    img[CROP_ACTIVE] = false;
    img.canvas?.requestRenderAll();
}

export function toggleCropMode(img: FabricImage): boolean {
    const wasActive = isInCropMode(img);
    if (wasActive) exitCropMode(img as CropImage);
    else enterCropMode(img as CropImage);
    return !wasActive;
}

/** Exits crop mode for whichever image on the canvas currently has it active, if any. Returns true if something was exited. */
export function exitActiveCropMode(canvas: Canvas): boolean {
    const cropImg = canvas.getObjects().find(isInCropMode) as CropImage | undefined;
    if (!cropImg) return false;
    exitCropMode(cropImg);
    return true;
}
