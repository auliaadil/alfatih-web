import { Canvas, Rect } from 'fabric';

const canvas = new Canvas(null, { width: 1080, height: 1440 });
const rect = new Rect({ left: 100, top: 100, width: 200, height: 200 });
canvas.add(rect);

const json = canvas.toJSON();
console.log("Original rect JSON:", json.objects[0]);

const canvas2 = new Canvas(null, { width: 1080, height: 1440 });
canvas2.loadFromJSON({
    version: '6.0.0',
    objects: [{ type: 'rect', left: 100, top: 100, width: 200, height: 200 }]
}).then(() => {
    console.log("Parsed rect from basic JSON:", canvas2.getObjects()[0]);
});

