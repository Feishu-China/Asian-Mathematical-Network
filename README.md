
# Asian-Mathematical-Network
A comprehensive network platform for mathematical research, education, and collaboration across Asia.

## 🚀 Quick Start (快速启动)
### 1. Environment Preparation (环境准备)
Ensure you have the following installed on your system:
- Python 3.8 or higher
- Git (for cloning the repository)

### 2. Clone Repository (克隆仓库)
```bash
# Clone the remote repository to local
git clone https://github.com/Feishu-China/Asian-Mathematical-Network.git

# Enter the project directory
cd Asian-Mathematical-Network

### 3. Install Dependencies (安装依赖)
It is recommended to use a virtual environment to avoid dependency conflicts:
```bash
# Create virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Create virtual environment (Mac/Linux)
python3 -m venv venv
source venv/bin/activate

# Install core dependency (Flask)
pip install flask

# If there is a requirements.txt file, install all dependencies
# pip install -r requirements.txt
```

### 4. Run the Application (启动应用)
#### Method 1: Directly run app.py (推荐)
```bash
python app.py
```

#### Method 2: Use Flask command
```bash
# Set environment variable (Windows)
set FLASK_APP=app.py

# Set environment variable (Mac/Linux)
# export FLASK_APP=app.py

# Start the application
flask run
```

### 5. Access the Application (访问应用)
Open your browser and visit the following address:
```
http://127.0.0.1:5000/
```

## ⚠️ Common Issues (常见问题)
### 1. Port 5000 is occupied (端口5000被占用)
```bash
# Specify a new port to start
flask run --port 5001

# Or modify the port in app.py:
# app.run(host='0.0.0.0', port=5001, debug=True)
```

### 2. Stop the application (停止应用)
- Normal stop: Press `Ctrl + C` in the terminal where the application is running (Windows/Mac/Linux universal)
- Force stop (if stuck):
  - Windows: Open Task Manager → End the `python.exe`/`python3.exe` process
  - Mac/Linux:
    ```bash
    # Find the process ID (PID)
    ps -ef | grep app.py

    # Kill the process
    kill <PID>
    # Force kill if necessary
    kill -9 <PID>
    ```

## 📁 Project Structure (项目结构)
```
Asian-Mathematical-Network/
├── app.py                # Main application entry file (Flask core)
├── asiamath.db           # Database file
├── schema.sql            # Database schema definition
├── templates/
│   └── index.html        # Landing page (core UI)
└── README.md             # Project documentation
```

## 📜 License
This project is licensed under the Apache-2.0 License - see the LICENSE file for details.

## 📞 Support
If you encounter any issues during startup or use, please check the terminal error logs first, or contact the project maintainer.
```

### 纯MD格式验证说明
| 内容类型               | MD语法规范                | 示例                          |
|------------------------|---------------------------|-------------------------------|
| 标题                   | `#`/`##`/`###` 分级       | `# 标题`、`## 二级标题`       |
| 列表                   | `-` 无序列表              | `- Python 3.8+`               |
| 代码块                 | ```语言 包裹              | ```bash + 命令 + ```          |
| 文本强调               | 无多余格式（纯文本）      | 所有说明文字均为纯MD文本      |
| 特殊符号               | 仅使用MD兼容的emoji（可选）| 🚀/⚠️等（不影响MD解析）        |

### 使用步骤
1. 复制上述全部内容，覆盖你仓库中现有的`README.md`；
2. 执行以下命令提交更新：
   ```bash
   git add README.md
   git commit -m "docs: update README to standard markdown format"
   git pull origin main --allow-unrelated-histories
   git push origin main
   ```
