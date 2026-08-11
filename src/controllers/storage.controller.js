const adminRoute = process.env.ADMIN_ROUTE === '/' ? '' : (process.env.ADMIN_ROUTE || '/admin').replace(/\/$/, '');

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectCommand,
    DeleteObjectCommand,
    PutObjectAclCommand // 1. Import thêm PutObjectAclCommand
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

// Helper chung cho logic upload S3
const processS3Uploads = async (files, currentPrefix) => {
    const uploadPromises = files.map(async (file) => {
        const fileKey = `${currentPrefix}${Date.now()}-${file.originalname}`;

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read',
        };

        await s3Client.send(new PutObjectCommand(uploadParams));

        const publicUrl = `https://s3.vn-hcm-1.vietnix.cloud/${BUCKET_NAME}/${fileKey}`;
        return {
            key: fileKey,
            url: publicUrl,
            filename: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
        };
    });

    return await Promise.all(uploadPromises);
};

// 2. Helper xử lý cập nhật ACL hàng loạt
const processBulkAclUpdate = async (keys, acl) => {
    // Đảm bảo keys luôn là danh sách mảng
    const fileKeys = Array.isArray(keys) ? keys : [keys];

    const aclPromises = fileKeys.map(async (key) => {
        const aclParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            ACL: acl, // 'public-read' | 'private'
        };
        return await s3Client.send(new PutObjectAclCommand(aclParams));
    });

    return await Promise.all(aclPromises);
};

const storageController = {
    // GET: Xem danh sách Folder và File theo Prefix
    index: async (req, res) => {
        try {
            let currentPrefix = req.query.prefix || '';

            if (currentPrefix && !currentPrefix.endsWith('/')) {
                currentPrefix += '/';
            }

            const command = new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: currentPrefix,
                Delimiter: '/',
            });

            const data = await s3Client.send(command);

            const folders = (data.CommonPrefixes || []).map((item) => {
                const parts = item.Prefix.replace(/\/$/, '').split('/');
                const folderName = parts[parts.length - 1];

                return {
                    name: folderName,
                    prefix: item.Prefix,
                };
            });

            const files = (data.Contents || [])
                .filter((file) => file.Key !== currentPrefix)
                .map((file) => {
                    const fileName = file.Key.substring(currentPrefix.length);
                    return {
                        key: file.Key,
                        name: fileName,
                        size: (file.Size / 1024).toFixed(2) + ' KB',
                        lastModified: file.LastModified,
                        url: `${ENDPOINT_URL}/${BUCKET_NAME}/${file.Key}`,
                    };
                });

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

    // LUỒNG 1: API Route Upload (JSON)
    uploadApi: async (req, res) => {
        try {
            const currentPrefix = req.body.prefix || '';

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Không có file nào được tải lên',
                });
            }

            const uploadedFiles = await processS3Uploads(req.files, currentPrefix);

            return res.status(200).json({
                success: true,
                message: 'Upload file thành công',
                data: uploadedFiles,
            });
        } catch (err) {
            console.error('Lỗi API upload file:', err);
            return res.status(500).json({
                success: false,
                message: 'Upload thất bại: ' + err.message,
            });
        }
    },

    // LUỒNG 2: Form Web Route Upload (Redirect)
    upload: async (req, res) => {
        try {
            const currentPrefix = req.body.prefix || '';

            if (!req.files || req.files.length === 0) {
                return res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(currentPrefix)}`);
            }

            await processS3Uploads(req.files, currentPrefix);

            return res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(currentPrefix)}`);
        } catch (err) {
            console.error('Lỗi upload file:', err);
            return res.status(500).send('Upload thất bại: ' + err.message);
        }
    },

    // POST: Xóa file
    delete: async (req, res) => {
        try {
            const { key, prefix } = req.body;
            if (!key) return res.redirect(adminRoute + '/storages');

            await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
            res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(prefix || '')}`);
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
                return res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(currentPrefix)}`);
            }

            folderName = folderName.replace(/\/+/g, '');
            const folderKey = `${currentPrefix}${folderName}/`;

            const createFolderParams = {
                Bucket: BUCKET_NAME,
                Key: folderKey,
                Body: '',
            };

            await s3Client.send(new PutObjectCommand(createFolderParams));

            res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(currentPrefix)}`);
        } catch (err) {
            console.error('Lỗi tạo thư mục:', err);
            res.status(500).send('Tạo thư mục thất bại: ' + err.message);
        }
    },

    // ==========================================
    // BỔ SUNG 1: API Cập nhật ACL hàng loạt (JSON Response)
    // Body truyền lên: { keys: ['path/file1.jpg', 'path/file2.jpg'], acl: 'public-read' | 'private' }
    // ==========================================
    updateAclApi: async (req, res) => {
        try {
            const { keys, acl } = req.body;

            if (!keys || (Array.isArray(keys) && keys.length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh sách file (keys) không được để trống',
                });
            }

            if (!['public-read', 'private'].includes(acl)) {
                return res.status(400).json({
                    success: false,
                    message: 'Quyền riêng tư không hợp lệ. Chỉ chấp nhận "public-read" hoặc "private"',
                });
            }

            await processBulkAclUpdate(keys, acl);

            return res.status(200).json({
                success: true,
                message: `Cập nhật quyền ${acl} thành công cho ${Array.isArray(keys) ? keys.length : 1} file.`,
            });
        } catch (err) {
            console.error('Lỗi API cập nhật ACL:', err);
            return res.status(500).json({
                success: false,
                message: 'Cập nhật quyền thất bại: ' + err.message,
            });
        }
    },

    // ==========================================
    // BỔ SUNG 2: Form Web Route Cập nhật ACL hàng loạt (Redirect)
    // Body truyền lên: { keys: 'file1.jpg' | ['file1.jpg', 'file2.jpg'], acl: 'public-read' | 'private', prefix: '' }
    // ==========================================
    updateAcl: async (req, res) => {
        try {
            const { keys, acl, prefix } = req.body;
            const currentPrefix = prefix || '';

            if (keys && ['public-read', 'private'].includes(acl)) {
                await processBulkAclUpdate(keys, acl);
            }

            return res.redirect(`${adminRoute}/storages?prefix=${encodeURIComponent(currentPrefix)}`);
        } catch (err) {
            console.error('Lỗi cập nhật ACL:', err);
            return res.status(500).send('Cập nhật quyền thất bại: ' + err.message);
        }
    },
};

const { wrapController } = require('../utils/logger');
module.exports = wrapController(storageController, 'StorageController');
