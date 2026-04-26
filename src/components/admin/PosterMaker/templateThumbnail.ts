import { StaticCanvas } from 'fabric';

const cache = new Map<string, string>();

// Sequential queue — one canvas at a time to avoid memory spikes
let queue = Promise.resolve();

export const generateTemplateThumbnail = (id: string, json: object): Promise<string> => {
    if (cache.has(id)) return Promise.resolve(cache.get(id)!);

    const task = queue.then(async (): Promise<string> => {
        // Re-check cache in case a parallel call already generated this
        if (cache.has(id)) return cache.get(id)!;

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
            await fabricCanvas.loadFromJSON(json);
            fabricCanvas.requestRenderAll();

            const dataUrl = fabricCanvas.toDataURL({ format: 'jpeg', multiplier: 0.15, quality: 0.85 });
            cache.set(id, dataUrl);
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
