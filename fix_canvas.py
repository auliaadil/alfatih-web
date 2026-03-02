import re

with open("src/components/admin/PosterMaker/PosterCanvas.tsx", "r") as f:
    content = f.read()

content = content.replace('<div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">\n                            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">', '<div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">')
content = content.replace('<div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">\n                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">', '<div className="relative z-10 flex-1 flex flex-col items-center justify-center p-16 text-center">')

end_pattern = r'(\s*</div>\s*<div className="mt-6 flex items-center justify-end w-full">[\s\S]*?</button>\s*</div>\s*</div>\s*);\s*};\s*export default PosterCanvas;\s*)'
replacement = r'''
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
'''

import sys
new_content = re.sub(end_pattern, replacement, content)
if new_content == content:
    print("Regex didn't match!")
    # Just fix manually from bottom
    idx = content.rfind('<div className="mt-6 flex')
    if idx != -1:
        top_part = content[:idx]
        new_content = top_part + replacement
    
with open("src/components/admin/PosterMaker/PosterCanvas.tsx", "w") as f:
    f.write(new_content)

print("Fixed!")
