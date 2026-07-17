# ข้อสอบปฏิบัติ: ติดตั้ง Web Server, MariaDB และ Firewall บน Proxmox Container

รายวิชา: 31901-2002 ระบบปฏิบัติการเครื่องแม่ข่าย  
รูปแบบสอบ: ปฏิบัติรายบุคคลบน Proxmox LXC Container  
เวลาแนะนำ: 2 ชั่วโมง  
คะแนนเต็ม: 100 คะแนน

---

## 1. แนวคิดของข้อสอบ

ข้อสอบนี้วัดว่านักเรียนสามารถตั้งค่าเครื่องแม่ข่าย Linux ให้บริการจริงได้หรือไม่ โดยนักเรียนแต่ละคนจะได้รับ Container ของตนเองบน Proxmox แล้วต้องติดตั้งและตั้งค่าบริการหลัก 3 ส่วน:

1. **Web Server** ด้วย Nginx
2. **Database Server** ด้วย MariaDB
3. **Firewall** ด้วย UFW

โจทย์นี้เหมาะกับเนื้อหาที่เรียนมาแล้ว ได้แก่ Ubuntu Server, SSH, APT, Nginx, MariaDB, Linux service, port, firewall และการตรวจสอบระบบด้วยคำสั่งพื้นฐาน

---

## 2. สิ่งที่ครูเตรียมก่อนสอบ

### 2.1 เตรียม Container ให้นักเรียนคนละ 1 เครื่อง

ค่าที่แนะนำ:

| รายการ | ค่าแนะนำ |
|---|---|
| Template | Ubuntu Server 24.04 LTS หรือ Debian/Ubuntu ที่ใช้ในห้องเรียน |
| CPU | 1 vCPU |
| RAM | 1 GB |
| Disk | 8-16 GB |
| Network | vmbr0 |
| IP | กำหนดให้ชัดเจนต่อคน หรือใช้ DHCP แล้วแจ้ง IP |
| User | `student` ที่มี sudo หรือให้ root ตามแนวทางห้องแล็บ |

ตัวอย่างตารางแจกเครื่อง:

| เลขที่ | ชื่อ | CTID | IP Address | Username | Password |
|---|---|---:|---|---|---|
| 1 | __________ | 201 | 192.168.1.201 | student | ______ |
| 2 | __________ | 202 | 192.168.1.202 | student | ______ |
| 3 | __________ | 203 | 192.168.1.203 | student | ______ |

### 2.2 ข้อควรระวังเรื่อง UFW บน LXC

ถ้าใช้ UFW ภายใน LXC แล้วมีปัญหา ให้ตรวจว่า Container รองรับการใช้ firewall หรือไม่ ในบางระบบอาจต้องเปิด feature ที่เกี่ยวข้องกับ nesting/keyctl หรือใช้ Proxmox Firewall แทน

แนวทางง่ายสำหรับห้องสอบ:

- ทดสอบ UFW ใน Container ตัวอย่างก่อนวันสอบ
- ยืนยันว่า `sudo ufw enable` ไม่ทำให้ SSH หลุดโดยไม่ได้เปิด OpenSSH ก่อน
- แจ้งนักเรียนเสมอว่าให้รัน `sudo ufw allow OpenSSH` ก่อน `sudo ufw enable`

---

## 3. โจทย์สำหรับแจกนักเรียน

### สถานการณ์

คุณได้รับมอบหมายให้เป็นผู้ดูแลระบบขององค์กรขนาดเล็ก ต้องตั้งค่า Ubuntu Server Container ให้เป็นเครื่องแม่ข่ายพื้นฐาน โดยให้บริการหน้าเว็บผ่าน Nginx มีฐานข้อมูล MariaDB สำหรับเก็บข้อมูลนักเรียน และเปิด Firewall เพื่ออนุญาตเฉพาะบริการที่จำเป็น

### ข้อมูลเครื่องของคุณ

ให้กรอกข้อมูลที่ได้รับจากครู:

```text
CTID: ___________________________
IP Address: _____________________
Username: _______________________
Password: _______________________
```

---

## 4. ภารกิจที่นักเรียนต้องทำ

### ภารกิจที่ 1: ตรวจสอบเครื่องและอัปเดตระบบ

1. SSH เข้าเครื่อง Container ของตนเอง
2. ตรวจสอบ IP Address
3. อัปเดตรายการแพ็กเกจ
4. ติดตั้งเครื่องมือพื้นฐานที่จำเป็น

คำสั่งตัวอย่าง:

```bash
hostname -I
ip a
sudo apt update
sudo apt install -y curl nano net-tools
```

หลักฐานที่ต้องส่ง:

- Screenshot ผลคำสั่ง `hostname -I`
- Screenshot ผลคำสั่ง `sudo apt update` หรือหลักฐานว่าอัปเดตสำเร็จ

---

### ภารกิจที่ 2: ติดตั้งและตั้งค่า Nginx Web Server

ติดตั้ง Nginx:

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

แก้ไขหน้าเว็บหลัก:

```bash
sudo nano /var/www/html/index.html
```

หน้าเว็บต้องมีข้อมูลอย่างน้อย:

- ชื่อ-นามสกุล
- เลขที่หรือรหัสนักเรียน
- IP Address ของ Container
- ข้อความว่า `Web Server Exam`

ตัวอย่าง HTML:

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Web Server Exam</title>
</head>
<body>
  <h1>Web Server Exam</h1>
  <p>Name: YOUR NAME</p>
  <p>Student ID: YOUR ID</p>
  <p>Server IP: YOUR SERVER IP</p>
</body>
</html>
```

ทดสอบ:

```bash
curl http://localhost
```

หลักฐานที่ต้องส่ง:

- Screenshot `sudo systemctl status nginx`
- Screenshot หน้าเว็บจาก Browser โดยเข้า `http://IP_CONTAINER`
- Screenshot ผล `curl http://localhost`

---

### ภารกิจที่ 3: ติดตั้งและตั้งค่า MariaDB

ติดตั้ง MariaDB:

```bash
sudo apt install -y mariadb-server
sudo systemctl enable mariadb
sudo systemctl status mariadb
```

เข้าสู่ MariaDB:

```bash
sudo mariadb
```

สร้างฐานข้อมูลและผู้ใช้:

```sql
CREATE DATABASE exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'exam_user'@'localhost' IDENTIFIED BY 'ExamPass123!';
GRANT ALL PRIVILEGES ON exam_db.* TO 'exam_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

ทดสอบเข้าสู่ระบบด้วยผู้ใช้ใหม่:

```bash
mariadb -u exam_user -p exam_db
```

สร้างตารางและเพิ่มข้อมูล:

```sql
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  student_code VARCHAR(50)
);

INSERT INTO students (name, student_code)
VALUES ('YOUR NAME', 'YOUR STUDENT CODE');

SELECT * FROM students;
EXIT;
```

หลักฐานที่ต้องส่ง:

- Screenshot `sudo systemctl status mariadb`
- Screenshot การ Login ด้วย `exam_user`
- Screenshot ผลคำสั่ง `SELECT * FROM students;`

---

### ภารกิจที่ 4: ตั้งค่า Firewall ด้วย UFW

ติดตั้ง UFW ถ้ายังไม่มี:

```bash
sudo apt install -y ufw
```

ตั้งค่า Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status numbered
```

เงื่อนไขที่ต้องได้:

- SSH ต้องยังเข้าได้
- Web ต้องเข้าได้จากเครื่องครู/เครื่อง Client
- MariaDB ไม่ควรเปิดให้ภายนอกเข้าโดยตรง
- ไม่ควรเปิดพอร์ตที่ไม่จำเป็น

ตรวจพอร์ต:

```bash
sudo ss -tlnp
```

หลักฐานที่ต้องส่ง:

- Screenshot `sudo ufw status numbered`
- Screenshot `sudo ss -tlnp`

---

### ภารกิจที่ 5: ตรวจสอบระบบรวม

ให้รันคำสั่งต่อไปนี้และบันทึกผล:

```bash
hostname -I
sudo systemctl status nginx
sudo systemctl status mariadb
sudo ufw status numbered
sudo ss -tlnp
curl http://localhost
```

คำถาม Reflection ให้ตอบท้ายงาน:

1. ทำไมต้องเปิดพอร์ต 80 ให้ Nginx?
2. ทำไมไม่ควรเปิดพอร์ต 3306 ของ MariaDB ให้ทุกคนเข้าจากภายนอก?
3. ก่อน `sudo ufw enable` ควรอนุญาตบริการใดก่อน เพื่อไม่ให้หลุดจาก SSH?
4. ถ้าเว็บเข้าไม่ได้ คุณจะตรวจสอบ 3 จุดแรกอะไรบ้าง?

---

## 5. เกณฑ์ให้คะแนน 100 คะแนน

| หมวด | รายการประเมิน | คะแนน |
|---|---|---:|
| เตรียมระบบ | SSH เข้าเครื่องได้ ตรวจ IP ได้ อัปเดตระบบได้ | 10 |
| Nginx Web Server | ติดตั้ง Nginx สำเร็จ service active | 10 |
| Nginx Web Server | หน้าเว็บแสดงชื่อ/รหัส/IP ถูกต้อง | 10 |
| Nginx Web Server | เข้าเว็บจาก Client/Browser ได้ | 10 |
| MariaDB | ติดตั้ง MariaDB สำเร็จ service active | 10 |
| MariaDB | สร้าง database และ user ได้ถูกต้อง | 10 |
| MariaDB | สร้าง table, insert, select ข้อมูลได้ | 10 |
| Firewall | ตั้ง UFW โดยเปิด SSH และ Web ได้ถูกต้อง | 10 |
| Firewall | ไม่เปิดพอร์ตฐานข้อมูลให้ภายนอกโดยไม่จำเป็น | 10 |
| หลักฐานและ Reflection | Screenshot ครบ ตอบคำถามมีเหตุผล | 10 |
| รวม |  | 100 |

---

## 6. เกณฑ์ตัดสินระดับผล

| คะแนน | ระดับ | ความหมาย |
|---:|---|---|
| 80-100 | ดีมาก | ตั้งระบบได้ครบ ตรวจสอบได้ มีหลักฐานชัดเจน |
| 70-79 | ดี | ระบบหลักทำงานเกือบครบ มีผิดเล็กน้อย |
| 60-69 | พอใช้ | ทำได้บางส่วน แต่ยังมีจุดที่ต้องช่วยแก้ |
| ต่ำกว่า 60 | ต้องปรับปรุง | บริการหลักไม่ครบหรือไม่มีหลักฐานเพียงพอ |

---

## 7. คำสั่งตรวจสำหรับครู

ให้ครูใช้เครื่องของตนเองตรวจจากภายนอก Container

### ตรวจ Web

```bash
curl http://IP_CONTAINER
```

สิ่งที่ควรเห็น:

- ข้อความ `Web Server Exam`
- ชื่อนักเรียน
- IP Address ของ Container

### ตรวจ Port จากเครื่องครู

ถ้ามี `nmap`:

```bash
nmap -p 22,80,3306 IP_CONTAINER
```

ผลที่คาดหวัง:

```text
22/tcp    open
80/tcp    open
3306/tcp  closed หรือ filtered
```

ถ้าไม่มี `nmap` ใช้ `nc` หรือ `telnet` แทนได้:

```bash
nc -vz IP_CONTAINER 22
nc -vz IP_CONTAINER 80
nc -vz IP_CONTAINER 3306
```

### ตรวจหลักฐานในเครื่องนักเรียน

```bash
sudo systemctl status nginx
sudo systemctl status mariadb
sudo ufw status numbered
sudo ss -tlnp
mariadb -u exam_user -p exam_db
```

ใน MariaDB:

```sql
SELECT * FROM students;
EXIT;
```

---

## 8. วิธีลดการลอกกัน

แนวทางสุ่มโจทย์รายคน:

1. ให้แต่ละคนใช้ชื่อ database ต่างกัน เช่น `exam_db_01`, `exam_db_02`
2. ให้แต่ละคนใช้ชื่อตารางต่างกัน เช่น `students_01`
3. ให้หน้าเว็บต้องแสดงเลข CTID และ IP ของตนเอง
4. ให้รหัสผ่าน MariaDB ต่างกันตามเลขที่ เช่น `ExamPass01!`
5. ให้ส่ง Screenshot ที่เห็น prompt หรือ IP ของเครื่องตัวเอง

ตัวอย่าง:

| เลขที่ | Database | User | Password |
|---:|---|---|---|
| 1 | exam_db_01 | exam_user_01 | ExamPass01! |
| 2 | exam_db_02 | exam_user_02 | ExamPass02! |
| 3 | exam_db_03 | exam_user_03 | ExamPass03! |

---

## 9. ข้อควรประกาศก่อนเริ่มสอบ

ให้นักเรียนทราบเงื่อนไขต่อไปนี้:

- ใช้เวลา 2 ชั่วโมง
- ใช้สไลด์/คู่มือที่ครูอนุญาตได้
- ห้ามใช้ Container ของเพื่อน
- ห้ามเปลี่ยนรหัสผ่านหรือ IP โดยไม่แจ้งครู
- ต้องส่ง Screenshot ตามรายการ
- ต้องอธิบายได้ว่าบริการแต่ละตัวทำหน้าที่อะไร
- ถ้า Firewall ทำให้ SSH หลุด นักเรียนต้องแจ้งครูทันที ไม่ควรสุ่มแก้มั่ว

---

## 10. สรุปสิ่งที่ข้อสอบนี้วัด

ข้อสอบนี้วัดสมรรถนะสำคัญของรายวิชา:

- ใช้งาน Linux Server ผ่าน SSH ได้
- ติดตั้งแพ็กเก็ตด้วย APT ได้
- ให้บริการ Web Server ด้วย Nginx ได้
- ให้บริการ Database Server ด้วย MariaDB ได้
- สร้างผู้ใช้และสิทธิ์ฐานข้อมูลได้
- ตั้งค่า Firewall ขั้นพื้นฐานได้
- ตรวจสอบสถานะบริการด้วย `systemctl`, `curl`, `ss`, `ufw` ได้
- ส่งหลักฐานการทำงานของ Server ได้อย่างเป็นระบบ

