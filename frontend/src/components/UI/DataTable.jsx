import React from "react";
import PropTypes from "prop-types";

const DataTable = ({ columns, data, actions = [], className = "" }) => {
  return (
    <div className={`rounded-lg border border-gray-200 shadow-sm w-full ${className}`}>
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                style={{ width: column.width || 'auto' }}
                className="px-1 py-1.5 ml-2 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-tight first:rounded-tl-lg"
              >
                {column.label}
              </th>
            ))}
            {actions.length > 0 && (
              <th 
                style={{ width: '100px' }}
                className="px-1 py-1.5 text-center text-xs font-semibold text-gray-700 uppercase tracking-tight rounded-tr-lg"
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                className="px-4 py-4 text-center text-gray-500 "
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    style={{ width: column.width || 'auto' }}
                    className="px-1 py-1.5 text-xs text-gray-900 text-center overflow-hidden"
                  >
                    {column.render ? column.render(row) : row[column.key] || "-"}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td 
                    style={{ width: '50px' }}
                    className="px-1 py-1.5 text-center"
                  >
                    <div className="flex justify-center space-x-0.5">
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                            action.className || "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          }`}
                          title={action.label}
                        >
                          <action.icon className="w-3 h-3" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string.isRequired,
      width: PropTypes.string,
      render: PropTypes.func,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  actions: PropTypes.array,
  className: PropTypes.string,
};

DataTable.defaultProps = {
  actions: [],
  className: "",
};

export default DataTable;