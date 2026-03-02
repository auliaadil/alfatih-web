import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
import { PosterTemplate } from './TemplateSelector';

interface PosterCanvasProps {
    template: PosterTemplate | null;
}

const PosterCanvas: React.FC<PosterCanvasProps> = ({ template }) => {
    const posterRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Please select a template to preview.
            </div>
        );
    }

    const isPost = template.aspectRatio === 'post';
    const width = 1080;
    const height = isPost ? 1080 : 1920;

    const handleDownload = async () => {
        if (!posterRef.current) return;
        setIsExporting(true);
        try {
            // html-to-image to generate the exact dimensions inside the wrapper
            const dataUrl = await toPng(posterRef.current, {
                quality: 1.0,
                pixelRatio: 1, // High resolution
            });
            const link = document.createElement('a');
            link.download = `alfatih-poster-${template.id}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to generate poster', error);
            alert('Failed to generate poster. See console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full h-full">

            {/* Canvas Wrapper - Scaled down for UI preview, but maintains exact pixel dimensions internally */}
            <div className="flex-1 w-full flex items-center justify-center overflow-auto py-8 bg-gray-100 rounded-lg inset-shadow-sm border border-gray-200">
                {/* 
                  We use a fixed scale container. 
                  For a 1080x1080 post, `w-[1080px] h-[1080px]`. 
                  We scale it down via CSS transform so it fits on screen nicely.
                */}
                <div
                    className="origin-top transition-all shadow-xl bg-white relative overflow-hidden flex-shrink-0"
                    style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: `scale(${isPost ? 0.45 : 0.3})`, // Scale down preview
                        transformOrigin: 'center center',
                    }}
                >
                    {/* The Actual Poster DOM */}
                    <div ref={posterRef} className="w-full h-full bg-white relative flex flex-col">

                        {/* Placeholder Content for the Template - We'll make this dynamic later */}
                        <div className="absolute inset-0 bg-primary opacity-10" />

                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">
                            <h1 className="text-7xl font-bold tracking-tight text-primary mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                                PROMO UMRAH
                            </h1>
                            <p className="text-4xl text-gray-800 leading-relaxed font-medium">
                                {template.name}
                            </p>
                        </div>

                        {/* Footer branding */}
                        <div className="relative z-10 bg-accent w-full h-48 flex items-center justify-between px-16">
                            <div className="text-white text-3xl font-medium">www.alfatihduniawisata.com</div>
                            <div className="text-white text-3xl font-medium">@alfatihduniawisata</div>
                        </div>

                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end w-full">
                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download High-Res PNG
                </button>
            </div>
        </div>
    );
};

export default PosterCanvas;
