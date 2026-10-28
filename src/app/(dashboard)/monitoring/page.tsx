import { getMonitoringData } from "@/lib/monitoring/actions"
import { MonitoringDashboard } from "@/components/monitoring/monitoring-dashboard"

export default async function MonitoringPage() {
  const data = await getMonitoringData()
  return <MonitoringDashboard initialData={data} />
}
