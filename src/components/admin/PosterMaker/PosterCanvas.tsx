import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2 } from 'lucide-react';
import { PosterAsset } from './AssetLibrary';
import { TemplateConfig } from '../../../types/poster';

// Blocks
import PosterHeader from './blocks/PosterHeader';
import PosterFooter from './blocks/PosterFooter';
import PosterImageBlock from './blocks/PosterImageBlock';
import PosterDetails from './blocks/PosterDetails';
import PosterPromo from './blocks/PosterPromo';

interface PosterCanvasProps {
    template: TemplateConfig | null;
    generatedData?: any;
    canvasAssets?: PosterAsset[];
    packageData?: any;
}

const PosterCanvas: React.FC<PosterCanvasProps> = ({ template, generatedData, canvasAssets = [], packageData }) => {
    const posterRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!template) {
        return (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
                Please select a template to preview.
            </div>
        );
    }

    const { options, layoutType, aspectRatio } = template;
    const isPost = aspectRatio === 'post';
    const width = 1080;
    const height = isPost ? 1440 : 1920;

    // Generic Background Styling
    const bgClass = options.theme === 'dark' ? 'bg-slate-900' :
        options.theme === 'brand' ? 'bg-primary' : 'bg-white';

    const handleDownload = async () => {
        if (!posterRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(posterRef.current, {
                quality: 1.0,
                pixelRatio: 1,
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

    // --- ENGINE RENDERING LOGIC ---
    const renderLayout = () => {
        switch (layoutType) {
            case 'hero-overlay':
                return (
                    <div className="w-full h-full relative flex flex-col p-12 lg:p-16">
                        <PosterImageBlock packageData={packageData} options={options} className="absolute inset-0 z-0" />

                        <div className="relative z-10 flex flex-col h-full w-full">
                            {options.detailsPosition === 'top' && (
                                <div className="mb-auto w-full"><PosterDetails packageData={packageData} options={options} /></div>
                            )}

                            <div className={options.detailsPosition === 'center' ? 'm-auto' : 'mt-auto mb-10'}>
                                <PosterPromo packageData={packageData} generatedData={generatedData} options={options} />
                            </div>

                            {options.detailsPosition === 'bottom' && (
                                <div className="mb-8 w-full"><PosterDetails packageData={packageData} options={options} /></div>
                            )}

                            <PosterFooter options={options} />
                        </div>
                    </div>
                );

            case 'split-half':
            case 'split-third':
                const imgHeight = layoutType === 'split-half' ? 'h-1/2' : 'h-1/3';
                const contentHeight = layoutType === 'split-half' ? 'h-1/2' : 'h-2/3';

                return (
                    <div className="w-full h-full flex flex-col">
                        <PosterImageBlock packageData={packageData} options={{ ...options, imageStyle: 'cover' }} className={`w-full ${imgHeight}`} />
                        <div className={`w-full ${contentHeight} p-12 lg:p-16 flex flex-col`}>
                            <PosterHeader options={options} />

                            <div className="flex-1 flex flex-col justify-center">
                                <PosterPromo packageData={packageData} generatedData={generatedData} options={options} />
                                <div className="mt-8"><PosterDetails packageData={packageData} options={options} /></div>
                            </div>

                            <PosterFooter options={options} />
                        </div>
                    </div>
                );

            case 'grid-gallery':
                return (
                    <div className="w-full h-full flex flex-col p-12 lg:p-16">
                        <PosterHeader options={options} />

                        <div className="flex-1 flex flex-col justify-between py-8">
                            <div>
                                <PosterPromo packageData={packageData} generatedData={generatedData} options={options} />
                                <div className="mt-8"><PosterDetails packageData={packageData} options={options} /></div>
                            </div>

                            <div className="h-[500px] w-full mt-8">
                                <PosterImageBlock packageData={packageData} options={options} className="w-full h-full" />
                            </div>
                        </div>

                        <PosterFooter options={options} />
                    </div>
                );

            case 'minimal-clean':
                return (
                    <div className="w-full h-full flex flex-col p-12 lg:p-16">
                        <PosterHeader options={options} />

                        <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <PosterPromo packageData={packageData} generatedData={generatedData} options={options} />
                        </div>

                        <PosterFooter options={options} />
                    </div>
                );

            default:
                return <div className="p-16 text-white font-bold text-4xl">Layout {layoutType} not implemented yet</div>;
        }
    };

    return (
        <div className="flex flex-col items-center w-full h-full">
            {/* Canvas Wrapper - Scaled down for UI preview */}
            <div className="flex-1 w-full flex items-center justify-center overflow-auto py-8 bg-gray-100 rounded-lg inset-shadow-sm border border-gray-200" style={{ minHeight: 600 }}>
                <div
                    className="origin-top transition-all shadow-2xl relative overflow-hidden flex-shrink-0"
                    style={{
                        width: `${width}px`,
                        height: `${height}px`,
                        transform: `scale(${isPost ? 0.35 : 0.28})`,
                        marginBottom: isPost ? '-900px' : '-1350px',
                    }}
                >
                    {/* The Actual Poster DOM */}
                    <div ref={posterRef} className={`w-full h-full relative overflow-hidden ${bgClass}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {renderLayout()}

                        {/* Rendering Dragged Assets (Static for Export right now) */}
                        {canvasAssets.map((asset, index) => (
                            <img
                                key={`${asset.id}-${index}`}
                                src={asset.url}
                                alt={asset.name}
                                className="absolute z-20 top-12 right-12 opacity-90 drop-shadow-xl"
                                style={{
                                    maxWidth: asset.type === 'logo' ? '250px' : '400px',
                                    maxHeight: asset.type === 'logo' ? '150px' : '400px',
                                    ...(asset.type === 'background' ? {
                                        top: 0, right: 0, left: 0, bottom: 0,
                                        maxWidth: '100%', maxHeight: '100%',
                                        objectFit: 'cover',
                                        zIndex: 1,
                                        mixBlendMode: 'multiply',
                                        opacity: 0.1
                                    } : {})
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end w-full">
                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                    {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Download High-Res PNG
                </button>
            </div>
        </div>
    );
};

export default PosterCanvas;
