# คู่มือปฏิบัติหลังติดตั้ง Ubuntu Server

## Git, Nginx Reverse Proxy, MariaDB และ Node.js

รายวิชา: 31901-2002 ระบบปฏิบัติการเครื่องแม่ข่าย  
หัวข้อที่เกี่ยวข้อง: การตั้งค่าพื้นฐานหลังติดตั้ง Ubuntu Server, Web Server, Database Server, Reverse Proxy และการ Deploy Web Application เบื้องต้น

คู่มือนี้เริ่มจากหลังติดตั้ง Ubuntu Server เสร็จแล้ว เหมาะสำหรับใช้เป็นใบงานให้นักเรียนทำตามทีละขั้น เพื่อเตรียมเครื่องแม่ข่ายให้พร้อมรัน Web Application ด้วยชุดบริการพื้นฐานดังนี้:

- Git: ดึงและจัดการโค้ดโปรเจกต์
- Nginx: รับคำขอเว็บจากผู้ใช้ผ่านพอร์ต 80
- Reverse Proxy: ส่งต่อคำขอจาก Nginx ไปยัง Node.js ที่รันอยู่ภายในเครื่อง
- MariaDB: จัดเก็บข้อมูลของระบบ
- Node.js: รันแอปพลิเคชันฝั่ง Server

อ้างอิงจากสไลด์ที่สอนไปแล้ว:

- สัปดาห์ที่ 5: สร้าง VM และติดตั้ง Ubuntu Server 24.04, Static IP, Hostname, Post-install Commands
- สัปดาห์ที่ 4-5: Nginx Web Server, systemctl, Document Root, nginx -t
- สัปดาห์ที่ 4a: MariaDB, Node.js, Vite, Nginx Reverse Proxy
- สัปดาห์ที่ 9: MariaDB Server, User Privileges และ Security
- สัปดาห์ที่ 10: แนวคิด Nginx Reverse Proxy

---

## ภาพรวมระบบที่ต้องได้หลังทำเสร็จ

```text
ผู้ใช้เปิดเว็บ
    |
    v
http://SERVER_IP  หรือ  http://myapp.local
    |
    v
Nginx :80
    |
    v
Reverse Proxy ไปยัง Node.js :3000
    |
    v
Node.js Application
    |
    v
MariaDB Database
```

หลักคิดสำคัญ:

- ผู้ใช้ภายนอกควรเข้าเว็บผ่าน Nginx พอร์ต 80
- Node.js ควรรันหลังบ้าน เช่น `127.0.0.1:3000`
- MariaDB ใช้เก็บข้อมูล และไม่ควรเปิดให้ทุกคนภายนอกเชื่อมต่อโดยตรง
- ทุกครั้งที่แก้ไฟล์ Nginx ต้องรัน `sudo nginx -t` ก่อน reload/restart

---

## 1. ตรวจสอบเครื่องหลังติดตั้ง Ubuntu Server

หลังติดตั้ง Ubuntu Server และ Login เข้าเครื่องแล้ว ให้ตรวจสอบพื้นฐานก่อนติดตั้งบริการใด ๆ

```bash
ip a
hostname -I
ping -c 4 8.8.8.8
ping -c 4 google.com
df -h
free -h
```

ความหมาย:

- `ip a` ใช้ดูชื่อการ์ดเครือข่ายและ IP Address
- `hostname -I` ใช้ดู IP ของเครื่องแบบรวดเร็ว
- `ping 8.8.8.8` ใช้ทดสอบว่าออกอินเทอร์เน็ตได้
- `ping google.com` ใช้ทดสอบว่า DNS ทำงาน
- `df -h` ใช้ดูพื้นที่ดิสก์
- `free -h` ใช้ดู RAM

หากยังไม่ได้ตั้งชื่อเครื่อง ให้ตั้ง Hostname ให้จำง่าย เช่น `webserver01`

```bash
sudo hostnamectl set-hostname webserver01
hostnamectl
```

ให้ออกจาก SSH แล้ว Login ใหม่อีกครั้ง เพื่อให้ชื่อเครื่องใหม่แสดงใน prompt

---

## 2. อัปเดตระบบและติดตั้งเครื่องมือพื้นฐาน

อัปเดตรายการแพ็กเกจและอัปเกรดระบบก่อนเสมอ

```bash
sudo apt update
sudo apt upgrade -y
```

ติดตั้งเครื่องมือพื้นฐานที่ใช้บ่อย

```bash
sudo apt install -y curl wget nano unzip htop net-tools ca-certificates gnupg
```

ตรวจสอบเวลาและ timezone ถ้าจำเป็น

```bash
timedatectl
```

---

## 3. ติดตั้งและตั้งค่า Git

ติดตั้ง Git

```bash
sudo apt install -y git
git --version
```

ตั้งค่าชื่อและอีเมลผู้ใช้ Git

```bash
git config --global user.name "Student Name"
git config --global user.email "student@example.com"
git config --global init.defaultBranch main
```

ตรวจสอบค่าที่ตั้งไว้

```bash
git config --global --list
```

ตัวอย่างการ Clone โปรเจกต์

```bash
cd ~
git clone https://github.com/example/myapp.git
cd myapp
```

ถ้ายังไม่มี Repository จริง ให้สร้างโฟลเดอร์โปรเจกต์สำหรับฝึกก่อน

```bash
mkdir -p ~/myapp
cd ~/myapp
git init
```

จุดตรวจสอบ:

```bash
git status
```

ถ้าเห็นสถานะของ Git Repository แสดงว่า Git พร้อมใช้งาน

---

## 4. ติดตั้ง Nginx Web Server

ติดตั้ง Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

ตรวจสอบสถานะบริการ

```bash
sudo systemctl status nginx
```

ต้องเห็นคำว่า:

```text
Active: active (running)
```

ตั้งให้ Nginx เปิดอัตโนมัติเมื่อเปิดเครื่อง

```bash
sudo systemctl enable nginx
```

ทดสอบด้วยคำสั่ง

```bash
curl http://localhost
```

หรือเปิด Browser จากเครื่อง Client:

```text
http://SERVER_IP
```

เช่น:

```text
http://192.168.1.50
```

คำสั่ง systemctl ที่ต้องจำ:

```bash
sudo systemctl status nginx
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
sudo systemctl enable nginx
```

หมายเหตุ:

- `restart` คือปิดแล้วเปิดใหม่
- `reload` คือโหลด config ใหม่โดยไม่ตัด service แรงเท่า restart
- หลังแก้ config Nginx ควรใช้ `reload` เมื่อ `nginx -t` ผ่านแล้ว

---

## 5. ทดสอบหน้าเว็บเริ่มต้นของ Nginx

ไฟล์หน้าเว็บเริ่มต้นอยู่ที่:

```text
/var/www/html/index.html
```

ลองสร้างหน้าเว็บทดสอบของตัวเอง

```bash
sudo nano /var/www/html/index.html
```

ใส่เนื้อหาตัวอย่าง:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>My Ubuntu Server</title>
</head>
<body>
  <h1>Hello My Server</h1>
  <p>Student: Your Name</p>
</body>
</html>
```

บันทึกไฟล์:

```text
Ctrl + O  →  Enter  →  Ctrl + X
```

ทดสอบ:

```bash
curl http://localhost
```

หรือเปิด Browser:

```text
http://SERVER_IP
```

---

## 6. ติดตั้ง MariaDB Database Server

ติดตั้ง MariaDB

```bash
sudo apt update
sudo apt install -y mariadb-server
```

ตรวจสอบสถานะ

```bash
sudo systemctl status mariadb
```

ต้องเห็น:

```text
Active: active (running)
```

ตั้งให้ MariaDB เปิดอัตโนมัติเมื่อเปิดเครื่อง

```bash
sudo systemctl enable mariadb
```

ตรวจสอบเวอร์ชัน

```bash
mariadb --version
```

---

## 7. ตั้งค่าความปลอดภัย MariaDB

รันคำสั่ง Secure Installation

```bash
sudo mysql_secure_installation
```

แนวทางการตอบคำถาม:

```text
Enter current password for root: กด Enter
Switch to unix_socket authentication? ตอบ N
Change the root password? ตอบ Y แล้วตั้งรหัสผ่านใหม่
Remove anonymous users? ตอบ Y
Disallow root login remotely? ตอบ Y
Remove test database and access to it? ตอบ Y
Reload privilege tables now? ตอบ Y
```

เหตุผลที่ต้องทำ:

- ลบบัญชี anonymous user
- ปิด remote root login
- ลบฐานข้อมูลทดสอบ
- ลดช่องโหว่เริ่มต้นของระบบฐานข้อมูล

---

## 8. สร้างฐานข้อมูลและผู้ใช้สำหรับแอปพลิเคชัน

เข้าสู่ MariaDB Console

```bash
sudo mariadb
```

สร้างฐานข้อมูลชื่อ `app_db`

```sql
CREATE DATABASE app_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

สร้างผู้ใช้ชื่อ `app_user` และตั้งรหัสผ่าน

```sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'StrongPass123!';
```

มอบสิทธิ์ให้ user นี้ใช้ฐานข้อมูล `app_db`

```sql
GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

ตรวจสอบฐานข้อมูล

```sql
SHOW DATABASES;
SELECT User, Host FROM mysql.user;
EXIT;
```

ทดสอบ Login ด้วย user ใหม่

```bash
mariadb -u app_user -p app_db
```

เมื่อเข้าได้แล้ว ให้สร้างตารางทดสอบ

```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100)
);

INSERT INTO students (name, email)
VALUES ('Student One', 'student1@example.com');

SELECT * FROM students;
EXIT;
```

จุดตรวจสอบ:

- Login ด้วย `app_user` ได้
- เห็นฐานข้อมูล `app_db`
- สร้างตาราง `students` ได้
- `SELECT * FROM students;` แสดงข้อมูลที่เพิ่มไว้

---

## 9. ติดตั้ง Node.js และ npm

วิธีที่ 1: ติดตั้งจาก Repository มาตรฐานของ Ubuntu

```bash
sudo apt install -y nodejs npm
node -v
npm -v
```

วิธีนี้ง่าย เหมาะกับห้องเรียน แต่บางครั้งเวอร์ชันอาจเก่ากว่า LTS ล่าสุด

วิธีที่ 2: ติดตั้ง Node.js LTS ผ่าน NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

จุดตรวจสอบ:

```bash
node -v
npm -v
```

ถ้าเห็นเลขเวอร์ชัน แสดงว่าติดตั้งสำเร็จ

---

## 10. สร้าง Node.js Web Application ตัวอย่าง

สร้างโฟลเดอร์แอป

```bash
mkdir -p ~/myapp
cd ~/myapp
```

เริ่มต้นโปรเจกต์ Node.js

```bash
npm init -y
```

ติดตั้ง package สำหรับเชื่อม MariaDB

```bash
npm install express mysql2
```

สร้างไฟล์ `server.js`

```bash
nano server.js
```

ใส่โค้ดนี้:

```js
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = 3000;

const dbConfig = {
  host: "localhost",
  user: "app_user",
  password: "StrongPass123!",
  database: "app_db",
};

app.get("/", async (req, res) => {
  res.send(`
    <h1>Node.js is running behind Nginx</h1>
    <p>Server time: ${new Date().toLocaleString()}</p>
    <p>Try <a href="/students">/students</a></p>
  `);
});

app.get("/students", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM students");
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Database connection failed",
      error: error.message,
    });
  }
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Node.js app listening at http://127.0.0.1:${port}`);
});
```

บันทึกไฟล์:

```text
Ctrl + O  →  Enter  →  Ctrl + X
```

รันแอป

```bash
node server.js
```

เปิดอีก Terminal หรือ SSH อีกหน้าต่าง แล้วทดสอบ:

```bash
curl http://127.0.0.1:3000
curl http://127.0.0.1:3000/students
```

ถ้าเห็นหน้า HTML และ JSON จากฐานข้อมูล แสดงว่า Node.js เชื่อม MariaDB ได้แล้ว

หยุด Node.js:

```text
Ctrl + C
```

---

## 11. รัน Node.js ในพื้นหลังด้วย nohup

ถ้ารันด้วย `node server.js` ธรรมดา เมื่อปิด Terminal โปรแกรมจะหยุด จึงใช้ `nohup` เพื่อให้ทำงานต่อในพื้นหลัง

```bash
cd ~/myapp
nohup node server.js > app.log 2>&1 &
```

ตรวจสอบ Log

```bash
cat app.log
```

ตรวจสอบ Process

```bash
ps aux | grep node
```

ทดสอบอีกครั้ง

```bash
curl http://127.0.0.1:3000
```

หากต้องการหยุดโปรแกรม ให้หา PID ก่อน

```bash
ps aux | grep node
```

แล้วสั่ง kill โดยเปลี่ยน `PID_NUMBER` เป็นเลขจริง

```bash
kill PID_NUMBER
```

หมายเหตุ:

- ในงานจริงนิยมใช้ PM2 หรือ systemd service เพื่อดูแล Node.js ให้เสถียรกว่า
- ในคู่มือนี้ใช้ `nohup` เพราะเป็นวิธีพื้นฐานที่นักเรียนเข้าใจง่าย

---

## 12. ตั้งค่า Nginx Reverse Proxy ไปยัง Node.js

เป้าหมาย:

- ผู้ใช้เปิด `http://SERVER_IP`
- Nginx รับคำขอที่พอร์ต 80
- Nginx ส่งต่อไปยัง Node.js ที่ `127.0.0.1:3000`
- ผู้ใช้ไม่ต้องพิมพ์พอร์ต 3000 เอง

สร้างไฟล์ config ใหม่

```bash
sudo nano /etc/nginx/sites-available/myapp
```

ใส่ config นี้:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

บันทึกไฟล์:

```text
Ctrl + O  →  Enter  →  Ctrl + X
```

เปิดใช้งาน config

```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/myapp
```

ปิด default site เพื่อไม่ให้ชนกัน

```bash
sudo rm /etc/nginx/sites-enabled/default
```

ตรวจสอบ config ก่อน reload

```bash
sudo nginx -t
```

ถ้าถูกต้อง จะเห็นข้อความประมาณนี้:

```text
syntax is ok
test is successful
```

Reload Nginx

```bash
sudo systemctl reload nginx
```

ทดสอบ:

```bash
curl http://localhost
curl http://localhost/students
```

เปิด Browser จากเครื่อง Client:

```text
http://SERVER_IP
http://SERVER_IP/students
```

---

## 13. เปิด Firewall เฉพาะพอร์ตที่จำเป็น

ถ้าใช้ UFW ตามบทเรียน Firewall ให้เปิดเฉพาะบริการที่จำเป็น

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

หลักคิด:

- เปิด SSH เพื่อให้ครู/นักเรียน remote เข้าเครื่องได้
- เปิด Nginx เพื่อให้ผู้ใช้เข้าเว็บผ่านพอร์ต 80/443
- ไม่จำเป็นต้องเปิดพอร์ต 3000 เพราะ Node.js อยู่หลัง Reverse Proxy
- ไม่จำเป็นต้องเปิดพอร์ต 3306 ให้ภายนอก ถ้าแอปและฐานข้อมูลอยู่เครื่องเดียวกัน

ตรวจสอบพอร์ตที่กำลังเปิดฟังอยู่

```bash
sudo ss -tulpn
```

ควรเห็นอย่างน้อย:

```text
:22    ssh
:80    nginx
127.0.0.1:3000    node
127.0.0.1:3306    mariadb
```

---

## 14. Checklist ตรวจสอบทั้งระบบ

ใช้รายการนี้ก่อนส่งงานหรือก่อนให้ครูตรวจ

### ตรวจ Ubuntu และ Network

```bash
hostnamectl
hostname -I
ping -c 4 google.com
```

### ตรวจ Git

```bash
git --version
git config --global --list
```

### ตรวจ Nginx

```bash
sudo systemctl status nginx
sudo nginx -t
curl http://localhost
```

### ตรวจ MariaDB

```bash
sudo systemctl status mariadb
mariadb -u app_user -p app_db
```

ใน MariaDB:

```sql
SELECT * FROM students;
EXIT;
```

### ตรวจ Node.js

```bash
node -v
npm -v
ps aux | grep node
curl http://127.0.0.1:3000
```

### ตรวจ Reverse Proxy

```bash
curl http://localhost
curl http://localhost/students
```

### ตรวจพอร์ต

```bash
sudo ss -tlnp | grep -E ':22|:80|:3000|:3306'
```

---

## 15. ตารางปัญหาที่พบบ่อยและวิธีแก้

| อาการ | สาเหตุที่เป็นไปได้ | วิธีตรวจ / วิธีแก้ |
|---|---|---|
| เปิดเว็บ `http://SERVER_IP` ไม่ได้ | Nginx ไม่ทำงาน | `sudo systemctl status nginx` |
| Nginx reload ไม่ได้ | config เขียนผิด | `sudo nginx -t` แล้วอ่านบรรทัด error |
| เปิดเว็บแล้วขึ้นหน้า default เดิม | ยังไม่ได้ปิด default site | ตรวจ `/etc/nginx/sites-enabled/` |
| เปิด `/students` แล้ว error | Node.js เชื่อม MariaDB ไม่ได้ | ดู `cat ~/myapp/app.log` |
| `Access denied` ใน MariaDB | user/password/database ไม่ตรง | ทดสอบ `mariadb -u app_user -p app_db` |
| `curl 127.0.0.1:3000` ไม่ตอบ | Node.js ไม่ได้รัน | `ps aux | grep node` |
| เครื่องอื่นเข้าเว็บไม่ได้ | Firewall บล็อกพอร์ต 80 | `sudo ufw status` |
| DNS ใช้ไม่ได้ | nameserver ไม่ถูกต้อง | `ping 8.8.8.8` และ `ping google.com` |

---

## 16. งานที่นักเรียนต้องส่ง

ให้นักเรียนส่ง Screenshot หลักฐานต่อไปนี้:

1. ผลคำสั่ง `hostname -I`
2. ผลคำสั่ง `git --version`
3. ผลคำสั่ง `sudo systemctl status nginx`
4. หน้าเว็บ `http://SERVER_IP` ที่ผ่าน Nginx Reverse Proxy ไปยัง Node.js
5. ผลคำสั่ง `SELECT * FROM students;` ใน MariaDB
6. ผลลัพธ์ `http://SERVER_IP/students` ที่แสดงข้อมูล JSON จากฐานข้อมูล
7. ผลคำสั่ง `sudo ss -tlnp | grep -E ':22|:80|:3000|:3306'`

คำถาม Reflection:

1. ทำไม Node.js ไม่ควรเปิดให้ผู้ใช้เข้าผ่านพอร์ต 3000 โดยตรง?
2. Reverse Proxy ช่วยให้ระบบปลอดภัยและดูแลง่ายขึ้นอย่างไร?
3. ทำไมไม่ควรใช้ root ของ MariaDB ในโค้ด Web Application?
4. หากแก้ config Nginx แล้วเว็บล่ม นักเรียนจะตรวจสอบด้วยคำสั่งใดเป็นอันดับแรก?

---

## 17. สรุปคำสั่งสำคัญ

```bash
# Update
sudo apt update
sudo apt upgrade -y

# Git
sudo apt install -y git
git --version

# Nginx
sudo apt install -y nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# MariaDB
sudo apt install -y mariadb-server
sudo mysql_secure_installation
sudo mariadb

# Node.js
sudo apt install -y nodejs npm
node -v
npm -v

# Run app
cd ~/myapp
nohup node server.js > app.log 2>&1 &

# Check ports
sudo ss -tlnp | grep -E ':22|:80|:3000|:3306'
```

เมื่อทำครบ นักเรียนจะได้ Server Stack พื้นฐานที่ทำงานครบวงจร:

```text
Nginx Reverse Proxy → Node.js Application → MariaDB Database
```

