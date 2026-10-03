"use client";

import DashboardLayout from "@/components/dashboard-layout";
import TransportsContent from "@/app/transports/transports-content";

export default function AgentTransportsPage() {
  return (
    <DashboardLayout roles={["agent", "admin"]}>
      <div className="-m-4 md:-m-6">
        <TransportsContent allowManagement={true} />
      </div>
    </DashboardLayout>
  );
}
