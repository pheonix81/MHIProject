'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatPrice, getConfidenceLevel } from '@/lib/utils';

interface BenchmarkChartProps {
  benchmarkData: {
    cpt_code: string;
    procedure_name: string;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
    statistics: {
      min_price: number;
      max_price: number;
      avg_price: number;
      median_price: number;
      percentile_25: number;
      percentile_75: number;
    };
    sample_size: number;
    region?: string;
    payer_type?: string;
  } | null;
  loading: boolean;
}

export function BenchmarkChart({ benchmarkData, loading }: BenchmarkChartProps) {
  if (loading) {
    return <div className="text-center py-8">Loading benchmark data...</div>;
  }

  if (!benchmarkData) {
    return <div className="text-center py-8">No benchmark data available</div>;
  }

  const chartData = [
    { name: 'P10', value: benchmarkData.percentiles.p10 },
    { name: 'P25', value: benchmarkData.percentiles.p25 },
    { name: 'P50 (Median)', value: benchmarkData.percentiles.p50 },
    { name: 'P75', value: benchmarkData.percentiles.p75 },
    { name: 'P90', value: benchmarkData.percentiles.p90 },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {benchmarkData.procedure_name}
        </h3>
        <p className="text-gray-600 mb-4">CPT Code: {benchmarkData.cpt_code}</p>

        {/* Confidence Level */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Data Points</p>
            <p className="text-2xl font-bold text-teal-600">{benchmarkData.sample_size}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Confidence Level</p>
            <p className="text-2xl font-bold text-teal-600">
              {getConfidenceLevel(benchmarkData.sample_size)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Price Distribution</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => formatPrice(value as number)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#14b8a6" 
              strokeWidth={2}
              dot={{ fill: '#14b8a6', r: 6 }}
              activeDot={{ r: 8 }}
              name="Price"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Minimum</p>
          <p className="text-xl font-bold text-gray-900">{formatPrice(benchmarkData.statistics.min_price)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">25th Percentile</p>
          <p className="text-xl font-bold text-gray-900">{formatPrice(benchmarkData.statistics.percentile_25)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Median</p>
          <p className="text-xl font-bold text-teal-600">{formatPrice(benchmarkData.statistics.median_price)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Maximum</p>
          <p className="text-xl font-bold text-gray-900">{formatPrice(benchmarkData.statistics.max_price)}</p>
        </div>
      </div>
    </div>
  );
}
