class LogController {
    constructor() {
        // Khởi tạo Base URL, fallback về localhost nếu chưa set ENV
        this.lokiBaseUrl = process.env.LOKI_URL || 'http://localhost:3100';

        // Bind 'this' cho các phương thức để tránh mất context khi dùng làm Route Handler
        this.getLogsApi = this.getLogsApi.bind(this);
        this.renderLogPage = this.renderLogPage.bind(this);
    }

    /**
     * Helper phân tích Log Level từ dòng log
     */
    #detectLogLevel(line) {
        if (/error|fail|exception/i.test(line)) return 'ERROR';
        if (/warn|warning/i.test(line)) return 'WARN';
        return 'INFO';
    }

    /**
     * Controller trả dữ liệu JSON log cho Frontend / Ajax
     */
    async getLogsApi(req, res) {
        try {
            const { container = 'soundmind-api', limit = 100 } = req.query;

            const logqlQuery = `{container="${container}"}`;
            const url = `${this.lokiBaseUrl}/loki/api/v1/query_range?query=${encodeURIComponent(logqlQuery)}&limit=${limit}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Loki API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const formattedLogs = [];

            if (data.status === 'success' && data.data?.result) {
                data.data.result.forEach((stream) => {
                    stream.values.forEach(([nanoTimestamp, line]) => {
                        const timestampMs = Math.floor(parseInt(nanoTimestamp, 10) / 1_000_000);

                        formattedLogs.push({
                            id: nanoTimestamp,
                            timestamp: new Date(timestampMs).toISOString(),
                            timeFormatted: new Date(timestampMs).toLocaleString('vi-VN'),
                            level: this.#detectLogLevel(line),
                            message: line,
                        });
                    });
                });
            }

            // Sắp xếp log mới nhất lên đầu
            formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            return res.json({
                success: true,
                total: formattedLogs.length,
                data: formattedLogs,
            });
        } catch (error) {
            console.error('Loki Controller Error:', error.message);
            return res.status(500).json({
                success: false,
                message: 'Không thể tải log từ Loki',
                error: error.message,
            });
        }
    }

    /**
     * Controller render trang giao diện Log Viewer
     */
    renderLogPage(req, res) {
        return res.render('logs/index');
    }
}

// Export một Instance duy nhất (Singleton Pattern)
module.exports = new LogController();
