import React from 'react';
import { Table } from 'react-bootstrap';
import PropTypes from 'prop-types';
import styles from '../styles/MasterReport.module.scss';

/**
 * Reusable data table component
 * Can be used for displaying different types of data with consistent styling
 */
function DataTable({
    columns,
    data,
    className = '',
    onRowClick = null,
    hoverable = true,
    responsive = true
}) {
    return (

        <Table
            hover={hoverable}
            responsive={responsive}
            className={`${styles.analysisTable} ${className}`}
        >
            <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th
                            key={index}
                            className={column.align ? styles[`${column.align}Align`] : ''}
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr
                        key={row.key || rowIndex}
                        onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                        className={onRowClick ? styles.clickableRow : ''}
                    >
                        {columns.map((column, colIndex) => (
                            <td
                                key={colIndex}
                                className={column.align ? styles[`${column.align}Align`] : ''}
                            >
                                {column.render ? column.render(row, rowIndex) : row[column.key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </Table>

    );
}

DataTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        header: PropTypes.string.isRequired,
        align: PropTypes.oneOf(['left', 'right', 'center']),
        render: PropTypes.func
    })).isRequired,
    data: PropTypes.array.isRequired,
    className: PropTypes.string,
    onRowClick: PropTypes.func,
    hoverable: PropTypes.bool,
    responsive: PropTypes.bool
};

export default DataTable;