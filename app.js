let socket;
let chart;
let chartData = {}; 
let currentSymbol = 'ethusdt'; 
let currentInterval = '1m'; 

function connectToWebSocket(symbol, interval) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketData(message);
    };

    socket.onerror = (error) => {
        console.error('WebSocket Error: ', error);
    };

    socket.onclose = () => {
        console.log('WebSocket connection closed');
    };
}

function handleWebSocketData(data) {
    const kline = data.k;
    const candle = {
        time: kline.t,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
        volume: parseFloat(kline.v)
    };

    if (!chartData[currentSymbol]) {
        chartData[currentSymbol] = [];
    }

    chartData[currentSymbol].push(candle);

    updateChart(chartData[currentSymbol]);
    saveChartData(currentSymbol);
}

function handleCoinChange(symbol) {
    saveChartData(currentSymbol);
    loadChartData(symbol);
    if (socket) {
        socket.close();
    }
    connectToWebSocket(symbol, currentInterval);
    currentSymbol = symbol;
}

function handleIntervalChange(interval) {
    saveChartData(currentSymbol);
    if (socket) {
        socket.close();
    }
    connectToWebSocket(currentSymbol, interval);
    currentInterval = interval;
}

function updateChart(data) {
    const labels = data.map(candle => new Date(candle.time).toLocaleTimeString());
    const closePrices = data.map(candle => candle.close);

    if (!chart) {
        chart = new Chart(document.getElementById('cryptoChart').getContext('2d'), {
            type: 'line', 
            data: {
                labels: labels,
                datasets: [{
                    label: 'Close Price',
                    data: closePrices,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                responsive: true
            }
        });
    } else {
        chart.data.labels = labels;
        chart.data.datasets[0].data = closePrices;
        chart.update();
    }
}

function saveChartData(symbol) {
    if (chartData[symbol]) {
        localStorage.setItem(`chartData_${symbol}`, JSON.stringify(chartData[symbol]));
    }
}

function loadChartData(symbol) {
    const storedData = localStorage.getItem(`chartData_${symbol}`);
    if (storedData) {
        chartData[symbol] = JSON.parse(storedData);
        updateChart(chartData[symbol]);
    } else {
        chartData[symbol] = [];
    }
}

// Initialize WebSocket connection with default values
connectToWebSocket(currentSymbol, currentInterval);
