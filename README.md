# 🔷 Zabbix Monitoring Dashboard v3.0

**Professional monitoring dashboard with real-time animations, graph rotation, and admin controls**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![Version](https://img.shields.io/badge/version-3.0.0-orange.svg)

---

## ✨ Key Features

### 🎨 **Enhanced UI/UX**
- **Zoom-in Login Animation**: Stunning entrance effect when logging in
- **Animated Graphs**: Charts rotate every 60 seconds automatically
- **Real-time Updates**: WebSocket-powered live data streaming
- **Glassmorphism Design**: Modern frosted glass effects
- **Smooth Transitions**: Hardware-accelerated animations
- **Responsive Layout**: Works on desktop, tablet, and mobile

### 🔐 **Admin-Only Controls**
- **Super Admin**: Only admin users can create/delete users and hosts
- **Role-Based Access**: 3 user roles (admin, analyst, viewer)
- **Audit Logging**: Complete tracking of all admin actions
- **Secure Authentication**: JWT tokens with bcrypt password hashing
- **Session Management**: Automatic logout on inactivity

### 📊 **Monitoring Features**
- **20 Pre-configured Hosts**: Production-ready monitoring setup
- **Real-time Metrics**: CPU, Memory, Disk, Network tracking
- **8 Active Problems**: Trigger-based alerting system
- **Graph Rotation**: Auto-rotating charts every 60 seconds
- **Historical Data**: 2-hour metric retention with 1-minute resolution
- **Host Groups**: Organized by server type

### 🔔 **Problem Management**
- **Severity Levels**: Critical, High, Average, Warning, Information
- **Acknowledgment System**: Track who handled each problem
- **Status Tracking**: New, Acknowledged, Resolved states
- **MITRE ATT&CK**: Security incident correlation (extensible)

---

## 🚀 Quick Start

### **Option 1: Automated Setup (Recommended)**

#### Windows:
```cmd
# Double-click start.bat
# OR run in Command Prompt:
start.bat
```

#### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

### **Option 2: Manual Setup**

#### Step 1: Install Node.js
Download and install from [nodejs.org](https://nodejs.org/) (LTS version recommended)

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Start the Server
```bash
npm start
```

#### Step 4: Open Browser
Navigate to: `http://localhost:3001`

#### Step 5: Login
- **Username**: `admin`
- **Password**: `Admin@2024!`

---

## 📋 System Requirements

- **Node.js**: v14.0.0 or higher
- **NPM**: v6.0.0 or higher
- **RAM**: 512 MB minimum
- **Disk Space**: 200 MB for application + database
- **Browser**: Modern browser (Chrome, Firefox, Edge, Safari)
- **Ports**: 3001 (HTTP), 8080 (WebSocket)

---

## 🎯 Project Structure

```
zabbix-dashboard/
├── zabbix-server.js         # Backend server (Node.js + Express)
├── zabbix-index.html         # Frontend (HTML + CSS + JavaScript)
├── zabbix_dashboard.db       # SQLite database (auto-created)
├── package.json              # Node.js dependencies
├── package-lock.json         # Locked dependency versions
├── start.bat                 # Windows startup script
├── start.sh                  # Linux/Mac startup script
├── README.md                 # This file
└── SETUP_GUIDE.md            # Detailed setup instructions
```

---

## 🔑 Default Users

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | Admin@2024! | Admin | Full access - Create users/hosts |
| analyst1 | Analyst@123 | Analyst | View & acknowledge problems |
| analyst2 | Analyst@123 | Analyst | View & acknowledge problems |
| viewer1 | Viewer@123 | Viewer | Read-only access |

**⚠️ IMPORTANT**: Change these passwords after first login!

---

## 💻 Sample Hosts

The dashboard comes pre-configured with 20 production hosts:

### Web Servers (3)
- WEB-PROD-01 (192.168.1.10) - Ubuntu 22.04
- WEB-PROD-02 (192.168.1.11) - Ubuntu 22.04
- WEB-PROD-03 (192.168.1.12) - Ubuntu 22.04

### Database Servers (3)
- DB-MASTER-01 (192.168.2.20) - RHEL 9 - MySQL
- DB-REPLICA-01 (192.168.2.21) - RHEL 9 - MySQL
- DB-ANALYTICS-01 (192.168.2.22) - RHEL 9 - PostgreSQL

### Application Servers (2)
- APP-PROD-01 (192.168.3.30) - Windows Server 2022
- APP-PROD-02 (192.168.3.31) - Windows Server 2022

### File & Backup (2)
- FILE-SRV-01 (192.168.4.40) - Windows Server 2019
- BACKUP-SRV-01 (192.168.4.41) - Debian 12

### Infrastructure (2)
- DC-PRIMARY-01 (192.168.5.50) - Windows Server 2022 DC
- DC-SECONDARY-01 (192.168.5.51) - Windows Server 2022 DC

### Mail Services (1)
- MAIL-RELAY-01 (192.168.6.60) - Ubuntu 22.04 - Postfix

### Network Equipment (2)
- FW-EDGE-01 (10.0.0.1) - Fortinet FortiOS
- SW-CORE-01 (10.0.0.10) - Cisco IOS

### Monitoring & Security (2)
- ZABBIX-SERVER-01 (192.168.8.80) - Ubuntu 22.04
- SIEM-COLLECTOR-01 (192.168.8.81) - Ubuntu 22.04

### Development (2)
- DEV-BUILD-01 (172.16.1.100) - Ubuntu 22.04
- DEV-TEST-01 (172.16.1.101) - Ubuntu 22.04

---

## 🚨 Sample Problems

8 pre-configured problems covering various severity levels:

1. **High CPU Usage** (DB-ANALYTICS-01) - High
2. **Disk Space Critical** (BACKUP-SRV-01) - Critical
3. **Memory Usage High** (WEB-PROD-01) - Warning
4. **High Load Average** (DB-MASTER-01) - Warning
5. **Disk Space Warning** (FILE-SRV-01) - Warning
6. **High Network Traffic** (SIEM-COLLECTOR-01) - Information
7. **Service Response Time High** (MAIL-RELAY-01) - Average
8. **Queue Growing** (ZABBIX-SERVER-01) - Average

---

## 📊 Graph Rotation System

### How It Works
- Graphs automatically rotate every **60 seconds**
- Displays different metric types in sequence
- Countdown timer shows next rotation
- Smooth transition animations
- Real-time data updates every 5 seconds

### Available Graph Types
1. System CPU Usage (Line chart)
2. Memory Utilization (Area chart)
3. Network Traffic (Line chart)
4. Disk I/O Performance (Line chart)
5. Server Load Average (Area chart)
6. Top CPU Consumers (Bar chart)
7. Database Performance (Multi-line)
8. Web Server Metrics (Multi-line)

---

## 🔐 Admin Panel Features

### User Management
- **Create Users**: Add new analysts and viewers
- **Delete Users**: Remove non-admin users
- **View Activity**: See last login times
- **Role Assignment**: Assign appropriate permissions

### Host Management
- **Add Hosts**: Register new monitored systems
- **Delete Hosts**: Remove decommissioned servers
- **Configure Groups**: Organize by server type
- **Set Metadata**: Location, department, OS info

### Audit Logging
- **Complete History**: All admin actions logged
- **User Tracking**: Who did what and when
- **IP Recording**: Source IP for each action
- **Action Types**: Login, Create, Update, Delete

---

## 🎨 UI/UX Highlights

### Animations
- **Login**: Zoom-in effect with smooth fade
- **Dashboard**: Slide-up cards with stagger
- **Charts**: Smooth data transitions
- **Hover Effects**: Glow and lift interactions
- **Graph Rotation**: Seamless chart switching

### Color Scheme
- **Background**: Deep navy gradient (#0a0e27)
- **Accent Cyan**: #00ffff (primary actions)
- **Accent Purple**: #bd00ff (secondary)
- **Accent Pink**: #ff006e (warnings)
- **Accent Green**: #00ff88 (success)
- **Accent Red**: #ff0055 (errors)

### Typography
- **Headings**: Segoe UI / System UI
- **Code**: Monospace for data
- **Icons**: Unicode emoji for visual appeal

---

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Current statistics
- `GET /api/dashboard/host-groups` - Group summary
- `GET /api/dashboard/top-consumers` - Top resource users

### Hosts
- `GET /api/hosts` - List all hosts
- `GET /api/hosts/:id` - Get host details
- `POST /api/hosts` - Add new host (admin only)
- `PUT /api/hosts/:id` - Update host (admin only)
- `DELETE /api/hosts/:id` - Delete host (admin only)

### Problems
- `GET /api/problems` - List all problems
- `POST /api/problems/:id/acknowledge` - Acknowledge problem
- `POST /api/problems/:id/resolve` - Resolve problem

### Metrics
- `GET /api/metrics/history` - Historical metrics
- `GET /api/metrics/aggregated` - Aggregated data
- `GET /api/graphs/configs` - Graph configurations

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/audit-log` - View audit log
- `GET /api/admin/system-settings` - System settings

---

## 🌐 WebSocket Events

### Client → Server
- Connection established automatically on login

### Server → Client
- `stats_update`: Real-time statistics (every 5s)
- `graph_rotation`: Graph rotation signal (every 60s)

---

## 🛠️ Troubleshooting

### Problem: "npm is not recognized"
**Solution**: Install Node.js from [nodejs.org](https://nodejs.org/)

### Problem: "Port 3001 already in use"
**Windows**:
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
lsof -ti:3001 | xargs kill -9
```

### Problem: "Cannot connect to WebSocket"
**Solution**:
1. Check port 8080 is not blocked by firewall
2. Verify server logs show "WebSocket running"
3. Try restarting the server

### Problem: "Invalid credentials"
**Check**:
- Username: `admin` (lowercase)
- Password: `Admin@2024!` (exact case)
- No extra spaces

### Problem: "Graphs not rotating"
**Solution**:
1. Check browser console for errors (F12)
2. Verify WebSocket connection is active
3. Hard refresh (Ctrl+Shift+R)

### Problem: "Database error"
**Solution**:
1. Delete `zabbix_dashboard.db` file
2. Restart server (database will rebuild)
3. Fresh data will be generated

---

## 📈 Performance Tips

1. **Browser**: Use Chrome or Firefox for best performance
2. **Hardware**: 2GB RAM recommended for smooth operation
3. **Network**: Low latency network for WebSocket
4. **Database**: SQLite automatically optimizes queries
5. **Cleanup**: Old metrics auto-deleted after 24 hours

---

## 🔒 Security Recommendations

1. **Change Default Passwords**: Update all user passwords
2. **Use HTTPS**: Deploy behind reverse proxy with SSL
3. **Firewall**: Restrict access to trusted networks
4. **Regular Backups**: Backup database regularly
5. **Update Dependencies**: Run `npm audit fix` periodically
6. **Strong Passwords**: Enforce 12+ character passwords
7. **Session Timeout**: Configure appropriate timeout

---

## 🚀 Deployment

### Development
```bash
npm start
```

### Production (with PM2)
```bash
npm install -g pm2
pm2 start zabbix-server.js --name zabbix-dashboard
pm2 save
pm2 startup
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001 8080
CMD ["node", "zabbix-server.js"]
```

```bash
docker build -t zabbix-dashboard .
docker run -d -p 3001:3001 -p 8080:8080 zabbix-dashboard
```

---

## 📝 Changelog

### Version 3.0.0 (Current)
- ✅ Zoom-in login animation
- ✅ Automatic graph rotation (60s)
- ✅ Admin-only user/host creation
- ✅ Enhanced UI/UX with animations
- ✅ Real-time WebSocket updates
- ✅ Comprehensive audit logging
- ✅ 20 pre-configured hosts
- ✅ SQLite database with auto-init
- ✅ Role-based access control
- ✅ Responsive design

### Version 2.0.0
- Enhanced SOC dashboard
- Live analytics
- MITRE ATT&CK mapping

### Version 1.0.0
- Initial release
- Basic monitoring

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 💬 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](#)
- **Email**: support@zabbix-dashboard.local
- **Documentation**: Check SETUP_GUIDE.md

---

## 🎯 Roadmap

### Planned Features
- [ ] Email notifications for critical problems
- [ ] SMS alerting integration
- [ ] Custom dashboard widgets
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Export reports to PDF
- [ ] Integration with external Zabbix API
- [ ] Mobile app companion
- [ ] Advanced filtering and search
- [ ] Custom graph builder

---

## ⭐ Credits

Developed with ❤️ by the Zabbix Dashboard Team

**Technologies Used**:
- Node.js & Express
- SQLite Database
- WebSocket (ws)
- Chart.js
- JWT Authentication
- bcryptjs Encryption

---

**Happy Monitoring! 🔷**
