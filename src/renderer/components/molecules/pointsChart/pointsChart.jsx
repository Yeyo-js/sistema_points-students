import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import PropTypes from 'prop-types';
import './pointsChart.css';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PointsChart = ({ data, title = 'Evolución de Puntos', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="points-chart points-chart--empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <p>No hay datos para mostrar</p>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Puntos Acumulados',
        data: data.map(point => point.cumulativePoints),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif"
        },
        callbacks: {
          label: function(context) {
            const dataPoint = data[context.dataIndex];
            return [
              `Puntos acumulados: ${context.parsed.y}`,
              `Puntos del día: ${dataPoint.dayPoints > 0 ? '+' : ''}${dataPoint.dayPoints}`,
              `Tipo: ${dataPoint.participationType}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            return value >= 0 ? '+' + value : value;
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          maxRotation: 45,
          minRotation: 0
        }
      }
    }
  };

  return (
    <div className="points-chart">
      {title && <h3 className="points-chart__title">{title}</h3>}
      <div className="points-chart__container" style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

PointsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      cumulativePoints: PropTypes.number.isRequired,
      dayPoints: PropTypes.number.isRequired,
      participationType: PropTypes.string.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  height: PropTypes.number
};

export default PointsChart;
