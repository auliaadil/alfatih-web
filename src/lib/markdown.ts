// Strips markdown to plain text for card previews, alt text, etc.
export function stripMarkdown(text: string): string {
    return text
        .split('\n')
        .map(line => {
            const bullet  = line.match(/^- (.*)$/);
            if (bullet) return bullet[1];
            const ordered = line.match(/^\d+\. (.*)$/);
            if (ordered) return ordered[1];
            return line;
        })
        .join(' ')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .trim();
}
