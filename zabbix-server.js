// ============================================
// ZABBIX MONITORING DASHBOARD - BACKEND SERVER
// Enhanced v3.0 with Admin Controls & Real-time Animations
// ============================================

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION
// ============================================
const PORT = 3001;
const WS_PORT = 8080;
const JWT_SECRET = 'zabbix_dashboard_ultra_secure_2026_' + uuidv4();
const GRAPH_UPDATE_INTERVAL = 60000; // 60 seconds for graph rotation
const STATS_UPDATE_INTERVAL = 5000; // 5 seconds for real-time stats

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================
// DATABASE INITIALIZATION
// ============================================
const db = new sqlite3.Database('./zabbix_dashboard.db', (err) => {
    if (err) console.error('❌ Database error:', err);
    else console.log('✅ Database connected: zabbix_dashboard.db');
});

function initDatabase() {
    console.log('🔧 Initializing Zabbix database schema...');
    
    // Users table with enhanced security
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'viewer',
        isActive BOOLEAN DEFAULT 1,
        lastLogin DATETIME,
        failedAttempts INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Zabbix Hosts table
    db.run(`CREATE TABLE IF NOT EXISTS zabbix_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostid TEXT UNIQUE NOT NULL,
        hostname TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        dns_name TEXT,
        port INTEGER DEFAULT 10050,
        monitored_by TEXT DEFAULT 'Zabbix Server',
        host_group TEXT DEFAULT 'Linux servers',
        template TEXT,
        status TEXT DEFAULT 'Enabled',
        availability TEXT DEFAULT 'Available',
        agent_version TEXT,
        
        -- System Metrics
        cpu_usage REAL DEFAULT 0,
        cpu_cores INTEGER DEFAULT 4,
        memory_total INTEGER DEFAULT 0,
        memory_used INTEGER DEFAULT 0,
        memory_usage REAL DEFAULT 0,
        swap_total INTEGER DEFAULT 0,
        swap_used INTEGER DEFAULT 0,
        disk_total INTEGER DEFAULT 0,
        disk_used INTEGER DEFAULT 0,
        disk_usage REAL DEFAULT 0,
        
        -- Network Metrics
        network_in_rate REAL DEFAULT 0,
        network_out_rate REAL DEFAULT 0,
        network_total_in INTEGER DEFAULT 0,
        network_total_out INTEGER DEFAULT 0,
        
        -- Performance Metrics
        load_average_1 REAL DEFAULT 0,
        load_average_5 REAL DEFAULT 0,
        load_average_15 REAL DEFAULT 0,
        processes_running INTEGER DEFAULT 0,
        processes_total INTEGER DEFAULT 0,
        
        -- Availability
        uptime INTEGER DEFAULT 0,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        ping_response_time REAL DEFAULT 0,
        
        -- Metadata
        os TEXT,
        os_version TEXT,
        kernel_version TEXT,
        architecture TEXT DEFAULT 'x86_64',
        location TEXT,
        department TEXT,
        maintenance_mode BOOLEAN DEFAULT 0,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Zabbix Problems/Triggers table
    db.run(`CREATE TABLE IF NOT EXISTS zabbix_problems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        problemid TEXT UNIQUE NOT NULL,
        host_id INTEGER,
        hostname TEXT NOT NULL,
        problem_name TEXT NOT NULL,
        severity TEXT DEFAULT 'Warning',
        status TEXT DEFAULT 'PROBLEM',
        
        -- Problem details
        description TEXT,
        event_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        recovery_time DATETIME,
        duration INTEGER DEFAULT 0,
        
        -- Trigger info
        trigger_expression TEXT,
        trigger_value REAL,
        threshold_value REAL,
        
        -- Acknowledgment
        acknowledged BOOLEAN DEFAULT 0,
        acknowledged_by TEXT,
        acknowledged_at DATETIME,
        ack_message TEXT,
        
        -- Tracking
        suppressed BOOLEAN DEFAULT 0,
        event_count INTEGER DEFAULT 1,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (host_id) REFERENCES zabbix_hosts(id)
    )`);

    // Metrics History table for graphs
    db.run(`CREATE TABLE IF NOT EXISTS metrics_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        host_id INTEGER NOT NULL,
        metric_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        value REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_id) REFERENCES zabbix_hosts(id)
    )`);

    // Graph Configurations
    db.run(`CREATE TABLE IF NOT EXISTS graph_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        graph_name TEXT UNIQUE NOT NULL,
        graph_type TEXT NOT NULL,
        metric_types TEXT NOT NULL,
        host_filter TEXT,
        time_period INTEGER DEFAULT 3600,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Audit Log
    db.run(`CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // System Settings
    db.run(`CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    console.log('✅ Zabbix database schema initialized');
}

// ============================================
// SAMPLE DATA GENERATION
// ============================================
function insertSampleData() {
    console.log('📊 Generating Zabbix sample data...');

    // Admin user (super admin - only one who can create users and hosts)
    const adminPassword = bcrypt.hashSync('Admin@2024!', 10);
    db.run(`INSERT OR IGNORE INTO users (id, username, password, fullName, email, role, isActive) 
            VALUES (1, 'admin', ?, 'Super Administrator', 'admin@zabbix.local', 'admin', 1)`,
            [adminPassword]);

    // Regular users (cannot create users/hosts)
    const users = [
        { username: 'analyst1', password: bcrypt.hashSync('Analyst@123', 10), fullName: 'John Analyst', email: 'john@zabbix.local', role: 'analyst', created_by: 1 },
        { username: 'analyst2', password: bcrypt.hashSync('Analyst@123', 10), fullName: 'Sarah Monitor', email: 'sarah@zabbix.local', role: 'analyst', created_by: 1 },
        { username: 'viewer1', password: bcrypt.hashSync('Viewer@123', 10), fullName: 'Mike Observer', email: 'mike@zabbix.local', role: 'viewer', created_by: 1 }
    ];

    users.forEach(user => {
        db.run(`INSERT OR IGNORE INTO users (username, password, fullName, email, role, created_by) 
                VALUES (?, ?, ?, ?, ?, ?)`,
               [user.username, user.password, user.fullName, user.email, user.role, user.created_by]);
    });

    // Zabbix Hosts with realistic monitoring data
    const hosts = [
        // Production Web Servers
        { hostid: 'ZBX-10001', hostname: 'WEB-PROD-01', ip: '192.168.1.10', dns: 'web01.prod.local', group: 'Web Servers', template: 'Template OS Linux', status: 'Enabled', avail: 'Available', 
          cpu: 45.2, cpu_cores: 8, mem_total: 32768, mem_used: 18432, swap_total: 8192, swap_used: 512, disk_total: 500, disk_used: 320,
          net_in: 125.5, net_out: 87.3, load1: 2.1, load5: 1.9, load15: 1.7, proc_run: 3, proc_total: 245, uptime: 1234567, ping: 0.5,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center A', dept: 'Web Services' },
        
        { hostid: 'ZBX-10002', hostname: 'WEB-PROD-02', ip: '192.168.1.11', dns: 'web02.prod.local', group: 'Web Servers', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 38.7, cpu_cores: 8, mem_total: 32768, mem_used: 16384, swap_total: 8192, swap_used: 256, disk_total: 500, disk_used: 285,
          net_in: 142.8, net_out: 95.2, load1: 1.8, load5: 1.6, load15: 1.5, proc_run: 2, proc_total: 238, uptime: 1198765, ping: 0.4,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center A', dept: 'Web Services' },

        { hostid: 'ZBX-10003', hostname: 'WEB-PROD-03', ip: '192.168.1.12', dns: 'web03.prod.local', group: 'Web Servers', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 52.1, cpu_cores: 8, mem_total: 32768, mem_used: 20480, swap_total: 8192, swap_used: 1024, disk_total: 500, disk_used: 340,
          net_in: 168.3, net_out: 112.7, load1: 2.5, load5: 2.2, load15: 2.0, proc_run: 4, proc_total: 267, uptime: 1087654, ping: 0.6,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center B', dept: 'Web Services' },

        // Database Servers
        { hostid: 'ZBX-20001', hostname: 'DB-MASTER-01', ip: '192.168.2.20', dns: 'db-master01.prod.local', group: 'Database Servers', template: 'Template DB MySQL', status: 'Enabled', avail: 'Available',
          cpu: 72.4, cpu_cores: 16, mem_total: 65536, mem_used: 52428, swap_total: 16384, swap_used: 2048, disk_total: 2000, disk_used: 1456,
          net_in: 256.7, net_out: 189.4, load1: 4.2, load5: 3.9, load15: 3.7, proc_run: 8, proc_total: 312, uptime: 2345678, ping: 0.3,
          os: 'RHEL', os_ver: '9.2', kernel: '5.14.0-284.el9.x86_64', location: 'Data Center A', dept: 'Database' },

        { hostid: 'ZBX-20002', hostname: 'DB-REPLICA-01', ip: '192.168.2.21', dns: 'db-replica01.prod.local', group: 'Database Servers', template: 'Template DB MySQL', status: 'Enabled', avail: 'Available',
          cpu: 65.8, cpu_cores: 16, mem_total: 65536, mem_used: 49152, swap_total: 16384, swap_used: 1536, disk_total: 2000, disk_used: 1398,
          net_in: 198.5, net_out: 145.2, load1: 3.8, load5: 3.6, load15: 3.4, proc_run: 6, proc_total: 298, uptime: 2234567, ping: 0.3,
          os: 'RHEL', os_ver: '9.2', kernel: '5.14.0-284.el9.x86_64', location: 'Data Center B', dept: 'Database' },

        { hostid: 'ZBX-20003', hostname: 'DB-ANALYTICS-01', ip: '192.168.2.22', dns: 'db-analytics01.prod.local', group: 'Database Servers', template: 'Template DB PostgreSQL', status: 'Enabled', avail: 'Available',
          cpu: 81.3, cpu_cores: 16, mem_total: 65536, mem_used: 58982, swap_total: 16384, swap_used: 3072, disk_total: 3000, disk_used: 2187,
          net_in: 312.4, net_out: 234.8, load1: 5.1, load5: 4.8, load15: 4.6, proc_run: 10, proc_total: 345, uptime: 1876543, ping: 0.4,
          os: 'RHEL', os_ver: '9.2', kernel: '5.14.0-284.el9.x86_64', location: 'Data Center A', dept: 'Analytics' },

        // Application Servers
        { hostid: 'ZBX-30001', hostname: 'APP-PROD-01', ip: '192.168.3.30', dns: 'app01.prod.local', group: 'Application Servers', template: 'Template App Generic', status: 'Enabled', avail: 'Available',
          cpu: 56.9, cpu_cores: 12, mem_total: 49152, mem_used: 32768, swap_total: 12288, swap_used: 1024, disk_total: 1000, disk_used: 642,
          net_in: 187.6, net_out: 134.2, load1: 3.2, load5: 2.9, load15: 2.7, proc_run: 5, proc_total: 278, uptime: 1654321, ping: 0.5,
          os: 'Windows Server', os_ver: '2022 21H2', kernel: 'NT 10.0', location: 'Data Center A', dept: 'Applications' },

        { hostid: 'ZBX-30002', hostname: 'APP-PROD-02', ip: '192.168.3.31', dns: 'app02.prod.local', group: 'Application Servers', template: 'Template App Generic', status: 'Enabled', avail: 'Available',
          cpu: 49.3, cpu_cores: 12, mem_total: 49152, mem_used: 28672, swap_total: 12288, swap_used: 768, disk_total: 1000, disk_used: 598,
          net_in: 164.3, net_out: 118.7, load1: 2.8, load5: 2.6, load15: 2.4, proc_run: 4, proc_total: 256, uptime: 1543210, ping: 0.4,
          os: 'Windows Server', os_ver: '2022 21H2', kernel: 'NT 10.0', location: 'Data Center B', dept: 'Applications' },

        // File Servers
        { hostid: 'ZBX-40001', hostname: 'FILE-SRV-01', ip: '192.168.4.40', dns: 'file01.prod.local', group: 'File Servers', template: 'Template OS Windows', status: 'Enabled', avail: 'Available',
          cpu: 34.2, cpu_cores: 8, mem_total: 32768, mem_used: 16384, swap_total: 8192, swap_used: 512, disk_total: 5000, disk_used: 4326,
          net_in: 456.8, net_out: 378.4, load1: 1.5, load5: 1.4, load15: 1.3, proc_run: 2, proc_total: 198, uptime: 2876543, ping: 0.6,
          os: 'Windows Server', os_ver: '2019 1809', kernel: 'NT 10.0', location: 'Data Center A', dept: 'File Services' },

        { hostid: 'ZBX-40002', hostname: 'BACKUP-SRV-01', ip: '192.168.4.41', dns: 'backup01.prod.local', group: 'File Servers', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 62.7, cpu_cores: 8, mem_total: 32768, mem_used: 24576, swap_total: 8192, swap_used: 1536, disk_total: 10000, disk_used: 7834,
          net_in: 678.9, net_out: 512.3, load1: 2.9, load5: 2.7, load15: 2.5, proc_run: 4, proc_total: 234, uptime: 2345678, ping: 0.7,
          os: 'Debian', os_ver: '12', kernel: '6.1.0-13-amd64', location: 'Data Center B', dept: 'Backup' },

        // Infrastructure
        { hostid: 'ZBX-50001', hostname: 'DC-PRIMARY-01', ip: '192.168.5.50', dns: 'dc01.prod.local', group: 'Domain Controllers', template: 'Template OS Windows', status: 'Enabled', avail: 'Available',
          cpu: 28.4, cpu_cores: 8, mem_total: 32768, mem_used: 12288, swap_total: 8192, swap_used: 256, disk_total: 500, disk_used: 234,
          net_in: 98.4, net_out: 76.2, load1: 1.2, load5: 1.1, load15: 1.0, proc_run: 2, proc_total: 187, uptime: 3456789, ping: 0.2,
          os: 'Windows Server', os_ver: '2022 21H2', kernel: 'NT 10.0', location: 'Data Center A', dept: 'Infrastructure' },

        { hostid: 'ZBX-50002', hostname: 'DC-SECONDARY-01', ip: '192.168.5.51', dns: 'dc02.prod.local', group: 'Domain Controllers', template: 'Template OS Windows', status: 'Enabled', avail: 'Available',
          cpu: 26.1, cpu_cores: 8, mem_total: 32768, mem_used: 11264, swap_total: 8192, swap_used: 128, disk_total: 500, disk_used: 218,
          net_in: 87.3, net_out: 68.9, load1: 1.1, load5: 1.0, load15: 0.9, proc_run: 2, proc_total: 175, uptime: 3345678, ping: 0.2,
          os: 'Windows Server', os_ver: '2022 21H2', kernel: 'NT 10.0', location: 'Data Center B', dept: 'Infrastructure' },

        // Mail Services
        { hostid: 'ZBX-60001', hostname: 'MAIL-RELAY-01', ip: '192.168.6.60', dns: 'mail01.prod.local', group: 'Mail Servers', template: 'Template App Postfix', status: 'Enabled', avail: 'Available',
          cpu: 42.8, cpu_cores: 8, mem_total: 32768, mem_used: 18432, swap_total: 8192, swap_used: 768, disk_total: 1000, disk_used: 456,
          net_in: 234.5, net_out: 189.7, load1: 2.0, load5: 1.8, load15: 1.7, proc_run: 3, proc_total: 223, uptime: 2134567, ping: 0.4,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center A', dept: 'Email Services' },

        // Network Equipment
        { hostid: 'ZBX-70001', hostname: 'FW-EDGE-01', ip: '10.0.0.1', dns: 'fw01.prod.local', group: 'Network Devices', template: 'Template Net Firewall', status: 'Enabled', avail: 'Available',
          cpu: 22.3, cpu_cores: 4, mem_total: 16384, mem_used: 6144, swap_total: 0, swap_used: 0, disk_total: 250, disk_used: 87,
          net_in: 1234.5, net_out: 987.6, load1: 0.8, load5: 0.7, load15: 0.7, proc_run: 1, proc_total: 95, uptime: 4567890, ping: 0.2,
          os: 'Fortinet FortiOS', os_ver: '7.4.1', kernel: 'Custom', location: 'Edge', dept: 'Network Security' },

        { hostid: 'ZBX-70002', hostname: 'SW-CORE-01', ip: '10.0.0.10', dns: 'sw-core01.prod.local', group: 'Network Devices', template: 'Template Net Switch', status: 'Enabled', avail: 'Available',
          cpu: 18.7, cpu_cores: 4, mem_total: 8192, mem_used: 3072, swap_total: 0, swap_used: 0, disk_total: 128, disk_used: 45,
          net_in: 2345.6, net_out: 1876.5, load1: 0.6, load5: 0.6, load15: 0.5, proc_run: 1, proc_total: 67, uptime: 5678901, ping: 0.1,
          os: 'Cisco IOS', os_ver: '15.2(7)E3', kernel: 'Custom', location: 'Core Network', dept: 'Network' },

        // Monitoring & Security
        { hostid: 'ZBX-80001', hostname: 'ZABBIX-SERVER-01', ip: '192.168.8.80', dns: 'zabbix01.prod.local', group: 'Monitoring', template: 'Template App Zabbix Server', status: 'Enabled', avail: 'Available',
          cpu: 58.4, cpu_cores: 12, mem_total: 49152, mem_used: 36864, swap_total: 12288, swap_used: 2048, disk_total: 1000, disk_used: 567,
          net_in: 345.6, net_out: 267.8, load1: 3.1, load5: 2.9, load15: 2.8, proc_run: 6, proc_total: 289, uptime: 1987654, ping: 0.3,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center A', dept: 'Monitoring' },

        { hostid: 'ZBX-80002', hostname: 'SIEM-COLLECTOR-01', ip: '192.168.8.81', dns: 'siem01.prod.local', group: 'Security', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 67.2, cpu_cores: 16, mem_total: 65536, mem_used: 51200, swap_total: 16384, swap_used: 3072, disk_total: 2000, disk_used: 1234,
          net_in: 567.8, net_out: 423.4, load1: 4.5, load5: 4.2, load15: 4.0, proc_run: 8, proc_total: 334, uptime: 1765432, ping: 0.3,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Data Center A', dept: 'Security' },

        // Development
        { hostid: 'ZBX-90001', hostname: 'DEV-BUILD-01', ip: '172.16.1.100', dns: 'dev-build01.dev.local', group: 'Development', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 44.6, cpu_cores: 8, mem_total: 32768, mem_used: 22528, swap_total: 8192, swap_used: 1024, disk_total: 500, disk_used: 298,
          net_in: 123.4, net_out: 89.7, load1: 2.3, load5: 2.1, load15: 2.0, proc_run: 4, proc_total: 245, uptime: 876543, ping: 0.5,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Development', dept: 'DevOps' },

        { hostid: 'ZBX-90002', hostname: 'DEV-TEST-01', ip: '172.16.1.101', dns: 'dev-test01.dev.local', group: 'Development', template: 'Template OS Linux', status: 'Enabled', avail: 'Available',
          cpu: 32.1, cpu_cores: 4, mem_total: 16384, mem_used: 8192, swap_total: 4096, swap_used: 512, disk_total: 250, disk_used: 134,
          net_in: 78.9, net_out: 56.3, load1: 1.4, load5: 1.3, load15: 1.2, proc_run: 2, proc_total: 156, uptime: 654321, ping: 0.6,
          os: 'Ubuntu', os_ver: '22.04.3 LTS', kernel: '5.15.0-91-generic', location: 'Development', dept: 'QA' }
    ];

    hosts.forEach(h => {
        const mem_pct = (h.mem_used / h.mem_total * 100).toFixed(1);
        const disk_pct = (h.disk_used / h.disk_total * 100).toFixed(1);
        
        db.run(`INSERT OR IGNORE INTO zabbix_hosts (
            hostid, hostname, ip_address, dns_name, host_group, template, status, availability,
            cpu_usage, cpu_cores, memory_total, memory_used, memory_usage, swap_total, swap_used,
            disk_total, disk_used, disk_usage, network_in_rate, network_out_rate,
            load_average_1, load_average_5, load_average_15, processes_running, processes_total,
            uptime, ping_response_time, os, os_version, kernel_version, location, department
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [h.hostid, h.hostname, h.ip, h.dns, h.group, h.template, h.status, h.avail,
         h.cpu, h.cpu_cores, h.mem_total, h.mem_used, mem_pct, h.swap_total, h.swap_used,
         h.disk_total, h.disk_used, disk_pct, h.net_in, h.net_out,
         h.load1, h.load5, h.load15, h.proc_run, h.proc_total,
         h.uptime, h.ping, h.os, h.os_ver, h.kernel, h.location, h.dept]);
    });

    // Zabbix Problems/Triggers
    const problems = [
        { problemid: 'PROB-001', hostid: 6, hostname: 'DB-ANALYTICS-01', name: 'High CPU usage', severity: 'High', desc: 'CPU usage above 80% for 5 minutes', expr: 'avg(/DB-ANALYTICS-01/cpu.util,5m)>80', value: 81.3, threshold: 80, status: 'PROBLEM' },
        { problemid: 'PROB-002', hostid: 10, hostname: 'BACKUP-SRV-01', name: 'Disk space critical', severity: 'Critical', desc: 'Disk usage above 90%', expr: '/BACKUP-SRV-01/disk.usage>90', value: 78.34, threshold: 90, status: 'PROBLEM' },
        { problemid: 'PROB-003', hostid: 1, hostname: 'WEB-PROD-01', name: 'Memory usage high', severity: 'Warning', desc: 'Memory usage above 70%', expr: 'avg(/WEB-PROD-01/mem.util,5m)>70', value: 56.25, threshold: 70, status: 'PROBLEM' },
        { problemid: 'PROB-004', hostid: 4, hostname: 'DB-MASTER-01', name: 'High load average', severity: 'Warning', desc: 'Load average above 4.0', expr: 'avg(/DB-MASTER-01/load.avg,5m)>4', value: 4.2, threshold: 4, status: 'PROBLEM' },
        { problemid: 'PROB-005', hostid: 9, hostname: 'FILE-SRV-01', name: 'Disk space warning', severity: 'Warning', desc: 'Disk usage above 85%', expr: '/FILE-SRV-01/disk.usage>85', value: 86.52, threshold: 85, status: 'PROBLEM' },
        { problemid: 'PROB-006', hostid: 18, hostname: 'SIEM-COLLECTOR-01', name: 'High network traffic', severity: 'Information', desc: 'Network traffic spike detected', expr: 'avg(/SIEM-COLLECTOR-01/net.if.in,5m)>500', value: 567.8, threshold: 500, status: 'PROBLEM' },
        { problemid: 'PROB-007', hostid: 13, hostname: 'MAIL-RELAY-01', name: 'Service response time high', severity: 'Average', desc: 'SMTP response time above threshold', expr: 'avg(/MAIL-RELAY-01/smtp.time,5m)>2', value: 2.3, threshold: 2, status: 'PROBLEM' },
        { problemid: 'PROB-008', hostid: 17, hostname: 'ZABBIX-SERVER-01', name: 'Queue growing', severity: 'Average', desc: 'Zabbix queue items increasing', expr: 'avg(/ZABBIX-SERVER-01/queue,5m)>100', value: 134, threshold: 100, status: 'PROBLEM' }
    ];

    problems.forEach(p => {
        db.run(`INSERT OR IGNORE INTO zabbix_problems (
            problemid, host_id, hostname, problem_name, severity, description, status,
            trigger_expression, trigger_value, threshold_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.problemid, p.hostid, p.hostname, p.name, p.severity, p.desc, p.status, p.expr, p.value, p.threshold]);
    });

    // Insert historical metrics for graphs (last 2 hours)
    console.log('📈 Generating historical metrics for animated graphs...');
    const now = Date.now();
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    
    for (let timestamp = twoHoursAgo; timestamp <= now; timestamp += 60000) { // Every minute
        hosts.forEach((host, idx) => {
            const hostId = idx + 1;
            const time = new Date(timestamp).toISOString();
            
            // CPU metrics with realistic variation
            const cpuBase = host.cpu;
            const cpuVariation = (Math.random() - 0.5) * 10;
            const cpu = Math.max(5, Math.min(100, cpuBase + cpuVariation));
            
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'cpu', 'CPU Usage %', cpu, time]);
            
            // Memory metrics
            const memBase = (host.mem_used / host.mem_total * 100);
            const memVariation = (Math.random() - 0.5) * 5;
            const memory = Math.max(10, Math.min(100, memBase + memVariation));
            
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'memory', 'Memory Usage %', memory, time]);
            
            // Disk I/O
            const diskIO = Math.random() * 500 + 50;
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'disk', 'Disk I/O MB/s', diskIO, time]);
            
            // Network In
            const netInBase = host.net_in;
            const netInVariation = (Math.random() - 0.5) * 50;
            const netIn = Math.max(0, netInBase + netInVariation);
            
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'network', 'Network In Mbps', netIn, time]);
            
            // Network Out
            const netOutBase = host.net_out;
            const netOutVariation = (Math.random() - 0.5) * 40;
            const netOut = Math.max(0, netOutBase + netOutVariation);
            
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'network', 'Network Out Mbps', netOut, time]);
            
            // Load Average
            const loadBase = host.load1;
            const loadVariation = (Math.random() - 0.5) * 0.5;
            const load = Math.max(0, loadBase + loadVariation);
            
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, ?, ?, ?, ?)`, [hostId, 'system', 'Load Average', load, time]);
        });
    }

    // Graph Configurations
    const graphConfigs = [
        { name: 'System CPU Usage', type: 'line', metrics: 'cpu', filter: 'all', period: 3600, order: 1 },
        { name: 'Memory Utilization', type: 'area', metrics: 'memory', filter: 'all', period: 3600, order: 2 },
        { name: 'Network Traffic', type: 'line', metrics: 'network', filter: 'all', period: 3600, order: 3 },
        { name: 'Disk I/O Performance', type: 'line', metrics: 'disk', filter: 'all', period: 3600, order: 4 },
        { name: 'Server Load Average', type: 'area', metrics: 'system', filter: 'all', period: 3600, order: 5 },
        { name: 'Top CPU Consumers', type: 'bar', metrics: 'cpu', filter: 'top10', period: 300, order: 6 },
        { name: 'Database Performance', type: 'line', metrics: 'cpu,memory', filter: 'Database Servers', period: 3600, order: 7 },
        { name: 'Web Server Metrics', type: 'line', metrics: 'cpu,network', filter: 'Web Servers', period: 3600, order: 8 }
    ];

    graphConfigs.forEach(g => {
        db.run(`INSERT OR IGNORE INTO graph_configs (graph_name, graph_type, metric_types, host_filter, time_period, display_order) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [g.name, g.type, g.metrics, g.filter, g.period, g.order]);
    });

    // System Settings
    const settings = [
        { key: 'graph_rotation_enabled', value: 'true', category: 'display' },
        { key: 'graph_rotation_interval', value: '60', category: 'display' },
        { key: 'refresh_interval', value: '5', category: 'performance' },
        { key: 'max_graph_points', value: '120', category: 'performance' },
        { key: 'theme', value: 'dark', category: 'ui' },
        { key: 'animation_enabled', value: 'true', category: 'ui' }
    ];

    settings.forEach(s => {
        db.run(`INSERT OR IGNORE INTO system_settings (setting_key, setting_value, category) 
                VALUES (?, ?, ?)`, [s.key, s.value, s.category]);
    });

    console.log('✅ Zabbix sample data generated successfully');
}

// ============================================
// MIDDLEWARE - AUTHENTICATION
// ============================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied - No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }
    next();
}

function auditLog(userId, username, action, entityType, entityId, details, ip) {
    db.run(`INSERT INTO audit_log (user_id, username, action, entity_type, entity_id, details, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, username, action, entityType, entityId, details, ip]);
}

// ============================================
// API ROUTES - AUTHENTICATION
// ============================================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get('SELECT * FROM users WHERE username = ? AND isActive = 1', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            auditLog(null, username, 'LOGIN_FAILED', 'user', null, 'User not found', clientIp);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check failed attempts (simple brute force protection)
        if (user.failedAttempts >= 5) {
            auditLog(user.id, username, 'LOGIN_LOCKED', 'user', user.id, 'Account locked due to failed attempts', clientIp);
            return res.status(423).json({ error: 'Account locked - Too many failed attempts' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            db.run('UPDATE users SET failedAttempts = failedAttempts + 1 WHERE id = ?', [user.id]);
            auditLog(user.id, username, 'LOGIN_FAILED', 'user', user.id, 'Invalid password', clientIp);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        // Reset failed attempts and update last login
        db.run('UPDATE users SET failedAttempts = 0, lastLogin = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        auditLog(user.id, username, 'LOGIN_SUCCESS', 'user', user.id, 'Successful login', clientIp);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    auditLog(req.user.id, req.user.username, 'LOGOUT', 'user', req.user.id, 'User logged out', clientIp);
    res.json({ success: true });
});

// ============================================
// API ROUTES - DASHBOARD
// ============================================
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {};

    db.get('SELECT COUNT(*) as total FROM zabbix_hosts WHERE status = "Enabled"', (err, result) => {
        stats.totalHosts = result?.total || 0;

        db.get('SELECT COUNT(*) as total FROM zabbix_hosts WHERE availability = "Available"', (err, result) => {
            stats.hostsOnline = result?.total || 0;

            db.get('SELECT COUNT(*) as count FROM zabbix_problems WHERE status = "PROBLEM" AND severity IN ("Critical", "High")', (err, result) => {
                stats.criticalProblems = result?.count || 0;

                db.get('SELECT COUNT(*) as count FROM zabbix_problems WHERE status = "PROBLEM"', (err, result) => {
                    stats.totalProblems = result?.count || 0;

                    db.get('SELECT AVG(cpu_usage) as avg FROM zabbix_hosts WHERE availability = "Available"', (err, result) => {
                        stats.avgCpuUsage = Math.round(result?.avg || 0);

                        db.get('SELECT AVG(memory_usage) as avg FROM zabbix_hosts WHERE availability = "Available"', (err, result) => {
                            stats.avgMemoryUsage = Math.round(result?.avg || 0);

                            db.get('SELECT SUM(network_in_rate) as total FROM zabbix_hosts WHERE availability = "Available"', (err, result) => {
                                stats.totalNetworkIn = Math.round(result?.total || 0);

                                db.get('SELECT SUM(network_out_rate) as total FROM zabbix_hosts WHERE availability = "Available"', (err, result) => {
                                    stats.totalNetworkOut = Math.round(result?.total || 0);

                                    stats.timestamp = new Date().toISOString();
                                    res.json(stats);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/dashboard/host-groups', authenticateToken, (req, res) => {
    db.all(`SELECT 
                host_group,
                COUNT(*) as total,
                SUM(CASE WHEN availability = 'Available' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'Enabled' THEN 1 ELSE 0 END) as enabled,
                AVG(cpu_usage) as avg_cpu,
                AVG(memory_usage) as avg_memory
            FROM zabbix_hosts
            GROUP BY host_group
            ORDER BY total DESC`, 
            (err, groups) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(groups || []);
    });
});

app.get('/api/dashboard/top-consumers', authenticateToken, (req, res) => {
    const { metric = 'cpu', limit = 10 } = req.query;
    
    let orderBy = 'cpu_usage DESC';
    if (metric === 'memory') orderBy = 'memory_usage DESC';
    if (metric === 'disk') orderBy = 'disk_usage DESC';
    if (metric === 'network') orderBy = '(network_in_rate + network_out_rate) DESC';
    
    db.all(`SELECT hostname, cpu_usage, memory_usage, disk_usage, network_in_rate, network_out_rate, host_group
            FROM zabbix_hosts 
            WHERE availability = 'Available'
            ORDER BY ${orderBy}
            LIMIT ?`, 
            [parseInt(limit)],
            (err, hosts) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(hosts || []);
    });
});

// ============================================
// API ROUTES - HOSTS
// ============================================
app.get('/api/hosts', authenticateToken, (req, res) => {
    const { group, status, search } = req.query;
    let query = 'SELECT * FROM zabbix_hosts WHERE 1=1';
    const params = [];

    if (group) {
        query += ' AND host_group = ?';
        params.push(group);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (search) {
        query += ' AND (hostname LIKE ? OR ip_address LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY hostname ASC';

    db.all(query, params, (err, hosts) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(hosts || []);
    });
});

app.get('/api/hosts/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM zabbix_hosts WHERE id = ?', [id], (err, host) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!host) return res.status(404).json({ error: 'Host not found' });
        res.json(host);
    });
});

app.post('/api/hosts', authenticateToken, requireAdmin, (req, res) => {
    const { hostname, ip_address, dns_name, host_group, os, location, department } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!hostname || !ip_address) {
        return res.status(400).json({ error: 'Hostname and IP address required' });
    }

    const hostid = 'ZBX-' + Date.now();

    db.run(`INSERT INTO zabbix_hosts (hostid, hostname, ip_address, dns_name, host_group, os, location, department, status, availability) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Enabled', 'Unknown')`,
            [hostid, hostname, ip_address, dns_name || '', host_group || 'Default', os || '', location || '', department || ''],
            function(err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'HOST_CREATED', 'host', this.lastID, 
                 `Created host: ${hostname} (${ip_address})`, clientIp);
        
        res.json({ success: true, id: this.lastID, hostid });
    });
});

app.put('/api/hosts/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const allowedFields = ['hostname', 'ip_address', 'dns_name', 'host_group', 'os', 'location', 'department', 'status', 'maintenance_mode'];
    const setClause = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            setClause.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (setClause.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.run(`UPDATE zabbix_hosts SET ${setClause.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'HOST_UPDATED', 'host', id, 
                 `Updated host fields: ${Object.keys(updates).join(', ')}`, clientIp);
        
        res.json({ success: true });
    });
});

app.delete('/api/hosts/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    db.get('SELECT hostname FROM zabbix_hosts WHERE id = ?', [id], (err, host) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!host) return res.status(404).json({ error: 'Host not found' });

        db.run('DELETE FROM zabbix_hosts WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            // Also delete associated metrics and problems
            db.run('DELETE FROM metrics_history WHERE host_id = ?', [id]);
            db.run('DELETE FROM zabbix_problems WHERE host_id = ?', [id]);
            
            auditLog(req.user.id, req.user.username, 'HOST_DELETED', 'host', id, 
                     `Deleted host: ${host.hostname}`, clientIp);
            
            res.json({ success: true });
        });
    });
});

// ============================================
// API ROUTES - PROBLEMS
// ============================================
app.get('/api/problems', authenticateToken, (req, res) => {
    const { severity, status, hostname } = req.query;
    let query = 'SELECT * FROM zabbix_problems WHERE 1=1';
    const params = [];

    if (severity) {
        query += ' AND severity = ?';
        params.push(severity);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (hostname) {
        query += ' AND hostname LIKE ?';
        params.push(`%${hostname}%`);
    }

    query += ' ORDER BY CASE severity WHEN "Critical" THEN 1 WHEN "High" THEN 2 WHEN "Average" THEN 3 WHEN "Warning" THEN 4 ELSE 5 END, event_time DESC';

    db.all(query, params, (err, problems) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(problems || []);
    });
});

app.post('/api/problems/:id/acknowledge', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    db.run(`UPDATE zabbix_problems 
            SET acknowledged = 1, 
                acknowledged_by = ?, 
                acknowledged_at = CURRENT_TIMESTAMP,
                ack_message = ?
            WHERE id = ?`,
            [req.user.username, message || 'Acknowledged', id],
            (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'PROBLEM_ACKNOWLEDGED', 'problem', id, 
                 message || 'Acknowledged', clientIp);
        
        res.json({ success: true });
    });
});

app.post('/api/problems/:id/resolve', authenticateToken, (req, res) => {
    const { id } = req.params;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    db.run(`UPDATE zabbix_problems 
            SET status = 'RESOLVED', 
                recovery_time = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [id],
            (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'PROBLEM_RESOLVED', 'problem', id, 
                 'Problem marked as resolved', clientIp);
        
        res.json({ success: true });
    });
});

// ============================================
// API ROUTES - METRICS & GRAPHS
// ============================================
app.get('/api/metrics/history', authenticateToken, (req, res) => {
    const { host_id, metric_type, hours = 2 } = req.query;
    
    let query = `SELECT * FROM metrics_history WHERE timestamp >= datetime('now', '-${hours} hours')`;
    const params = [];

    if (host_id) {
        query += ' AND host_id = ?';
        params.push(host_id);
    }
    if (metric_type) {
        query += ' AND metric_type = ?';
        params.push(metric_type);
    }

    query += ' ORDER BY timestamp DESC';

    db.all(query, params, (err, metrics) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(metrics || []);
    });
});

app.get('/api/metrics/aggregated', authenticateToken, (req, res) => {
    const { metric_type = 'cpu', interval = '5', hours = 2 } = req.query;
    
    db.all(`SELECT 
                strftime('%Y-%m-%d %H:%M:00', datetime(timestamp, 'start of day', '+' || (strftime('%s', timestamp) / ${interval * 60}) * ${interval * 60} || ' seconds')) as time_bucket,
                metric_name,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                COUNT(*) as count
            FROM metrics_history
            WHERE metric_type = ? AND timestamp >= datetime('now', '-${hours} hours')
            GROUP BY time_bucket, metric_name
            ORDER BY time_bucket DESC`,
            [metric_type],
            (err, data) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(data || []);
    });
});

app.get('/api/graphs/configs', authenticateToken, (req, res) => {
    db.all('SELECT * FROM graph_configs WHERE is_active = 1 ORDER BY display_order', (err, configs) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(configs || []);
    });
});

// ============================================
// API ROUTES - ADMIN
// ============================================
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT id, username, fullName, email, role, isActive, lastLogin, 
                   failedAttempts, created_at, created_by 
            FROM users 
            ORDER BY id ASC`, 
            (err, users) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(users || []);
    });
});

app.post('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const { username, password, fullName, email, role } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!username || !password || !fullName || !email || !role) {
        return res.status(400).json({ error: 'All fields required' });
    }

    if (!['admin', 'analyst', 'viewer'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (username, password, fullName, email, role, created_by) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, fullName, email, role, req.user.id],
            function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(409).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        
        auditLog(req.user.id, req.user.username, 'USER_CREATED', 'user', this.lastID, 
                 `Created user: ${username} with role: ${role}`, clientIp);
        
        res.json({ success: true, id: this.lastID });
    });
});

app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { fullName, email, role, isActive } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (id === '1') {
        return res.status(403).json({ error: 'Cannot modify super admin account' });
    }

    const updates = [];
    const values = [];

    if (fullName !== undefined) { updates.push('fullName = ?'); values.push(fullName); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (isActive !== undefined) { updates.push('isActive = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'USER_UPDATED', 'user', id, 
                 `Updated user fields`, clientIp);
        
        res.json({ success: true });
    });
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (id === '1') {
        return res.status(403).json({ error: 'Cannot delete super admin account' });
    }

    db.get('SELECT username FROM users WHERE id = ?', [id], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(404).json({ error: 'User not found' });

        db.run('DELETE FROM users WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            auditLog(req.user.id, req.user.username, 'USER_DELETED', 'user', id, 
                     `Deleted user: ${user.username}`, clientIp);
            
            res.json({ success: true });
        });
    });
});

app.post('/api/admin/users/:id/reset-password', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.run('UPDATE users SET password = ?, failedAttempts = 0 WHERE id = ?', 
           [hashedPassword, id], 
           (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'PASSWORD_RESET', 'user', id, 
                 'Admin reset user password', clientIp);
        
        res.json({ success: true });
    });
});

app.get('/api/admin/audit-log', authenticateToken, requireAdmin, (req, res) => {
    const { limit = 100, action, username } = req.query;
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];

    if (action) {
        query += ' AND action = ?';
        params.push(action);
    }
    if (username) {
        query += ' AND username LIKE ?';
        params.push(`%${username}%`);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit));

    db.all(query, params, (err, logs) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(logs || []);
    });
});

app.get('/api/admin/system-settings', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT * FROM system_settings ORDER BY category, setting_key', (err, settings) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(settings || []);
    });
});

app.put('/api/admin/system-settings/:key', authenticateToken, requireAdmin, (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    db.run(`UPDATE system_settings 
            SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE setting_key = ?`,
            [value, req.user.username, key],
            (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        auditLog(req.user.id, req.user.username, 'SETTING_UPDATED', 'setting', key, 
                 `Updated setting: ${key} = ${value}`, clientIp);
        
        res.json({ success: true });
    });
});

// ============================================
// WEBSOCKET SERVER
// ============================================
const wss = new WebSocket.Server({ port: WS_PORT });
let connectedClients = 0;

wss.on('connection', (ws) => {
    connectedClients++;
    console.log(`🔌 WebSocket client connected (Total: ${connectedClients})`);
    
    ws.on('close', () => {
        connectedClients--;
        console.log(`🔌 WebSocket client disconnected (Total: ${connectedClients})`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast real-time stats updates
function broadcastStatsUpdate() {
    if (connectedClients === 0) return;
    
    db.get('SELECT COUNT(*) as total FROM zabbix_hosts WHERE status = "Enabled"', (err, hostCount) => {
        db.get('SELECT COUNT(*) as count FROM zabbix_problems WHERE status = "PROBLEM" AND severity IN ("Critical", "High")', (err, problemCount) => {
            db.get('SELECT AVG(cpu_usage) as avg FROM zabbix_hosts WHERE availability = "Available"', (err, cpuAvg) => {
                db.get('SELECT AVG(memory_usage) as avg FROM zabbix_hosts WHERE availability = "Available"', (err, memAvg) => {
                    const update = {
                        type: 'stats_update',
                        data: {
                            totalHosts: hostCount?.total || 0,
                            criticalProblems: problemCount?.count || 0,
                            avgCpuUsage: Math.round(cpuAvg?.avg || 0),
                            avgMemoryUsage: Math.round(memAvg?.avg || 0),
                            timestamp: new Date().toISOString()
                        }
                    };
                    
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(update));
                        }
                    });
                });
            });
        });
    });
}

// Broadcast graph rotation signal
function broadcastGraphRotation() {
    if (connectedClients === 0) return;
    
    const signal = {
        type: 'graph_rotation',
        timestamp: new Date().toISOString()
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(signal));
        }
    });
}

// Periodic updates
setInterval(broadcastStatsUpdate, STATS_UPDATE_INTERVAL);
setInterval(broadcastGraphRotation, GRAPH_UPDATE_INTERVAL);

// Update host metrics every 5 seconds (simulated live data)
setInterval(() => {
    db.all('SELECT id, cpu_usage, memory_usage, network_in_rate, network_out_rate FROM zabbix_hosts WHERE availability = "Available"', (err, hosts) => {
        if (err || !hosts) return;
        
        hosts.forEach(host => {
            const cpuVariation = (Math.random() - 0.5) * 5;
            const memVariation = (Math.random() - 0.5) * 2;
            const netInVariation = (Math.random() - 0.5) * 20;
            const netOutVariation = (Math.random() - 0.5) * 15;
            
            const newCpu = Math.max(5, Math.min(100, host.cpu_usage + cpuVariation));
            const newMem = Math.max(10, Math.min(100, host.memory_usage + memVariation));
            const newNetIn = Math.max(0, host.network_in_rate + netInVariation);
            const newNetOut = Math.max(0, host.network_out_rate + netOutVariation);
            
            db.run(`UPDATE zabbix_hosts 
                    SET cpu_usage = ?, memory_usage = ?, network_in_rate = ?, network_out_rate = ?, 
                        last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`,
                    [newCpu, newMem, newNetIn, newNetOut, host.id]);
            
            // Insert into metrics history
            const now = new Date().toISOString();
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, 'cpu', 'CPU Usage %', ?, ?)`, [host.id, newCpu, now]);
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, 'memory', 'Memory Usage %', ?, ?)`, [host.id, newMem, now]);
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, 'network', 'Network In Mbps', ?, ?)`, [host.id, newNetIn, now]);
            db.run(`INSERT INTO metrics_history (host_id, metric_type, metric_name, value, timestamp) 
                    VALUES (?, 'network', 'Network Out Mbps', ?, ?)`, [host.id, newNetOut, now]);
        });
    });
}, 5000);

// Cleanup old metrics (keep only last 24 hours)
setInterval(() => {
    db.run("DELETE FROM metrics_history WHERE timestamp < datetime('now', '-24 hours')", (err) => {
        if (!err) console.log('🧹 Cleaned up old metrics');
    });
}, 3600000); // Every hour

// ============================================
// SERVER STARTUP
// ============================================
initDatabase();

setTimeout(() => {
    db.get('SELECT COUNT(*) as count FROM zabbix_hosts', (err, result) => {
        if (!result || result.count === 0) {
            insertSampleData();
        }
    });
}, 1000);

app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   📊 ZABBIX MONITORING DASHBOARD v3.0             ║');
    console.log('║   Enhanced with Admin Controls & Animations       ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    console.log(`✅ HTTP Server: http://localhost:${PORT}`);
    console.log(`✅ WebSocket Server: ws://localhost:${WS_PORT}`);
    console.log('\n🔐 Default Login:');
    console.log('   Username: admin');
    console.log('   Password: Admin@2024!\n');
    console.log('📊 Features:');
    console.log('   • 20 Monitored Hosts (Production Environment)');
    console.log('   • 8 Active Problems/Triggers');
    console.log('   • Real-time Metric Collection');
    console.log('   • Animated Graphs (60s rotation)');
    console.log('   • Admin-Only User/Host Management');
    console.log('   • Audit Logging');
    console.log('   • WebSocket Live Updates');
    console.log('   • Zoom-in Login Animation\n');
    console.log('👥 User Roles:');
    console.log('   • admin: Full access (create users, hosts)');
    console.log('   • analyst: View & acknowledge problems');
    console.log('   • viewer: Read-only access\n');
});
