import React from 'react'
import { BarChart3, PieChart, TrendingUp, Table, Image, Download } from 'lucide-react'

const RichContentRenderer = ({ richContent, onImageDownload }) => {
  if (!richContent || (!richContent.tables?.length && !richContent.charts?.length && !richContent.summary_visualization)) {
    return null
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Summary Visualization */}
      {richContent.summary_visualization && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">
                {richContent.summary_visualization.title}
              </h4>
            </div>
            <button
              onClick={() => onImageDownload && onImageDownload(richContent.summary_visualization.image, richContent.summary_visualization.title)}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="Download chart"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white p-3 rounded border">
            <img
              src={`data:image/png;base64,${richContent.summary_visualization.image}`}
              alt={richContent.summary_visualization.title}
              className="w-full h-auto max-w-full"
            />
          </div>
          <p className="text-sm text-blue-700 mt-2">
            {richContent.summary_visualization.description}
          </p>
        </div>
      )}

      {/* Tables */}
      {richContent.tables?.map((table, index) => (
        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-3">
            <Table className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">
              Data Table {index + 1}
            </h4>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {table.type}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded">
              <thead className="bg-gray-100">
                <tr>
                  {table.data.headers?.map((header, headerIndex) => (
                    <th
                      key={headerIndex}
                      className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.data.rows?.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-4 py-2 text-sm text-gray-900 border-b"
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
      ))}

      {/* Charts */}
      {richContent.charts?.map((chart, index) => (
        <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {chart.type === 'pie' && <PieChart className="w-5 h-5 text-green-600" />}
              {chart.type === 'bar' && <BarChart3 className="w-5 h-5 text-green-600" />}
              {chart.type === 'line' && <TrendingUp className="w-5 h-5 text-green-600" />}
              <h4 className="font-semibold text-green-900">
                {chart.title}
              </h4>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                {chart.data_type}
              </span>
            </div>
            <button
              onClick={() => onImageDownload && onImageDownload(chart.image, chart.title)}
              className="text-green-600 hover:text-green-800 p-1"
              title="Download chart"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <img
              src={`data:image/png;base64,${chart.image}`}
              alt={chart.title}
              className="w-full h-auto max-w-full"
            />
          </div>
          
          <p className="text-sm text-green-700 mt-2">
            {chart.description}
          </p>
        </div>
      ))}

      {/* Rich Content Summary */}
      {(richContent.has_tabular_data || richContent.has_numerical_data) && (
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2 mb-2">
            <Image className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Rich Content Generated</span>
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            {richContent.has_tabular_data && (
              <div>✓ Found {richContent.tables?.length || 0} data table(s)</div>
            )}
            {richContent.has_numerical_data && (
              <div>✓ Generated {richContent.charts?.length || 0} visualization(s)</div>
            )}
            {richContent.has_comparison_data && (
              <div>✓ Detected comparison data for enhanced visualization</div>
            )}
            {richContent.has_time_series && (
              <div>✓ Identified time series data for trend analysis</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RichContentRenderer