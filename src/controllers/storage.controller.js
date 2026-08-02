const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ENDPOINT_URL = process.env.S3_ENDPOINT;

const storageController = {
    // GET: Xem danh sách Folder và File theo Prefix
    index: async (req, res) => {
        try {
            let currentPrefix = req.query.prefix || '';

            // TỰ ĐỘNG CHUẨN HÓA PREFIX:
            // Nếu prefix có giá trị và không kết thúc bằng '/', tự động thêm '/' vào cuối
            if (currentPrefix && !currentPrefix.endsWith('/')) {
                currentPrefix += '/';
            }

            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: currentPrefix,
                Delimiter: '/', // Phân chia folder theo dấu '/'
            });

            const data = await s3Client.send(command);

            // 1. Trích xuất danh sách Thư mục (CommonPrefixes)
            const folders = (data.CommonPrefixes || []).map((item) => {
                // Tách lấy tên hiển thị ngắn gọn của folder
                const parts = item.Prefix.replace(/\/$/, '').split('/');
                const folderName = parts[parts.length - 1];

                return {
                    name: folderName,
                    prefix: item.Prefix, // VD: "DayConLamGiauTap1/"
                };
            });

            // 2. Trích xuất danh sách File
            const files = (data.Contents || [])
                .filter((file) => file.Key !== currentPrefix) // Bỏ qua chính folder hiện tại
                .map((file) => {
                    const fileName = file.Key.substring(currentPrefix.length); // Lấy tên file
                    return {
                        key: file.Key,
                        name: fileName,
                        size: (file.Size / 1024).toFixed(2) + ' KB',
                        lastModified: file.LastModified,
                        url: `${ENDPOINT_URL}/${BUCKET_NAME}/${file.Key}`,
                    };
                });

            // 3. Xử lý điều hướng Breadcrumbs
            const breadcrumbs = [];
            if (currentPrefix) {
                const parts = currentPrefix.split('/').filter(Boolean);
                let accumulatedPath = '';

                parts.forEach((part) => {
                    accumulatedPath += part + '/';
                    breadcrumbs.push({
                        name: part,
                        prefix: accumulatedPath,
                    });
                });
            }

            return res.render('storages/index', {
                folders,
                files,
                currentPrefix,
                breadcrumbs,
                bucketName: BUCKET_NAME,
                error: null,
            });
        } catch (err) {
            console.error('Lỗi danh sách Storage:', err);
            return res.render('storages/index', {
                folders: [],
                files: [],
                currentPrefix: '',
                breadcrumbs: [],
                bucketName: BUCKET_NAME,
                error: 'Lỗi tải danh sách: ' + err.message,
            });
        }
    },

    // POST: Upload file vào đúng Prefix hiện tại
    upload: async (req, res) => {
        try {
            const currentPrefix = req.body.prefix || '';

            // Kiểm tra req.files (khi dùng upload.array, multer sẽ trả về mảng req.files)
            if (!req.files || req.files.length === 0) {
                return res.redirect(`/storages?prefix=${encodeURIComponent(currentPrefix)}`);
            }

            // Upload song song các file lên S3 bằng Promise.all
            const uploadPromises = req.files.map((file) => {
                const fileKey = `${currentPrefix}${Date.now()}-${file.originalname}`;

                const uploadParams = {
                    Bucket: BUCKET_NAME,
                    Key: fileKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    ACL: 'public-read', // <--- Thêm dòng này để set quyền Public Read
                };

                return s3Client.send(new PutObjectCommand(uploadParams));
            });

            await Promise.all(uploadPromises);

            res.redirect(`/storages?prefix=${encodeURIComponent(currentPrefix)}`);
        } catch (err) {
            console.error('Lỗi upload file:', err);
            res.status(500).send('Upload thất bại: ' + err.message);
        }
    },

    // POST: Xóa file
    delete: async (req, res) => {
        try {
            const { key, prefix } = req.body;
            if (!key) return res.redirect('/storages');

            await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
            res.redirect(`/storages?prefix=${encodeURIComponent(prefix || '')}`);
        } catch (err) {
            console.error('Lỗi xóa file:', err);
            res.status(500).send('Xóa thất bại: ' + err.message);
        }
    },

    // POST: Tạo folder mới trên S3
    createFolder: async (req, res) => {
        try {
            const currentPrefix = req.body.prefix || '';
            let folderName = (req.body.folderName || '').trim();

            if (!folderName) {
                return res.redirect(`/storages?prefix=${encodeURIComponent(currentPrefix)}`);
            }

            // Làm sạch tên folder & bắt buộc kết thúc bằng dấu /
            folderName = folderName.replace(/\/+/g, ''); // Xóa gạch chéo dư thừa
            const folderKey = `${currentPrefix}${folderName}/`;

            // Tạo 1 object rỗng có key kết thúc bằng '/' để S3 nhận diện là Folder
            const createFolderParams = {
                Bucket: BUCKET_NAME,
                Key: folderKey,
                Body: '',
            };

            await s3Client.send(new PutObjectCommand(createFolderParams));

            res.redirect(`/storages?prefix=${encodeURIComponent(currentPrefix)}`);
        } catch (err) {
            console.error('Lỗi tạo thư mục:', err);
            res.status(500).send('Tạo thư mục thất bại: ' + err.message);
        }
    },
};



module.exports = storageController;