import React from 'react';

const INLINE_RE = /(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)/g;

function parseInline(text: string): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    let last = 0;
    let key = 0;
    INLINE_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = INLINE_RE.exec(text)) !== null) {
        if (match.index > last) nodes.push(text.slice(last, match.index));
        if (match[1] !== undefined)      nodes.push(<strong key={key++}>{match[2]}</strong>);
        else if (match[3] !== undefined) nodes.push(<u key={key++}>{match[4]}</u>);
        else if (match[5] !== undefined) nodes.push(<em key={key++}>{match[6]}</em>);
        last = match.index + match[0].length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
}

interface Props {
    text: string;
    className?: string;
    as?: keyof React.JSX.IntrinsicElements;
}

type Block =
    | { type: 'p';  content: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] };

function buildBlocks(text: string): Block[] {
    const blocks: Block[] = [];
    for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        const bullet  = line.match(/^- (.*)$/);
        const ordered = line.match(/^\d+\. (.*)$/);
        if (bullet) {
            const last = blocks[blocks.length - 1];
            if (last?.type === 'ul') last.items.push(bullet[1]);
            else blocks.push({ type: 'ul', items: [bullet[1]] });
        } else if (ordered) {
            const last = blocks[blocks.length - 1];
            if (last?.type === 'ol') last.items.push(ordered[1]);
            else blocks.push({ type: 'ol', items: [ordered[1]] });
        } else {
            blocks.push({ type: 'p', content: line });
        }
    }
    return blocks;
}

const MarkdownText: React.FC<Props> = ({ text, className, as: Tag = 'span' }) => {
    const hasList = /^(?:- |\d+\. )/m.test(text);
    const isMultiLine = text.includes('\n');

    if (!hasList && !isMultiLine) {
        return <Tag className={className}>{parseInline(text)}</Tag>;
    }

    const blocks = buildBlocks(text);
    return (
        <div className={className}>
            {blocks.map((block, i) => {
                if (block.type === 'ul') {
                    return (
                        <ul key={i} className="list-disc list-inside space-y-0.5 my-1">
                            {block.items.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
                        </ul>
                    );
                }
                if (block.type === 'ol') {
                    return (
                        <ol key={i} className="list-decimal list-inside space-y-0.5 my-1">
                            {block.items.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
                        </ol>
                    );
                }
                return <p key={i}>{parseInline(block.content)}</p>;
            })}
        </div>
    );
};

export default MarkdownText;
