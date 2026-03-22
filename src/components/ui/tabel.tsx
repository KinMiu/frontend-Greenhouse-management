"use client";

import {Inbox} from "lucide-react";
import React from "react";
import Loader from "./loader";

export interface TableColumn<T> {
  header: string;
  accessor?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function Table<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
}: TableProps<T>) {
  console.log("dari table", data);
  return (
    <div className="w-full overflow-x-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left text-gray-600">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`px-6 py-4 font-semibold tracking-wider ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader />
                  <span>Loading Data...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Inbox className="w-8 h-8 text-gray-300" />
                  <span>{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.data.map((item, rowIndex: string) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 last:border-none hover:bg-gray-50/80 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 ${col.className ?? ""}`}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessor
                        ? (item[col.accessor] as React.ReactNode)
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
