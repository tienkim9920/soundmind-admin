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
            // --- 1. Metrics cho soundmind-admin (Node.js) ---
            const adminHeapPromql = 'nodejs_heap_size_used_bytes{job="soundmind-admin"} / 1024 / 1024';
            const adminEventLoopPromql = 'nodejs_eventloop_lag_seconds{job="soundmind-admin"} * 1000';
            const adminCpuPromql = 'rate(process_cpu_seconds_total{job="soundmind-admin"}[1m]) * 100';

            // --- 2. Metrics cho soundmind-api (Java / Spring Boot Micrometer) ---
            // Java Heap RAM (Lọc area="heap")
            const apiHeapPromql = 'sum(jvm_memory_used_bytes{job="soundmind-api", area="heap"}) / 1024 / 1024';

            // Java Process CPU (% CPU mà JVM tiêu thụ, nhân 100)
            const apiCpuPromql = 'process_cpu_usage{job="soundmind-api"} * 100';

            // --- 3. Metrics hệ thống (VPS) ---
            const sysCpuPromql = '100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)';
            const sysRamPromql = '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100';

            // Thực thi đồng thời các truy vấn
            const [
                adminHeapRes, adminLoopRes, adminCpuRes,
                apiHeapRes, apiCpuRes,
                sysCpuRes, sysRamRes
            ] = await Promise.all([
                this.#queryPrometheus(adminHeapPromql),
                this.#queryPrometheus(adminEventLoopPromql),
                this.#queryPrometheus(adminCpuPromql),
                this.#queryPrometheus(apiHeapPromql),
                this.#queryPrometheus(apiCpuPromql),
                this.#queryPrometheus(sysCpuPromql),
                this.#queryPrometheus(sysRamPromql)
            ]);

            return res.json({
                success: true,
                timestamp: new Date().toLocaleTimeString('vi-VN'),
                data: {
                    admin: {
                        nodeHeapUsedMb: parseFloat(adminHeapRes[0]?.value[1] || 0).toFixed(2),
                        eventLoopLagMs: parseFloat(adminLoopRes[0]?.value[1] || 0).toFixed(2),
                        processCpuPercent: parseFloat(adminCpuRes[0]?.value[1] || 0).toFixed(1)
                    },
                    api: {
                        nodeHeapUsedMb: parseFloat(apiHeapRes[0]?.value[1] || 0).toFixed(2),
                        eventLoopLagMs: 0, // Java không sử dụng Event Loop Lag, trả về 0 hoặc bỏ qua trên UI
                        processCpuPercent: parseFloat(apiCpuRes[0]?.value[1] || 0).toFixed(1)
                    },
                    system: {
                        cpuUsagePercent: parseFloat(sysCpuRes[0]?.value[1] || 0).toFixed(1),
                        ramUsagePercent: parseFloat(sysRamPromql ? sysRamRes[0]?.value[1] : 0).toFixed(1)
                    }
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
