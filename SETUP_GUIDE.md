# 📘 Complete Setup Guide - Zabbix Monitoring Dashboard v3.0

**Step-by-step instructions for setting up your monitoring dashboard**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [First Run](#first-run)
4. [User Guide](#user-guide)
5. [Admin Guide](#admin-guide)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Topics](#advanced-topics)

---

## 1. Prerequisites

### Required Software
- **Node.js** v14.0.0 or higher
  - Download from: https://nodejs.org/
  - Recommended: LTS (Long Term Support) version
  - Verify: `node --version`

- **NPM** v6.0.0 or higher
  - Comes with Node.js
  - Verify: `npm --version`

### System Requirements
- **OS**: Windows 10/11, macOS 10.14+, Linux (Ubuntu 20.04+)
- **RAM**: 512 MB minimum, 2 GB recommended
- **Disk**: 200 MB for application and database
- **Ports**: 3001 (HTTP) and 8080 (WebSocket) must be available
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+

---

## 2. Installation

### Option A: Quick Start (Automated)

#### Windows
1. Open the project folder
2. Double-click `start.bat`
3. Wait for "Server running" message
4. Open browser to http://localhost:3001

#### Linux/Mac
1. Open terminal in project folder
2. Run: `chmod +x start.sh && ./start.sh`
3. Wait for "Server running" message
4. Open browser to http://localhost:3001

### Option B: Manual Installation

#### Step 1: Extract Files
```bash
# Navigate to project directory
cd zabbix-dashboard
```

#### Step 2: Install Dependencies
```bash
npm install
```

Expected output:
```
added 50 packages in 5s
```

#### Step 3: Start Server
```bash
npm start
```

Expected output:
```
╔════════════════════════════════════════════════════╗
║   📊 ZABBIX MONITORING DASHBOARD v3.0             ║
╚════════════════════════════════════════════════════╝

✅ HTTP Server: http://localhost:3001
✅ WebSocket Server: ws://localhost:8080

🔐 Default Login:
   Username: admin
   Password: Admin@2024!
```

#### Step 4: Open Dashboard
1. Open your browser
2. Navigate to: `http://localhost:3001`
3. You should see the login screen

---

## 3. First Run

### Login Process

1. **Enter Credentials**
   - Username: `admin`
   - Password: `Admin@2024!`

2. **Watch the Animation**
   - Login screen fades out
   - Dashboard zooms in
   - Stats cards slide up
   - Charts animate in

3. **Verify Dashboard**
   - Check stats show numbers (not zeros)
   - Verify graphs are displaying
   - Confirm live indicator is green

### What You Should See

#### Overview Tab
- **Stats Cards**:
  - Total Hosts: 20
  - Critical Problems: (number)
  - Avg CPU Usage: (percentage)
  - Avg Memory Usage: (percentage)

- **Rotating Charts**:
  - Two charts that update every 60 seconds
  - Countdown timer showing rotation time
  - Live data badge

- **Recent Problems Table**:
  - Latest 10 problems
  - Color-coded severity badges
  - Acknowledge buttons

#### Navigation Tabs
- 📊 Overview (default)
- 💻 Hosts
- 🚨 Problems
- 📈 Graphs
- 👥 Admin (admin only)

---

## 4. User Guide

### Overview Tab

**Purpose**: High-level dashboard with key metrics

**Features**:
- Real-time statistics (updates every 5 seconds)
- Auto-rotating graphs (60-second cycle)
- Recent problems list
- Live data indicator

**Actions**:
- View current system status
- Monitor critical problems
- Acknowledge urgent issues

### Hosts Tab

**Purpose**: Complete list of monitored systems

**Columns**:
- Hostname
- IP Address
- Host Group
- Status (Enabled/Disabled)
- CPU Usage (%)
- Memory Usage (%)
- Disk Usage (%)
- Availability (Available/Unavailable)
- Actions (admin only)

**Actions (Admin Only)**:
- Add new hosts
- Delete hosts
- View host details

### Problems Tab

**Purpose**: Detailed problem tracking

**Columns**:
- Time (when problem occurred)
- Host (affected system)
- Problem (description)
- Severity (Critical/High/Average/Warning/Information)
- Description (detailed info)
- Status (PROBLEM/RESOLVED)
- Actions

**Actions**:
- Acknowledge problems
- View problem history
- Track resolution

### Graphs Tab

**Purpose**: Detailed metric visualization

**Available Charts**:
1. System CPU Usage (last 2 hours)
2. Memory Utilization (last 2 hours)
3. Network Traffic (last 2 hours)
4. Problems by Severity (current)

**Features**:
- Interactive tooltips
- Zoom functionality
- Export options (right-click)

### Admin Tab (Admin Only)

**Purpose**: User and system management

**Sections**:

1. **User Management**
   - View all users
   - Create new users
   - Delete non-admin users
   - Track last login times

2. **Audit Log**
   - View all admin actions
   - Track who did what
   - See source IP addresses

---

## 5. Admin Guide

### User Management

#### Creating a New User

1. Click "👥 Admin" tab
2. Click "+ Add User" button
3. Fill in the form:
   - Username (unique, no spaces)
   - Password (8+ characters)
   - Full Name
   - Email address
   - Role (Analyst or Viewer)
4. Click "Create User"

**⚠️ Important**: Only admin users can create accounts!

#### User Roles Explained

| Role | Permissions |
|------|-------------|
| **Admin** | • Full access<br>• Create/delete users<br>• Add/remove hosts<br>• Acknowledge problems<br>• View all data |
| **Analyst** | • View all data<br>• Acknowledge problems<br>• Cannot create users/hosts |
| **Viewer** | • Read-only access<br>• View dashboards<br>• Cannot make changes |

#### Deleting a User

1. Find user in table
2. Click "Delete" button
3. Confirm deletion
4. User is permanently removed

**⚠️ Note**: Cannot delete the super admin account!

### Host Management

#### Adding a New Host

1. Click "💻 Hosts" tab
2. Click "+ Add Host" button
3. Fill in the form:
   - **Hostname** (required): Server name
   - **IP Address** (required): IPv4 address
   - **DNS Name**: Fully qualified domain name
   - **Host Group**: Category (Web/DB/App/etc.)
   - **Operating System**: OS name and version
   - **Location**: Physical/virtual location
   - **Department**: Organizational unit
4. Click "Add Host"

**Example**:
```
Hostname: WEB-PROD-04
IP Address: 192.168.1.13
DNS Name: web04.prod.local
Host Group: Web Servers
OS: Ubuntu 22.04 LTS
Location: Data Center A
Department: Web Services
```

#### Deleting a Host

1. Find host in table
2. Click "Delete" button
3. Confirm deletion
4. Host and all associated data removed

### Audit Log

**What's Logged**:
- User login/logout
- User creation/deletion
- Host creation/deletion
- Problem acknowledgments
- Setting changes

**Information Captured**:
- Timestamp (exact date/time)
- Username (who performed action)
- Action (what was done)
- Entity Type (user/host/problem)
- Details (additional info)
- IP Address (source location)

---

## 6. Configuration

### Changing Server Port

Edit `zabbix-server.js`:
```javascript
const PORT = 3001; // Change to your desired port
```

### Changing WebSocket Port

Edit `zabbix-server.js`:
```javascript
const WS_PORT = 8080; // Change to your desired port
```

Also update in `zabbix-index.html`:
```javascript
const WS_URL = 'ws://localhost:8080'; // Match server port
```

### Graph Rotation Interval

Edit `zabbix-index.html`:
```javascript
const GRAPH_ROTATION_INTERVAL = 60000; // Time in milliseconds
```

Examples:
- 30 seconds: `30000`
- 60 seconds: `60000` (default)
- 2 minutes: `120000`

### Database Location

Default: `./zabbix_dashboard.db` (same folder as server)

To change, edit `zabbix-server.js`:
```javascript
const db = new sqlite3.Database('./custom/path/zabbix.db');
```

---

## 7. Troubleshooting

### Installation Issues

#### Problem: "npm is not recognized"
**Cause**: Node.js not installed or not in PATH

**Solution**:
1. Download Node.js from https://nodejs.org/
2. Run installer with default options
3. Restart terminal/command prompt
4. Verify: `node --version`

#### Problem: "npm install" fails
**Cause**: Network issues or permissions

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If on Linux/Mac with permission errors:
sudo npm install
```

### Runtime Issues

#### Problem: "Port 3001 already in use"
**Cause**: Another application using the port

**Solution Windows**:
```cmd
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID 1234 /F
```

**Solution Linux/Mac**:
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

#### Problem: "Cannot connect to database"
**Cause**: Database file corrupted

**Solution**:
1. Stop server (Ctrl+C)
2. Delete `zabbix_dashboard.db`
3. Restart server
4. Database will be recreated with fresh data

#### Problem: "WebSocket connection failed"
**Cause**: Port 8080 blocked or in use

**Solution**:
1. Check firewall settings
2. Verify port 8080 is available
3. Try different WebSocket port (see Configuration)

### Display Issues

#### Problem: Graphs not showing
**Cause**: Chart.js not loaded or JavaScript error

**Solution**:
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Clear browser cache
3. Check browser console (F12) for errors
4. Try different browser

#### Problem: Graphs not rotating
**Cause**: WebSocket disconnected or JavaScript error

**Solution**:
1. Check server logs for WebSocket connection
2. Verify browser console (F12) shows "WebSocket connected"
3. Check network tab for WebSocket frames
4. Refresh page

#### Problem: Login animation not working
**Cause**: CSS transitions disabled

**Solution**:
1. Enable hardware acceleration in browser
2. Update graphics drivers
3. Try different browser
4. Disable browser extensions

### Performance Issues

#### Problem: Dashboard slow/laggy
**Cause**: Too many metrics or slow computer

**Solution**:
1. Close unused browser tabs
2. Increase available RAM
3. Reduce metric retention (see Advanced Topics)
4. Use lighter browser theme

#### Problem: High CPU usage
**Cause**: Continuous WebSocket updates

**Solution**:
1. Increase update intervals in code
2. Reduce number of charts
3. Disable graph auto-rotation
4. Use production mode (minimize updates)

---

## 8. Advanced Topics

### Running in Production

#### Using PM2 Process Manager

Install PM2:
```bash
npm install -g pm2
```

Start application:
```bash
pm2 start zabbix-server.js --name zabbix-dashboard
```

Configure auto-start:
```bash
pm2 startup
pm2 save
```

Monitor:
```bash
pm2 status
pm2 logs zabbix-dashboard
pm2 monit
```

#### Using Nginx Reverse Proxy

Install Nginx, then configure:

```nginx
server {
    listen 80;
    server_name monitoring.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### SSL/HTTPS Setup

For production, always use HTTPS:

1. Get SSL certificate (Let's Encrypt, etc.)
2. Configure Nginx with SSL
3. Force HTTPS redirect
4. Update WebSocket to WSS

Example Nginx SSL:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... rest of config
}
```

### Database Backup

#### Manual Backup
```bash
# Stop server
# Copy database file
cp zabbix_dashboard.db zabbix_dashboard_backup_$(date +%Y%m%d).db
```

#### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp zabbix_dashboard.db $BACKUP_DIR/zabbix_$DATE.db
# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

Run daily with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Customizing Metrics

To add custom metrics, modify `zabbix-server.js`:

```javascript
// In insertSampleData function, add more metrics:
db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
        VALUES (?, 'custom', 'Custom Metric', ?, ?)`, 
        [hostId, customValue, timestamp]);
```

### Integration with Real Zabbix

To connect to actual Zabbix server:

1. Install Zabbix API client:
```bash
npm install zabbix-promise
```

2. Configure connection:
```javascript
const Zabbix = require('zabbix-promise');
const zabbix = new Zabbix({
    url: 'http://zabbix-server/api_jsonrpc.php',
    user: 'admin',
    password: 'password'
});
```

3. Fetch real data:
```javascript
async function fetchRealHosts() {
    await zabbix.login();
    const hosts = await zabbix.host.get({
        output: ['hostid', 'host', 'status']
    });
    // Store in database
}
```

---

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Server starts without errors
- [ ] Can access http://localhost:3001
- [ ] Login screen appears
- [ ] Can login with admin/Admin@2024!
- [ ] Dashboard zooms in on login
- [ ] Stats show numbers (not 0)
- [ ] Graphs display data
- [ ] Graphs rotate every 60 seconds
- [ ] WebSocket shows "connected" in console
- [ ] Recent problems table populated
- [ ] Can switch between tabs
- [ ] Admin tab visible (admin user)
- [ ] Can add new user (admin only)
- [ ] Can add new host (admin only)
- [ ] Audit log shows actions
- [ ] Can logout successfully

---

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check Logs**: Server console shows detailed error messages
2. **Browser Console**: Press F12 to see client-side errors
3. **Search Issues**: Check if others had same problem
4. **Ask for Help**: Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Server logs
   - Browser console output
   - System info (OS, Node version)

---

**Setup complete! Enjoy your monitoring dashboard! 🎉**
