pipeline {
    agent any

    environment {
        REGISTRY = 'localhost:5000'
        IMAGE_NAME = 'soundmind-admin'
        TAG = 'latest'
        FULL_IMAGE = "${REGISTRY}/${IMAGE_NAME}:${TAG}"
        SERVICE_NAME = 'soundmind-admin' // Tên service trong file docker-compose.yml
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // ansiColor('xterm')
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '=== [STEP 1] Lấy mã nguồn từ Git ==='
                checkout scm
            }
        }

        stage('2. Build & Push Image to Local Registry') {
            steps {
                echo "=== [STEP 2] Build Image: ${FULL_IMAGE} ==="
                // Build với Tag chỉ định trực tiếp đến Local Registry
                sh "docker build -t ${FULL_IMAGE} ."
                
                echo "=== [STEP 2.1] Push Image lên Local Registry (localhost:5000) ==="
                sh "docker push ${FULL_IMAGE}"
            }
        }

        stage('3. Deploy via Docker Compose') {
            steps {
                echo "=== [STEP 3] Triển khai lại service ${SERVICE_NAME} bằng Docker Compose ==="
                script {
                    // Chỉ định trực tiếp file docker-compose.yml nằm tại /app
                    sh """
                        cd /app
                        docker-compose pull ${SERVICE_NAME}
                        docker-compose up -d --no-deps ${SERVICE_NAME}
                    """
                }
            }
        }
    }

    post {
        success {
            echo "🎉 [SUCCESS] Triển khai thành công ${SERVICE_NAME} qua Docker Compose!"
        }
        failure {
            echo "❌ [FAILURE] Quá trình Build/Push/Deploy thất bại!"
        }
        always {
            echo '=== [CLEANUP] Dọn dẹp các Image dangling/rác trên server ==='
            sh 'docker image prune -f || true'
        }
    }
}
