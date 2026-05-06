let chart;

function renderChart(trades) {

    const labels = [];
    const data = [];

    let runningProfit = 0;

    trades.forEach((t, index) => {
        runningProfit += Number(t.profit);
        labels.push("T" + (index + 1));
        data.push(runningProfit);
    });

    const ctx = document.getElementById("profitChart");

    if (!ctx) return;

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Profit Curve",
                data,
                borderWidth: 2,
                tension: 0.3
            }]
        }
    });
}

// global access
window.renderChart = renderChart;