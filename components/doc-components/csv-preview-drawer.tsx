"use client";

import React, { useState } from "react";
import { parse } from "csv-parse/sync";
import { Loader2, TableProperties, X, Eye } from "lucide-react";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface CsvPreviewDrawerProps {
  url: string;
  filename: string;
}

export function CsvPreviewDrawer({ url, filename }: CsvPreviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCSVData = async () => {
    if (csvData) return; // Already loaded
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      const text = await response.text();
      const parser = parse(text, { columns: false, skip_empty_lines: true });
      const rows = parser.slice(1, 101); // Get first 100 rows after header
      const headers = parser[0];
      setCsvData({ headers, rows });
    } catch (err) {
      setError("Failed to load CSV data");
      console.error(err);
    }
    setLoading(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadCSVData();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <button className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 transition-colors">
          <Eye className="w-3 h-3" /> Preview
        </button>
      </DrawerTrigger>

      <DrawerContent className="h-[85vh] max-h-[85vh] md:h-[90vh] md:max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="flex items-center gap-2">
                <TableProperties className="w-5 h-5" />
                {filename} - Preview
              </DrawerTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing first 100 rows of data
              </p>
            </div>
            <DrawerClose className="rounded-full p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="p-4 h-full overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading data...</span>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-500">
              {error}
            </div>
          ) : csvData ? (
            <div className="border dark:border-gray-800 rounded-lg overflow-hidden h-full">
              <div className="overflow-auto h-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {csvData.headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b dark:border-gray-800"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.map((row, i) => (
                      <tr key={i} className="border-b dark:border-gray-800 last:border-0">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
