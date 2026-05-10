# CS232_FinalProject
Introduction to Cloud Computing Technology (2/2568) Final Project <br>
**ธีมที่ 1 Smart Classrooms** <br>
&nbsp;&nbsp;&nbsp;&nbsp;**Pain Point** : ประกาศและการบ้านอยู่หลายช่องทางจนผู้เรียนพลาดข้อมูล, ลืมเดดไลน์บ่อย, ส่งงานหลายรูปแบบจนตรวจและตามงานยาก, อาจารย์อยากเห็นสถานะการส่งแบบรวมศูนย์

# ClassHub

ระบบจัดการห้องเรียนออนไลน์แบบรวมศูนย์ที่ช่วยบูรณาการข้อมูลการบ้านและประกาศจากแพลตฟอร์มภายนอก (Course Web และ TU Moodle) มาไว้ในที่เดียว เพื่อลดปัญหาข้อมูลกระจัดกระจายและป้องกันการพลาดกำหนดส่งงาน

## สถาปัตยกรรมและเทคโนโลยีที่ใช้ (Tech Stack)

ระบบนี้พัฒนาด้วยสถาปัตยกรรมแบบ Cloud-Native Serverless บน AWS:
* **Frontend:** Amazon S3 (Static Website Hosting)
* **Backend:** AWS Lambda และ Amazon API Gateway
* **Database:** Amazon RDS (PostgreSQL)
* **File Storage:** Amazon S3 (สำหรับจัดเก็บไฟล์แนบส่งงาน)
* **External Data Scraper:** Amazon ECS (Fargate) และ Amazon ECR
* **Notification:** Amazon SNS (สำหรับส่งอีเมลแจ้งเตือน)

## ฟีเจอร์หลัก (Features)

* **ส่วนของนักเรียน:** สามารถค้นหาการบ้าน ดูสถานะการส่งงาน อัปโหลดไฟล์ส่งการบ้าน และกด Sync ข้อมูลจากแพลตฟอร์มการศึกษาภายนอกได้
* **ส่วนของอาจารย์:** สามารถสร้างการบ้าน กำหนดรูปแบบไฟล์ที่อนุญาตให้ส่ง และติดตามภาพรวมการส่งงานของนักเรียนผ่าน Teacher Dashboard

## การติดตั้งและการตั้งค่า (Installation & Setup)

1. Clone repository นี้ลงเครื่อง:
   `git clone https://github.com/Starlight444/CS232_FinalProject.git`
2. ตั้งค่า Environment Variables ที่จำเป็นในส่วนของ Backend:
   * `DATABASE_URL` สำหรับเชื่อมต่อฐานข้อมูล
   * `S3_BUCKET` สำหรับเก็บไฟล์แนบ
3. นำไฟล์ Frontend (HTML, CSS, JS) ไปโฮสต์บน S3 และตั้งค่า CORS ให้เรียบร้อย
4. อัปโหลด Backend (ไฟล์ .zip) ขึ้น AWS Lambda และกำหนด Handler ให้ถูกต้อง

## สมาชิกผู้จัดทำ (กลุ่ม 15)
1. นางสาวสนา รอดนวน 6709510017
2. นางสาวชาลิสา ขนาบศักดิ์ 6709616442
3. นางสาวมินท์ธิตา กุลพัฒน์จิรกุล 6709616822
4. นางสาวเมธาวี สมใจ 6709616830
5. นางสาวศวิตา ปานชนะ 6709616863
6. นางสาวศุธาพร พันธ์เสน่ห์ 6709616889
7. นางสาวสุนันธิดา แพงเบ้า 6709616947

## Teamwork evidence
[Issue 24](https://github.com/Starlight444/CS232_FinalProject/issues/24)
