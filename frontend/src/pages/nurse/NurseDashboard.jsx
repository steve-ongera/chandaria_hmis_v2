import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import StatCard from "../../components/StatCard";
import VisitsChart from "../../components/charts/VisitsChart";
import BreakdownChart from "../../components/charts/BreakdownChart";
import { analyticsApi } from "../../api/endpoints";
import { IconUserPlus, IconActivity, IconCash, IconShoppingBag } from "../../components/icons";

export default function NurseDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    analyticsApi.nurse(14).then((res) => {
      if (mounted) {
        setData(res.data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const summary = data?.summary || {};

  return (
    <Layout title="Nurse Dashboard">
      <div className="page-header">
        <div>
          <h1>Reception Overview</h1>
          <p>Today's visits, triage activity, and payments at a glance.</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          icon={IconUserPlus}
          label="Visits Today"
          value={loading ? "—" : summary.visits_today}
        />
        <StatCard
          icon={IconActivity}
          label="Triages Today"
          value={loading ? "—" : summary.triages_today}
        />
        <StatCard
          icon={IconCash}
          label="Payments Today"
          value={loading ? "—" : `KES ${Number(summary.payments_today || 0).toLocaleString()}`}
        />
        <StatCard
          icon={IconShoppingBag}
          label="Walk-in Sales Today"
          value={loading ? "—" : summary.walkin_sales_today}
        />
      </div>

      <div className="grid grid-2">
        <VisitsChart
          data={data?.visits_series}
          title="Visits, Last 14 Days"
          subtitle="Daily count of registered visits"
        />
        <BreakdownChart
          data={data?.payments_by_method}
          title="Payments by Method"
          subtitle="Last 14 days"
          isCurrency
        />
      </div>
    </Layout>
  );
}