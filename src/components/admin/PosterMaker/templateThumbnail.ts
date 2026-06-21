import { StaticCanvas } from 'fabric';

const cache = new Map<string, string>();

// Sequential queue — one canvas at a time to avoid memory spikes
let queue = Promise.resolve();

// Fast djb2 hash so cache is invalidated when template JSON changes
const jsonHash = (json: object): string => {
    const s = JSON.stringify(json);
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = (((h << 5) + h) ^ s.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
};

export const generateTemplateThumbnail = (id: string, json: object): Promise<string> => {
    const cacheKey = `${id}-${jsonHash(json)}`;
    if (cache.has(cacheKey)) return Promise.resolve(cache.get(cacheKey)!);

    const task = queue.then(async (): Promise<string> => {
        // Re-check cache in case a parallel call already generated this
        if (cache.has(cacheKey)) return cache.get(cacheKey)!;

        const { width = 1080, height = 1350 } = json as Record<string, number>;

        // Attach to DOM: Fabric v7's StaticCanvasDOMManager requires a mounted element
        const container = document.createElement('div');
        container.style.cssText =
            'position:fixed;top:-99999px;left:-99999px;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;';
        const canvasEl = document.createElement('canvas');
        container.appendChild(canvasEl);
        document.body.appendChild(container);

        const fabricCanvas = new StaticCanvas(canvasEl, {
            width,
            height,
            backgroundColor: '#ffffff',
            renderOnAddRemove: false,
        });

        try {
            // Wait for fonts so 'Outfit'/'Inter' render correctly
            await document.fonts.ready;

            // Inject crossOrigin on image objects so the canvas stays untainted
            const jsonCopy = JSON.parse(JSON.stringify(json)) as Record<string, unknown>;
            if (Array.isArray(jsonCopy.objects)) {
                (jsonCopy.objects as Record<string, unknown>[]).forEach(obj => {
                    if (obj.type === 'image') obj.crossOrigin = 'anonymous';
                });
            }

            try {
                await fabricCanvas.loadFromJSON(jsonCopy);
            } catch (err) {
                console.warn('loadFromJSON warning during thumbnail generation:', err);
            }
            fabricCanvas.requestRenderAll();

            let dataUrl: string;
            try {
                dataUrl = fabricCanvas.toDataURL({ format: 'jpeg', multiplier: 0.15, quality: 0.85 });
            } catch {
                return '';
            }
            cache.set(cacheKey, dataUrl);
            return dataUrl;
        } finally {
            fabricCanvas.dispose();
            if (document.body.contains(container)) document.body.removeChild(container);
        }
    });

    // Advance the queue even if this task errors, so subsequent thumbnails still generate
    queue = task.then(
        () => {},
        () => {},
    );

    return task;
};
