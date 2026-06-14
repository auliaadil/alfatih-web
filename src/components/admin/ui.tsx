import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { X, AlertTriangle, CheckCircle, Info, XCircle, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react';

// ── Toast System ──────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastItem { id: string; type: ToastType; message: string; }
interface ToastContextValue { toast: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_ICONS: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    warning: <AlertTriangle className="w-4 h-4" />,
};

const TOAST_STYLES: Record<ToastType, string> = {
    success: 'bg-white border-emerald-400 text-emerald-700 shadow-emerald-100/80',
    error: 'bg-white border-red-400 text-red-700 shadow-red-100/80',
    info: 'bg-white border-blue-400 text-blue-700 shadow-blue-100/80',
    warning: 'bg-white border-amber-400 text-amber-700 shadow-amber-100/80',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border-l-4 ${TOAST_STYLES[t.type]} min-w-[280px] max-w-sm animate-slide-in-right`}
                    >
                        <span className="shrink-0">{TOAST_ICONS[t.type]}</span>
                        <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
                        <button
                            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                            className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx.toast;
};

// ── Confirm Dialog ─────────────────────────────────────────

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
    loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, confirmLabel = 'Delete', onConfirm, onCancel, danger = true, loading = false,
}) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-scale-in">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${danger ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <AlertTriangle className={`w-5 h-5 ${danger ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-blue-700'}`}
                    >
                        {loading ? 'Deleting...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Slide-Over Panel ───────────────────────────────────────

interface SlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    width?: 'sm' | 'md' | 'lg';
}

const SLIDE_WIDTH = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export const SlideOver: React.FC<SlideOverProps> = ({ isOpen, onClose, title, subtitle, children, footer, width = 'md' }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className={`relative h-full w-full ${SLIDE_WIDTH[width]} bg-white shadow-2xl flex flex-col animate-slide-in-panel`}>
                <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 leading-tight">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {children}
                </div>
                {footer && (
                    <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Page Header ────────────────────────────────────────────

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    badge?: string | number;
    action?: ReactNode;
    breadcrumbs?: { label: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, badge, action, breadcrumbs }) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
                    {breadcrumbs.map((b, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <ChevronRight className="w-3 h-3" />}
                            <span>{b.label}</span>
                        </React.Fragment>
                    ))}
                </div>
            )}
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-jakarta">
                    {title}
                </h1>
                {badge !== undefined && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-primary border border-blue-100 rounded-full tabular-nums">
                        {badge}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

// ── Status Badge ───────────────────────────────────────────

const STATUS_STYLE_MAP: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    handled: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border border-red-200',
    'down payment': 'bg-amber-50 text-amber-700 border border-amber-200',
    'full payment': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    lunas: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'dp': 'bg-amber-50 text-amber-700 border border-amber-200',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const style = STATUS_STYLE_MAP[status.toLowerCase()] ?? 'bg-gray-100 text-gray-700';
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
            {status}
        </span>
    );
};

// ── Empty State ────────────────────────────────────────────

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
            {icon}
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
        {description && <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>}
        {action}
    </div>
);

// ── Skeleton Rows ──────────────────────────────────────────

export const SkeletonRows: React.FC<{ rows?: number; cols: number }> = ({ rows = 5, cols }) => (
    <>
        {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="animate-pulse">
                {Array.from({ length: cols }).map((_, j) => (
                    <td key={j} className="px-6 py-4">
                        <div className={`h-4 bg-gray-100 rounded-lg ${j === 0 ? 'w-3/4' : j % 2 === 0 ? 'w-1/2' : 'w-2/3'}`} />
                    </td>
                ))}
            </tr>
        ))}
    </>
);

export const SkeletonCard: React.FC = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
        <div className="h-48 bg-gray-100" />
        <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
        </div>
    </div>
);

// ── Form Primitives ────────────────────────────────────────

export const FormField: React.FC<{ label: string; required?: boolean; hint?: string; children: ReactNode }> = ({ label, required, hint, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-xs text-gray-400 mt-1.5">{hint}</p>}
    </div>
);

export const inputClass = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300';
export const selectClass = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors';
export const textareaClass = 'w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none placeholder:text-gray-300';

// ── Button Styles ──────────────────────────────────────────

export const btnPrimary = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-200/60 disabled:opacity-60 disabled:cursor-not-allowed';
export const btnSecondary = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors';
export const btnDanger = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors';
export const btnGhost = 'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors';

// ── Table Wrapper ──────────────────────────────────────────

export const TableCard: React.FC<{ children: ReactNode }> = ({ children }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            {children}
        </div>
    </div>
);

export const THead: React.FC<{ children: ReactNode }> = ({ children }) => (
    <thead>
        <tr className="bg-gray-50/80 border-b border-gray-200">
            {children}
        </tr>
    </thead>
);

interface ThProps {
    children: ReactNode;
    align?: 'left' | 'right' | 'center';
    sortKey?: string;
    currentSort?: SortState;
    onSort?: (key: string) => void;
}

export const Th: React.FC<ThProps> = ({ children, align = 'left', sortKey, currentSort, onSort }) => {
    const isSortable = !!sortKey && !!onSort;
    const isActive = isSortable && currentSort?.key === sortKey;

    const SortIcon = !isSortable
        ? null
        : isActive
        ? currentSort!.dir === 'asc'
            ? <ChevronUp className="w-3 h-3 shrink-0" />
            : <ChevronDown className="w-3 h-3 shrink-0" />
        : <ChevronsUpDown className="w-3 h-3 shrink-0 text-gray-300" />;

    const inner = (
        <span className={`inline-flex items-center gap-1 ${isActive ? 'text-primary' : ''}`}>
            {children}
            {SortIcon}
        </span>
    );

    return (
        <th className={`px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-${align}`}>
            {isSortable ? (
                <button
                    type="button"
                    onClick={() => onSort!(sortKey!)}
                    className="hover:text-gray-700 transition-colors cursor-pointer"
                >
                    {inner}
                </button>
            ) : inner}
        </th>
    );
};

export const Td: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
    <td className={`px-6 py-4 text-sm text-gray-700 ${className}`}>
        {children}
    </td>
);

// ── Sort Utilities ─────────────────────────────────────────

export type SortDir = 'asc' | 'desc';
export interface SortState { key: string; dir: SortDir; }

export function compareRows(a: any, b: any, key: string, dir: SortDir): number {
    const get = (obj: any, k: string): any => k.split('.').reduce((o, part) => o?.[part], obj);
    const valA = get(a, key);
    const valB = get(b, key);
    let cmp: number;
    if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
    } else {
        cmp = String(valA ?? '').toLowerCase().localeCompare(String(valB ?? '').toLowerCase());
    }
    return dir === 'asc' ? cmp : -cmp;
}

// ── Section Card ───────────────────────────────────────────

export const SectionCard: React.FC<{ title?: string; description?: string; children: ReactNode; className?: string }> = ({ title, description, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
        {(title || description) && (
            <div className="px-6 py-5 border-b border-gray-100">
                {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
                {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
        )}
        <div className="p-6">
            {children}
        </div>
    </div>
);

// ── Search Input ───────────────────────────────────────────

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder = 'Cari...' }) => (
    <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-300"
        />
        {value && (
            <button
                type="button"
                aria-label="Clear search"
                onClick={() => onChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        )}
    </div>
);

// ── Pagination ─────────────────────────────────────────────

interface PaginationProps {
    page: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ page, totalItems, pageSize, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, totalItems);

    const pageNumbers = (): (number | '…')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
        if (page < 4) return [0, 1, 2, 3, 4, '…', totalPages - 1];
        if (page > totalPages - 5) return [0, '…', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1];
        return [0, '…', page - 1, page, page + 1, '…', totalPages - 1];
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1 pt-4">
            <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{start}–{end}</span> of <span className="font-semibold text-gray-700">{totalItems}</span>
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 0}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                {pageNumbers().map((n, i) =>
                    n === '…' ? (
                        <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">…</span>
                    ) : (
                        <button
                            key={n}
                            onClick={() => onPageChange(n as number)}
                            className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                                n === page
                                    ? 'bg-primary text-white shadow-sm shadow-blue-200/60'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {(n as number) + 1}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages - 1}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ── Stat Card ──────────────────────────────────────────────

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    color: string;
    trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, trend }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
            {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
    </div>
);
