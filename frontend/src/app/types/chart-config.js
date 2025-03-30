export const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "white"
      }
    },
    title: {
      display: true,
      text: "Price Trends",
      color: "white"
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: {
        color: "rgba(255, 255, 255, 0.1)"
      },
      ticks: {
        color: "white"
      }
    },
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.1)"
      },
      ticks: {
        color: "white"
      }
    }
  }
};
