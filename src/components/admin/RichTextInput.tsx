import React, { useRef, useEffect, useState, useCallback } from 'react';
import { List, ListOrdered } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatInline(line: string): string {
    // Escape raw HTML then apply inline markdown → HTML
    return line
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<u>$1</u>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// ── Markdown → HTML (for loading into the editor) ────────────────────────────

function markdownToHtml(md: string): string {
    if (!md) return '';

    const lines = md.split('\n');
    const parts: string[] = [];
    let ulItems: string[] = [];
    let olItems: string[] = [];

    const flushUl = () => {
        if (ulItems.length) {
            parts.push('<ul>' + ulItems.map(i => `<li>${i}</li>`).join('') + '</ul>');
            ulItems = [];
        }
    };
    const flushOl = () => {
        if (olItems.length) {
            parts.push('<ol>' + olItems.map(i => `<li>${i}</li>`).join('') + '</ol>');
            olItems = [];
        }
    };

    for (const line of lines) {
        const bullet  = line.match(/^- (.*)$/);
        const ordered = line.match(/^\d+\. (.*)$/);
        if (bullet) {
            flushOl();
            ulItems.push(formatInline(bullet[1]));
        } else if (ordered) {
            flushUl();
            olItems.push(formatInline(ordered[1]));
        } else {
            flushUl();
            flushOl();
            parts.push(formatInline(line));
        }
    }
    flushUl();
    flushOl();

    // Join with <br> between paragraphs but NOT adjacent to block-level list tags
    const isBlock = (s: string) => /^<[uo]l/.test(s) || /^<\/[uo]l>/.test(s);
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
        if (i > 0 && !isBlock(parts[i]) && !isBlock(parts[i - 1])) result.push('<br>');
        result.push(parts[i]);
    }
    return result.join('');
}

// ── HTML → Markdown (for saving from the editor) ─────────────────────────────

function liInnerToMarkdown(inner: string): string {
    return inner
        .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
        .replace(/<b>([\s\S]*?)<\/b>/gi,           '**$1**')
        .replace(/<u>([\s\S]*?)<\/u>/gi,            '__$1__')
        .replace(/<em>([\s\S]*?)<\/em>/gi,          '*$1*')
        .replace(/<i>([\s\S]*?)<\/i>/gi,            '*$1*')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
        .trim();
}

function htmlToMarkdown(html: string): string {
    let t = html;

    // Unordered lists → "- item"
    t = t.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
        const items: string[] = [];
        const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let m: RegExpExecArray | null;
        while ((m = re.exec(content)) !== null) items.push(`- ${liInnerToMarkdown(m[1])}`);
        return items.join('\n');
    });

    // Ordered lists → "1. item"
    t = t.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
        const items: string[] = [];
        const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let m: RegExpExecArray | null;
        let idx = 1;
        while ((m = re.exec(content)) !== null) { items.push(`${idx}. ${liInnerToMarkdown(m[1])}`); idx++; }
        return items.join('\n');
    });

    // Normalise Chrome's div-per-line layout into newlines
    t = t
        .replace(/<div><br\s*\/?><\/div>/gi, '\n')
        .replace(/<\/div><div>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n');

    // Inline formatting
    t = t
        .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
        .replace(/<b>([\s\S]*?)<\/b>/gi,           '**$1**')
        .replace(/<u>([\s\S]*?)<\/u>/gi,            '__$1__')
        .replace(/<em>([\s\S]*?)<\/em>/gi,          '*$1*')
        .replace(/<i>([\s\S]*?)<\/i>/gi,            '*$1*');

    // Strip remaining tags and decode entities
    t = t.replace(/<[^>]+>/g, '');
    t = t
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');

    return t.trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

const RichTextInput: React.FC<Props> = ({
    value,
    onChange,
    placeholder,
    multiline = false,
    rows = 4,
    className = '',
    disabled,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const skipSync  = useRef(false);
    const [empty, setEmpty] = useState(!value);

    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (skipSync.current) { skipSync.current = false; return; }
        const html = markdownToHtml(value);
        if (el.innerHTML !== html) el.innerHTML = html;
        setEmpty(!value);
    }, [value]);

    const handleInput = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        skipSync.current = true;
        const md = htmlToMarkdown(el.innerHTML);
        setEmpty(!md);
        onChange(md);
    }, [onChange]);

    const exec = (cmd: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'b') { e.preventDefault(); exec('bold'); }
            if (e.key === 'i') { e.preventDefault(); exec('italic'); }
            if (e.key === 'u') { e.preventDefault(); exec('underline'); }
        }
        if (!multiline && e.key === 'Enter') e.preventDefault();
    };

    const minH = multiline ? `${rows * 1.625}rem` : '2.375rem';

    const ToolBtn = ({
        onClick, title, children, style,
    }: { onClick: () => void; title: string; children: React.ReactNode; style?: React.CSSProperties }) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            style={style}
            className="w-7 h-7 flex items-center justify-center rounded text-sm text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-40 select-none"
        >
            {children}
        </button>
    );

    return (
        <div className={`border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-0.5 px-2 py-1 bg-gray-50 border-b border-gray-100">
                {/* Inline formatting */}
                <ToolBtn onClick={() => exec('bold')}      title="Bold (Ctrl+B)"      style={{ fontWeight: 700 }}>B</ToolBtn>
                <ToolBtn onClick={() => exec('italic')}    title="Italic (Ctrl+I)"    style={{ fontStyle: 'italic' }}>I</ToolBtn>
                <ToolBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)" style={{ textDecoration: 'underline' }}>U</ToolBtn>

                {/* Divider */}
                <span className="w-px h-4 bg-gray-200 mx-1" />

                {/* List formatting */}
                <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet List">
                    <List className="w-3.5 h-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered List">
                    <ListOrdered className="w-3.5 h-3.5" />
                </ToolBtn>

                <span className="ml-auto text-[10px] text-gray-300 pr-1 hidden sm:block">Ctrl+B / I / U</span>
            </div>

            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    style={{ minHeight: minH }}
                    className={`px-3.5 py-2.5 text-sm bg-white focus:outline-none leading-relaxed
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
                        [&_li]:my-0.5 ${className}`}
                />
                {empty && placeholder && (
                    <span className="absolute top-0 left-0 px-3.5 py-2.5 text-sm text-gray-300 pointer-events-none select-none">
                        {placeholder}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RichTextInput;
