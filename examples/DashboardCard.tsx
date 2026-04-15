import { Skeletonify } from "../src";

export interface Metric {
  label: string;
  value: string;
  change: string;
  chartUrl: string;
}

function DashboardCard({ metric }: { metric: Metric }) {
  return (
    <div className="flex flex-col gap-4 p-6 w-80 h-64 rounded-lg">
      <div className="flex justify-between items-center">
        <span className="text-sm">{metric.label}</span>
        <span className="text-xs">{metric.change}</span>
      </div>
      <h3 className="text-3xl">{metric.value}</h3>
      <img src={metric.chartUrl} className="w-full h-32 rounded" alt="" />
    </div>
  );
}

export default function DashboardCardExample({
  loading,
  metric,
}: {
  loading: boolean;
  metric: Metric;
}) {
  return (
    <Skeletonify loading={loading}>
      <DashboardCard metric={metric} />
    </Skeletonify>
  );
}
