// field: the column key
// sortBy/sortOrder: current sort state
// onSort: callback(field) — toggles asc/desc if same field, else sets asc
export default function SortableHeader({ field, label, sortBy, sortOrder, onSort }) {
  const isActive = sortBy === field;
  const arrow = isActive ? (sortOrder === 'asc' ? '▲' : '▼') : '';

  return (
    <th onClick={() => onSort(field)} className="sortable-header">
      {label} <span className="sort-arrow">{arrow}</span>
    </th>
  );
}
