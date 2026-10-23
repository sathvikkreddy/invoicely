"use client";

import { columnConfig, columns } from "@/components/table-columns/invoices";
import { DataTable } from "@/components/ui/data-table";
import type { Invoice } from "@/types/common/invoice";

const InvoicesPage = ({ invoices }: { invoices: Invoice[] }) => {
  return (
    <div className="dash-page gap-4 p-4">
      <DataTable
        isLoading={false}
        data={invoices}
        columns={columns}
        columnConfig={columnConfig}
        defaultSorting={[{ id: "createdAt", desc: true }]}
      />
    </div>
  );
};

export default InvoicesPage;
