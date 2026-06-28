import { useState, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import {
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    Search,
    Edit2,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    X,
} from "lucide-react";

export interface DataTableColumn<T> {
    key: string;
    header: string;
    sortable?: boolean;
    render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    title?: string;
    showRowNumber?: boolean;
    showActions?: boolean;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    renderActions?: (row: T) => ReactNode;
    pageSize?: number;
    isOpen?: boolean;
    onClose?: () => void;
    searchPlaceholder?: string;
    emptyMessage?: string;
}

type SortDir = "asc" | "desc" | null;

const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active || !dir)
        return <ChevronsUpDown size={14} className="dt-sort-icon" />;
    return dir === "asc" ? (
        <ChevronUp size={14} className="dt-sort-icon active" />
    ) : (
        <ChevronDown size={14} className="dt-sort-icon active" />
    );
};

const DataTable = <T extends Record<string, unknown>>({
    data,
    columns,
    title,
    showRowNumber = true,
    showActions = true,
    onEdit,
    onDelete,
    onView,
    renderActions,
    pageSize = 10,
    isOpen = true,
    onClose,
    searchPlaceholder = "Cari data...",
    emptyMessage = "Tidak ada data.",
}: DataTableProps<T>) => {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [page, setPage] = useState(1);

    const handleSort = useCallback(
        (key: string) => {
            if (sortKey === key) {
                setSortDir((d) =>
                    d === "asc" ? "desc" : d === "desc" ? null : "asc",
                );
                if (sortDir === "desc") setSortKey(null);
            } else {
                setSortKey(key);
                setSortDir("asc");
            }
            setPage(1);
        },
        [sortKey, sortDir],
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return data;
        const q = search.toLowerCase();
        return data.filter((row) =>
            columns.some((c) => {
                const v = row[c.key];
                return v != null && String(v).toLowerCase().includes(q);
            }),
        );
    }, [data, search, columns]);

    const sorted = useMemo(() => {
        if (!sortKey || !sortDir) return filtered;
        return [...filtered].sort((a, b) => {
            const av = a[sortKey] ?? "",
                bv = b[sortKey] ?? "";
            const cmp =
                typeof av === "number" && typeof bv === "number"
                    ? av - bv
                    : String(av).localeCompare(String(bv));
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filtered, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
    const totalCols =
        columns.length + (showRowNumber ? 1 : 0) + (showActions ? 1 : 0);

    if (!isOpen) return null;

    const table = (
        <div className="dt-wrapper">
            {(title || onClose) && (
                <div className="dt-header">
                    {title && <h3 className="dt-title">{title}</h3>}
                    {onClose && (
                        <button
                            type="button"
                            className="dt-close-btn"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            )}
            <div className="dt-toolbar">
                <div className="dt-search-box">
                    <Search size={15} className="dt-search-icon" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
                <span className="dt-info-text">
                    {sorted.length} data ditemukan
                </span>
            </div>
            <div className="dt-table-scroll">
                <table className="dt-table">
                    <thead>
                        <tr>
                            {showRowNumber && <th className="dt-th-num">No</th>}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`dt-th${col.sortable !== false ? " dt-th-sortable" : ""}`}
                                    onClick={
                                        col.sortable !== false
                                            ? () => handleSort(col.key)
                                            : undefined
                                    }
                                >
                                    <span>{col.header}</span>
                                    {col.sortable !== false && (
                                        <SortIcon
                                            active={sortKey === col.key}
                                            dir={
                                                sortKey === col.key
                                                    ? sortDir
                                                    : null
                                            }
                                        />
                                    )}
                                </th>
                            ))}
                            {showActions && (
                                <th className="dt-th-action">Aksi</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {paged.length === 0 ? (
                            <tr>
                                <td className="dt-empty" colSpan={totalCols}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paged.map((row, i) => {
                                const gi = (page - 1) * pageSize + i;
                                return (
                                    <tr key={gi}>
                                        {showRowNumber && (
                                            <td className="dt-td-num">
                                                {gi + 1}
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={col.key} className="dt-td">
                                                {col.render
                                                    ? col.render(row, gi)
                                                    : ((row[
                                                          col.key
                                                      ] as ReactNode) ?? "-")}
                                            </td>
                                        ))}
                                        {showActions && (
                                            <td className="dt-td-action">
                                                {renderActions ? (
                                                    renderActions(row)
                                                ) : (
                                                    <>
                                                        {onView && (
                                                            <button
                                                                type="button"
                                                                className="dt-act-btn dt-act-view"
                                                                onClick={() =>
                                                                    onView(row)
                                                                }
                                                                title="Lihat"
                                                            >
                                                                <Eye
                                                                    size={14}
                                                                />
                                                            </button>
                                                        )}
                                                        {onEdit && (
                                                            <button
                                                                type="button"
                                                                className="dt-act-btn dt-act-edit"
                                                                onClick={() =>
                                                                    onEdit(row)
                                                                }
                                                                title="Edit"
                                                            >
                                                                <Edit2
                                                                    size={14}
                                                                />
                                                            </button>
                                                        )}
                                                        {onDelete && (
                                                            <button
                                                                type="button"
                                                                className="dt-act-btn dt-act-delete"
                                                                onClick={() =>
                                                                    onDelete(
                                                                        row,
                                                                    )
                                                                }
                                                                title="Hapus"
                                                            >
                                                                <Trash2
                                                                    size={14}
                                                                />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="dt-pagination">
                    <button
                        type="button"
                        className="dt-page-btn"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="dt-page-info">
                        Halaman {page} dari {totalPages}
                    </span>
                    <button
                        type="button"
                        className="dt-page-btn"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );

    return onClose ? (
        <div className="dt-overlay" onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}>{table}</div>
        </div>
    ) : (
        table
    );
};

export default DataTable;
