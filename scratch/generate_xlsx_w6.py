import openpyxl

w6a_questions = [
    {
        "q": "การเข้าสู่ระบบปฏิบัติการ Linux Server ด้วยบัญชี 'root' ในการทำงานปกติขัดกับหลักการความปลอดภัยในข้อใด?",
        "options": [
            "Principle of Least Privilege (หลักการมอบสิทธิ์ขั้นต่ำที่จำเป็น)",
            "Multi-factor Authentication (การยืนยันตัวตนหลายปัจจัย)",
            "Data Encapsulation (การห่อหุ้มข้อมูล)",
            "System Performance Optimization (การปรับแต่งประสิทธิภาพระบบ)"
        ],
        "correct": 1,
        "time": 30
    },
    {
        "q": "หากต้องการสร้างผู้ใช้งานใหม่ชื่อ 'student01' บน Ubuntu Server พร้อมสร้าง Home Directory ให้โดยอัตโนมัติ ควรใช้คำสั่งใด?",
        "options": [
            "sudo useradd student01",
            "sudo adduser student01",
            "sudo newuser student01",
            "sudo makeuser student01"
        ],
        "correct": 2,
        "time": 25
    },
    {
        "q": "คำสั่งในข้อใดใช้เพื่อจัดกลุ่มและนำผู้ใช้งาน 'student01' เข้าสู่กลุ่มพิเศษ 'sudo' เพื่อให้สามารถยกระดับสิทธิ์ได้?",
        "options": [
            "sudo usermod -aG sudo student01",
            "sudo useradd sudo student01",
            "sudo groupadd student01 sudo",
            "sudo chmod +x student01 sudo"
        ],
        "correct": 1,
        "time": 30
    },
    {
        "q": "ในระบบไฟล์ของ Linux ข้อความสิทธิ์ '-rw-r--r--' มีความหมายอย่างไร?",
        "options": [
            "เจ้าของและกลุ่มอ่านเขียนรันได้ แต่คนอื่นอ่านได้อย่างเดียว",
            "ทุกคนในระบบสามารถเปิดอ่าน แก้ไข และสั่งรันไฟล์นี้ได้อิสระ",
            "เจ้าของอ่านเขียนได้ ส่วนกลุ่มและผู้อื่นอ่านได้อย่างเดียวโดยห้ามแก้ไข",
            "ไฟล์นี้ถูกล็อกสิทธิ์ไม่ให้ผู้ใดแก้ไขหรือลบได้ถาวร"
        ],
        "correct": 3,
        "time": 30
    },
    {
        "q": "หากต้องการกำหนดสิทธิ์ไฟล์เป็นแบบ '755' (rwxr-xr-x) ให้กับโฟลเดอร์เก็บเว็บ /var/www/html/ ควรใช้คำสั่งใด?",
        "options": [
            "sudo chmod 755 /var/www/html/",
            "sudo chown 755 /var/www/html/",
            "sudo chmod rwxr-xr-x /var/www/html/",
            "sudo chgrp 755 /var/www/html/"
        ],
        "correct": 1,
        "time": 20
    },
    {
        "q": "คำสั่งในข้อใดใช้เพื่อเปลี่ยนเจ้าของไฟล์ (Owner) ของ index.html ให้เป็นผู้ใช้ 'student01' และตั้งกลุ่มเป็น 'www-data'?",
        "options": [
            "sudo chmod student01:www-data index.html",
            "sudo chown student01:www-data index.html",
            "sudo setowner student01:www-data index.html",
            "sudo chown student01 www-data index.html"
        ],
        "correct": 2,
        "time": 25
    },
    {
        "q": "การใช้ SSH Key-based Authentication ในการล็อกอินเข้าเครื่องแม่ข่าย กุญแจส่วนใดที่ต้องติดตั้งไว้บนเครื่อง Server?",
        "options": [
            "Private Key (กุญแจส่วนตัว)",
            "Public Key (กุญแจสาธารณะ)",
            "Symmetric Key (กุญแจสมมาตร)",
            "Master Key (กุญแจหลัก)"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "การสร้างกุญแจคู่รหัสผ่าน SSH Key (Key Pair) บนเครื่องลูกข่าย (Client PC) นิยมใช้คำสั่งมาตรฐานใด?",
        "options": [
            "ssh-keygen -t ed25519",
            "ssh-copy-id -i key",
            "ssh-add -K private",
            "ssh-agent -s key"
        ],
        "correct": 1,
        "time": 20
    },
    {
        "q": "การทำ SSH Hardening ในไฟล์ /etc/ssh/sshd_config เพื่อห้ามใช้รหัสผ่านในการเข้าสู่ระบบทุกกรณี ต้องกำหนดตัวแปรใด?",
        "options": [
            "PasswordAuthentication no",
            "PermitRootLogin no",
            "AllowUsers keyonly",
            "DisablePassword Login yes"
        ],
        "correct": 1,
        "time": 25
    },
    {
        "q": "ข้อใดเป็นกฎเหล็กที่สำคัญที่สุดเมื่อคุณทำการแก้ไขไฟล์ตั้งค่า SSH และสั่ง reload บริการ SSH Server ใหม่?",
        "options": [
            "สั่งปิดการทำ Port Forwarding ของเราเตอร์ทันที",
            "ห้ามรันคำสั่ง sshd -t ก่อนการเริ่มระบบใหม่เด็ดขาด",
            "ห้ามปิด Terminal หน้าต่างเดิมจนกว่าจะทดสอบเปิดล็อกอินหน้าใหม่ผ่านสำเร็จ",
            "ลบไฟล์กุญแจ Private Key ทิ้งเพื่อเพิ่มความปลอดภัย"
        ],
        "correct": 3,
        "time": 30
    }
]

def generate_xlsx(questions, output_path):
    try:
        wb = openpyxl.load_workbook('./documents/QuizizzSampleSpreadsheetUpdated_v2.xlsx')
        ws = wb.active
        
        # Clear all cells from row 3 downwards (up to 100)
        for r in range(3, 100):
            for c in range(1, 15):
                ws.cell(row=r, column=c).value = None
                
        # Populate questions
        for idx, q_data in enumerate(questions):
            row = idx + 3
            ws.cell(row=row, column=1).value = q_data["q"]
            ws.cell(row=row, column=2).value = "Multiple Choice"
            ws.cell(row=row, column=3).value = q_data["options"][0]
            ws.cell(row=row, column=4).value = q_data["options"][1]
            ws.cell(row=row, column=5).value = q_data["options"][2]
            ws.cell(row=row, column=6).value = q_data["options"][3]
            ws.cell(row=row, column=7).value = None
            ws.cell(row=row, column=8).value = q_data["correct"]
            ws.cell(row=row, column=9).value = q_data["time"]
            ws.cell(row=row, column=10).value = None
            ws.cell(row=row, column=11).value = None
            
        wb.save(output_path)
        print(f"Successfully generated {output_path}")
    except Exception as e:
        print(f"Error generating spreadsheet: {e}")

if __name__ == '__main__':
    generate_xlsx(w6a_questions, './public/data/week-6a_wayground_import.xlsx')
