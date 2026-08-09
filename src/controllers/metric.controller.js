class MetricController {
    constructor() {
        this.getSystemMetricsApi = this.getSystemMetricsApi.bind(this);
        this.renderMetricPage = this.renderMetricPage.bind(this);
    }

    get prometheusUrl() {
        return process.env.PROMETHEUS_URL || 'http://localhost:9090';
    }

    // Helper truy vấn dữ liệu từ Prometheus Server
    async #queryPrometheus(promql) {
        const url = `${this.prometheusUrl}/api/v1/query?query=${encodeURIComponent(promql)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Prometheus Query Error: ${res.statusText}`);
        const json = await res.json();
        return json.data?.result || [];
    }

    async getSystemMetricsApi(req, res) {
        try {
            // 1. Lấy dung lượng Heap Memory đang sử dụng (Chuyển Byte -> MB)
            const heapPromql = 'nodejs_heap_size_used_bytes / 1024 / 1024';

            // 2. Lấy độ trễ Event Loop (Chuyển Giây -> ms)
            const eventLoopPromql = 'nodejs_eventloop_lag_seconds * 1000';

            // 3. Lấy % CPU tiêu thụ của riêng process Node.js
            const processCpuPromql = 'rate(process_cpu_seconds_total[1m]) * 100';

            // 4. Lấy % CPU & RAM phần cứng của toàn VPS (từ Node Exporter)
            const sysCpuPromql = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)';
            const sysRamPromql = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';

            // Thực thi đồng thời các truy vấn
            const [heapRes, loopRes, processCpuRes, sysCpuRes, sysRamRes] = await Promise.all([
                this.#queryPrometheus(heapPromql),
                this.#queryPrometheus(eventLoopPromql),
                this.#queryPrometheus(processCpuPromql),
                this.#queryPrometheus(sysCpuPromql),
                this.#queryPrometheus(sysRamPromql)
            ]);

            // Trích xuất kết quả trả về
            const nodeHeapUsed = parseFloat(heapRes[0]?.value[1] || 0).toFixed(2);
            const eventLoopLag = parseFloat(loopRes[0]?.value[1] || 0).toFixed(2);
            const processCpu = parseFloat(processCpuRes[0]?.value[1] || 0).toFixed(1);
            const sysCpu = parseFloat(sysCpuRes[0]?.value[1] || 0).toFixed(1);
            const sysRam = parseFloat(sysRamRes[0]?.value[1] || 0).toFixed(1);

            return res.json({
                success: true,
                timestamp: new Date().toLocaleTimeString('vi-VN'),
                data: {
                    nodeHeapUsedMb: nodeHeapUsed,
                    eventLoopLagMs: eventLoopLag,
                    processCpuPercent: processCpu,
                    cpuUsagePercent: sysCpu,
                    ramUsagePercent: sysRam
                }
            });
        } catch (error) {
            console.error('Metrics Query Error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Không thể kết nối tới Prometheus Server',
                error: error.message
            });
        }
    }

    renderMetricPage(req, res) {
        return res.render('metrics/index', {
            title: 'System & App Performance'
        });
    }
}

module.exports = new MetricController();
