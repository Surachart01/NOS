import openpyxl
import random

# The 10 core questions for Week 7b
w7b_master_questions = [
    {
        "q": "UFW ย่อมาจากคำเต็มว่าอะไร?",
        "options": [
            "Universal File Wrapper",
            "Uncomplicated Firewall",
            "User Friendly Website",
            "Unified Flow Window"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "กฎ UFW เริ่มต้น (Default Policy) หลังจากติดตั้งมักถูกกำหนดไว้อย่างไรเพื่อความปลอดภัยสูงสุด?",
        "options": [
            "อนุญาตสัญญาณเข้าทั้งหมด และบล็อกสัญญาณออกทั้งหมด",
            "บล็อกสัญญาณเข้าทั้งหมด และอนุญาตสัญญาณออกทั้งหมด",
            "บล็อกทั้งสัญญาณเข้าและออกทั้งหมด",
            "เปิดบริการทุกพอร์ตโดยไม่มีการตรวจสอบใดๆ"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "คำสั่งใดใช้เพื่อเปิดใช้งานระบบ UFW Firewall ให้ทำงาน?",
        "options": [
            "sudo ufw start",
            "sudo ufw run",
            "sudo ufw enable",
            "sudo ufw service-start"
        ],
        "correct": 3,
        "time": 30
    },
    {
        "q": "หากต้องการบล็อกทุกการเชื่อมต่อจากไอพี 192.168.1.50 ไม่ให้เข้าเซิร์ฟเวอร์ของเรา ควรเขียนคำสั่งอย่างไร?",
        "options": [
            "sudo ufw block 192.168.1.50",
            "sudo ufw deny from 192.168.1.50",
            "sudo ufw reject to 192.168.1.50",
            "sudo ufw drop 192.168.1.50"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "ถ้าต้องการเปิดพอร์ต 80 (HTTP) เฉพาะโปรโตคอล TCP ควรพิมพ์คำสั่งอย่างไร?",
        "options": [
            "sudo ufw allow 80/tcp",
            "sudo ufw open port 80",
            "sudo ufw permit tcp 80",
            "sudo ufw add rule 80 tcp"
        ],
        "correct": 1,
        "time": 20
    },
    {
        "q": "คำสั่งในข้อใดเป็นการอนุญาตเฉพาะเครื่องไอพี 192.168.1.150 เข้าถึงพอร์ตฐานข้อมูล 3306 (TCP) ได้ถูกต้องที่สุด?",
        "options": [
            "sudo ufw allow 3306/tcp to 192.168.1.150",
            "sudo ufw allow from 192.168.1.150 to any port 3306 proto tcp",
            "sudo ufw permit from 192.168.1.150 port 3306",
            "sudo ufw whitelist 192.168.1.150 on port 3306"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "ไฟล์ใดในเซิร์ฟเวอร์ Ubuntu ที่ทำหน้าที่บันทึกประวัติเหตุการณ์สกัดกั้นข้อมูลของ UFW (Firewall Log)?",
        "options": [
            "/var/log/nginx/access.log",
            "/var/log/syslog/ufw.log",
            "/var/log/ufw.log",
            "/etc/ufw/rules.log"
        ],
        "correct": 3,
        "time": 25
    },
    {
        "q": "หากต้องการดูบันทึก Log UFW แบบอัปเดตสดๆ ตลอดเวลาในขณะที่เพื่อนกำลังสแกนพอร์ตเรา ควรใช้คำสั่งใด?",
        "options": [
            "cat /var/log/ufw.log",
            "sudo tail -f /var/log/ufw.log",
            "sudo watch ufw.log",
            "less /var/log/ufw.log"
        ],
        "correct": 2,
        "time": 30
    },
    {
        "q": "ใน UFW Log ไฟล์ /var/log/ufw.log ค่าตัวย่อ DPT และ SRC ย่อมาจากอะไรตามลำดับ?",
        "options": [
            "Data Packet Type และ Server Rule Code",
            "Database Port และ Security Router Connection",
            "Destination Port (พอร์ตปลายทาง) และ Source IP (ไอพีผู้ส่งต้นทาง)",
            "Direction Policy และ Source Port"
        ],
        "correct": 3,
        "time": 25
    },
    {
        "q": "เพื่อป้องกันภัยคุกคามประเภท Brute-Force โจมตีพอร์ต 22 (SSH) ด้วยการสุ่มรหัสผ่าน UFW มีฟีเจอร์จำกัดความถี่การเชื่อมต่อที่เรียกว่าอะไร?",
        "options": [
            "ufw deny 22/tcp",
            "ufw limit 22/tcp",
            "ufw block-abuse 22",
            "ufw ssh-secure"
        ],
        "correct": 2,
        "time": 25
    }
]

def generate_shuffled_questions(master_list, seed_questions, seed_options):
    shuffled = []
    # Shuffle question indices
    indices = list(range(len(master_list)))
    random.seed(seed_questions)
    random.shuffle(indices)
    
    for i, idx in enumerate(indices):
        q_data = master_list[idx]
        correct_val = q_data["options"][q_data["correct"] - 1]
        
        # Copy and shuffle options using a unique seed per question
        options = list(q_data["options"])
        random.seed(seed_options + idx)
        random.shuffle(options)
        
        new_correct = options.index(correct_val) + 1
        shuffled.append({
            "q": q_data["q"],
            "options": options,
            "correct": new_correct,
            "time": q_data["time"]
        })
    return shuffled

def generate_xlsx(questions, output_path):
    try:
        wb = openpyxl.load_workbook('./documents/QuizizzSampleSpreadsheetUpdated_v2.xlsx')
        ws = wb.active
        
        # Clear existing content from row 3 to 100
        for r in range(3, 100):
            for c in range(1, 15):
                ws.cell(row=r, column=c).value = None
                
        # Populate spreadsheet with shuffled questions
        for idx, q_data in enumerate(questions):
            row = idx + 3
            ws.cell(row=row, column=1).value = q_data["q"]
            ws.cell(row=row, column=2).value = "Multiple Choice"
            ws.cell(row=row, column=3).value = q_data["options"][0]
            ws.cell(row=row, column=4).value = q_data["options"][1]
            ws.cell(row=row, column=6).value = q_data["options"][3] if len(q_data["options"]) > 3 else None
            ws.cell(row=row, column=5).value = q_data["options"][2] if len(q_data["options"]) > 2 else None
            ws.cell(row=row, column=7).value = None
            ws.cell(row=row, column=8).value = q_data["correct"]
            ws.cell(row=row, column=9).value = q_data["time"]
            ws.cell(row=row, column=10).value = None
            ws.cell(row=row, column=11).value = None
            
        wb.save(output_path)
        print(f"Successfully generated {output_path} with {len(questions)} questions")
    except Exception as e:
        print(f"Error generating {output_path}: {e}")

if __name__ == '__main__':
    # Generate Pre-test (using seed set A)
    pre_questions = generate_shuffled_questions(w7b_master_questions, seed_questions=42, seed_options=100)
    generate_xlsx(pre_questions, './public/data/week-7b_pre_wayground.xlsx')
    
    # Generate Post-test (using seed set B - different shuffle order)
    post_questions = generate_shuffled_questions(w7b_master_questions, seed_questions=99, seed_options=200)
    generate_xlsx(post_questions, './public/data/week-7b_post_wayground.xlsx')
