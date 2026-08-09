/**
 * Tự động bọc (wrap) các method của Controller để log thông tin trace:
 * - Khi bắt đầu chạy method (index, create, store, update, destroy, vv...)
 * - Thông số req.params và req.query đi kèm
 * - Log lỗi chi tiết nếu có exception ném ra
 */
function wrapController(controller, controllerName) {
    if (!controller) return controller;
    
    // Thu thập tất cả các key từ object lẫn prototype
    const keys = new Set([
        ...Object.getOwnPropertyNames(controller),
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(controller) || {})
    ]);
    
    keys.forEach(method => {
        if (method === 'constructor') return;
        
        const originalMethod = controller[method];
        if (typeof originalMethod === 'function') {
            controller[method] = async function(req, res, next) {
                console.log(`[Controller Log] [${controllerName}] Method bắt đầu: ${method}`);
                if (req.params && Object.keys(req.params).length > 0) {
                    console.log(`  --> req.params:`, JSON.stringify(req.params));
                }
                if (req.query && Object.keys(req.query).length > 0) {
                    console.log(`  --> req.query:`, JSON.stringify(req.query));
                }
                try {
                    return await originalMethod.apply(this, arguments);
                } catch (error) {
                    console.error(`[Controller Log] [${controllerName}] Method ${method} xảy ra lỗi:`, error.message);
                    throw error;
                }
            };
        }
    });
    
    return controller;
}

module.exports = { wrapController };
