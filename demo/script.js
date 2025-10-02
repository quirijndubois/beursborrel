let stockChartInstance = null;
let currentStockIndex = 0;
const maxDataPoints = 50; 
const tickIntervalMs = 2000;
const autoSwitchIntervalMs = 10000;

let stocks = [
    { id: 0, name: 'Beer', symbol: 'BER', prices: [], labels: [], initialBasePrice: 3.00, volatility: 0.15, nextLabelIndex: 1 },
    { id: 1, name: 'Vodka', symbol: 'VOD', prices: [], labels: [], initialBasePrice: 5.00, volatility: 0.20, nextLabelIndex: 1 },
    { id: 2, name: 'Wine', symbol: 'WIN', prices: [], labels: [], initialBasePrice: 4.00, volatility: 0.10, nextLabelIndex: 1 },
    { id: 3, name: 'Rocket Shot', symbol: 'RKT', prices: [], labels: [], initialBasePrice: 3.50, volatility: 0.25, nextLabelIndex: 1 },
    { id: 4, name: 'Soda', symbol: 'SDA', prices: [], labels: [], initialBasePrice: 3.00, volatility: 0.05, nextLabelIndex: 1 },
];


function generateNextPrice(stock) {
    // Check if prices array is populated, otherwise use initialBasePrice
    const lastPrice = stock.prices.length > 0 ? stock.prices[stock.prices.length - 1] : stock.initialBasePrice;
    const change = (Math.random() - 0.5) * stock.volatility; 
    let newPrice = lastPrice + change;

    // Prevent price from straying too far from the base price for simulation
    const stabilityRange = 1.00; // Keep price within $1.00 of the base price
    const pullBackFactor = 0.1; // How much to pull the price back if it hits a bound
    
    if (newPrice < stock.initialBasePrice - stabilityRange) {
        newPrice = stock.initialBasePrice - stabilityRange + Math.random() * pullBackFactor;
    } else if (newPrice > stock.initialBasePrice + stabilityRange) {
            newPrice = stock.initialBasePrice + stabilityRange - Math.random() * pullBackFactor;
    }
    
    // Ensure the price doesn't go below 0 
    if (newPrice < 0.01) {
        newPrice = 0.01;
    }

    return parseFloat(newPrice.toFixed(2));
}

function updateHeader(stock) {
    const startingPrice = stock.prices[0];
    const lastPrice = stock.prices[stock.prices.length - 1];
    
    if (startingPrice === undefined || lastPrice === undefined) return;

    const change = lastPrice - startingPrice;
    const percentageChange = (change / startingPrice) * 100;
    const isPositive = change >= 0;

    const changeTextElement = document.getElementById('changeText');
    document.getElementById('currentStockName').textContent = `${stock.symbol} | ${stock.name}`;
    document.getElementById('currentPrice').textContent = new Intl.NumberFormat('en-US', { 
        maximumFractionDigits: 2, 
        minimumFractionDigits: 2 
    }).format(lastPrice);
    
    changeTextElement.textContent = `${isPositive ? '▲' : '▼'} ${Math.abs(change).toFixed(2)} (${Math.abs(percentageChange).toFixed(2)}%)`;
        changeTextElement.className = `text-lg font-semibold mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`;
}

function updateTicker() {
    const tickerContainer = document.getElementById('stockTicker');
    
    // To ensure seamless scrolling, we duplicate the entire content of the ticker
    const tickerContent = stocks.map(stock => {
        const startPrice = stock.prices[0];
        const lastPrice = stock.prices[stock.prices.length - 1];
        
        if (startPrice === undefined || lastPrice === undefined) return '';

        const change = lastPrice - startPrice;
        const percentageChange = (change / startPrice) * 100;
        const isPositive = change >= 0;
        const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
        const arrow = isPositive ? '▲' : '▼';
        
        return `
            <span class="inline-block px-8 py-0.5 border-r border-gray-800 tracking-wider">
                <span class="font-bold text-gray-300">${stock.symbol}</span> 
                <!-- FIX: Added min-w-[4rem] to price and min-w-[5rem] to percentage to prevent width jitter -->
                <span class="mx-2 font-mono inline-block text-right min-w-[4rem]">${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(lastPrice)}</span>
                <span class="${colorClass} font-semibold inline-block text-right min-w-[5rem]">${arrow} ${Math.abs(percentageChange).toFixed(2)}%</span>
            </span>
        `;
    }).join('');

    tickerContainer.innerHTML = tickerContent + tickerContent + tickerContent + tickerContent;

    const duration = stocks.length * 4; // 4 seconds per stock item on screen
    tickerContainer.style.animationDuration = `${duration}s`;
}

function renderMainChart() {
    const stock = stocks[currentStockIndex];
    
    // Update Header first
    updateHeader(stock);

    const isPositive = stock.prices[stock.prices.length - 1] >= stock.prices[0];
    const mainColor = isPositive ? '#34d399' : '#f87171'; // Green-400 or Red-400
    const lightColor = isPositive ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)';

    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // Define Gradient dynamically based on performance
    const gradient = ctx.createLinearGradient(0, 0, 0, 400); 
    gradient.addColorStop(0, mainColor + '60'); 
    gradient.addColorStop(1, lightColor);
    
    // If the chart instance exists, update it, otherwise create it
    if (stockChartInstance) {
        stockChartInstance.data.labels = stock.labels;
        stockChartInstance.data.datasets[0].data = stock.prices;
        stockChartInstance.data.datasets[0].borderColor = mainColor;
        
        stockChartInstance.data.datasets[0].backgroundColor = gradient;
        stockChartInstance.data.datasets[0].pointHoverBackgroundColor = mainColor;
        
        // Using 'none' to avoid Chart.js animation conflicting with CSS fade
        stockChartInstance.update('none'); 
    } else {
        stockChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stock.labels,
                datasets: [{
                    label: 'Price',
                    data: stock.prices,
                    borderColor: mainColor, 
                    backgroundColor: gradient, 
                    fill: 'start', 
                    tension: 0,
                    pointRadius: 0, 
                    borderWidth: 3,
                    pointHoverRadius: 5, 
                    pointHoverBackgroundColor: mainColor,
                    pointHoverBorderColor: '#1f2937', 
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(55, 65, 81, 0.9)',
                        titleFont: { size: 14, weight: 'bold', color: 'white' },
                        bodyFont: { size: 14, color: 'white' },
                        cornerRadius: 6,
                        padding: 10,
                        displayColors: false, 
                        callbacks: {
                            title: function(context) { return context[0].label; },
                            label: function(context) {
                                const value = context.parsed.y;
                                return 'Price: ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(255, 255, 255, 0.15)', drawBorder: false },
                        ticks: {
                            color: '#d1d5db',
                            padding: 10,
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', compactDisplay: 'short' }).format(value);
                            }
                        }
                    },
                    x: {
                        grid: { 
                            display: true,
                            color: 'rgba(255, 255, 255, 0.05)'
                        },
                        ticks: {
                            color: '#d1d5db',
                            maxTicksLimit: 10,
                            callback: function(value, index, ticks) {
                                return (index % 10 === 0 || index === ticks.length - 1) ? this.getLabelForValue(value) : '';
                            }
                        }
                    }
                }
            }
        });
    }
}

function tickData() {
    stocks.forEach(stock => {
        // 1. Calculate new price
        const newPrice = generateNextPrice(stock);

        // 2. Shift data (FIFO - First In, First Out)
        if (stock.prices.length >= maxDataPoints) {
            stock.prices.shift();
            stock.labels.shift();
        }

        // 3. Push new data
        stock.prices.push(newPrice);
        stock.labels.push(`P ${stock.nextLabelIndex++}`);
    });

    // Update the ticker bar with the latest performance data
    updateTicker();
    
    // If the current stock is being displayed, update its chart instance silently
    if (stockChartInstance) {
            // Use the current stock data to update the chart in place
            const currentStock = stocks[currentStockIndex];
            stockChartInstance.data.labels = currentStock.labels;
            stockChartInstance.data.datasets[0].data = currentStock.prices;
            
            // Recalculate colors and update header
            updateHeader(currentStock);

            const isPositive = currentStock.prices[currentStock.prices.length - 1] >= currentStock.prices[0];
            const mainColor = isPositive ? '#34d399' : '#f87171'; // Green-400 or Red-400
            const lightColor = isPositive ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)';

            const ctx = stockChartInstance.canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400); 
            gradient.addColorStop(0, mainColor + '60'); 
            gradient.addColorStop(1, lightColor);

            stockChartInstance.data.datasets[0].borderColor = mainColor;
            stockChartInstance.data.datasets[0].pointHoverBackgroundColor = mainColor
            stockChartInstance.data.datasets[0].backgroundColor = gradient;
            
            stockChartInstance.update('none'); // Use 'none' for instant update without animation
    }
}

function switchStock() {
    const wrapper = document.getElementById('chartWrapper');
    
    // 1. Start fade out
    wrapper.style.opacity = '0'; 
    wrapper.style.pointerEvents = 'none'; // Prevent interaction during transition

    // Wait for fade-out duration (300ms) before switching content
    setTimeout(() => {
        currentStockIndex = (currentStockIndex + 1) % stocks.length;
        renderMainChart(); // This updates the chart data

        // 2. Start fade in
        wrapper.style.opacity = '1';
        wrapper.style.pointerEvents = 'auto';
    }, 300); 
}

function initializeDashboard() {
    // 1. Populate initial data for all stocks
    stocks.forEach(stock => {
        let currentPrice = stock.initialBasePrice;
        for (let i = 0; i < maxDataPoints; i++) {
            // Pass the entire 'stock' object to generateNextPrice.
            currentPrice = generateNextPrice(stock); 
            stock.prices.push(currentPrice);
            stock.labels.push(`P ${stock.nextLabelIndex++}`);
        }
    });

    // 2. Render the initial main chart (first stock)
    renderMainChart();
    
    // 3. Render the initial ticker
    updateTicker();

    // 4. Start the continuous data update loop (for all stocks and ticker)
    setInterval(tickData, tickIntervalMs);

    // 5. Start the main chart auto-switching loop
    setInterval(switchStock, autoSwitchIntervalMs);
}

window.onload = initializeDashboard;