# RiftThai 🇹🇭

RiftThai เป็นโปรเจกต์แฟนเมดที่สร้างขึ้นเพื่อรวบรวมข้อมูลและการแปลภาษาไทยสำหรับเกม **Riftbound** เพื่อให้ผู้เล่นชาวไทยสามารถเข้าถึงข้อมูลการ์ด ความสามารถ และคำศัพท์เฉพาะทางได้ง่ายขึ้น

## คุณสมบัติเด่น (Features)

- 🔍 **Card Database:** ค้นหาและดูข้อมูลการ์ดทั้งหมดในเกมพร้อมรูปภาพประกอบ
- 🇹🇭 **Thai Translation:** แปลความหมายและความสามารถของการ์ดเป็นภาษาไทยที่เข้าใจง่าย
- 📖 **Keywords Guide:** รวบรวมคำศัพท์เฉพาะทาง (Keywords) และสัญลักษณ์ (Icons) ต่างๆ พร้อมคำอธิบาย
- 📱 **Responsive Design:** รองรับการใช้งานทั้งบนคอมพิวเตอร์และมือถือ
- ⚡ **Fast Performance:** พัฒนาด้วย SvelteKit เพื่อความรวดเร็วในการใช้งาน

## เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Styling:** Vanilla CSS & TailwindCSS
- **Language:** TypeScript
- **Data Source:** JSON Based Database

## การติดตั้งและใช้งาน (Local Setup)

หากต้องการรันโปรเจกต์นี้บนเครื่องของคุณเอง:

1. **Clone โปรเจกต์:**
   ```bash
   git clone https://github.com/guyssar-db/RiftThai.git
   cd RiftThai
   ```

2. **ติดตั้ง Dependencies:**
   ```bash
   npm install
   ```

3. **รันโปรเจกต์ในโหมด Development:**
   ```bash
   npm run dev -- --open
   ```

## โครงสร้างโปรเจกต์ (Project Structure)

- `src/lib/data/`: เก็บข้อมูลการ์ดหลัก (`cards.json`) และข้อมูล Keywords (`keywords.ts`)
- `src/lib/components/`: ส่วนประกอบต่างๆ ของ UI เช่น CardModal, SearchBar, KeywordSection
- `static/images/icons/`: ไฟล์ไอคอนและสัญลักษณ์ต่างๆ ที่ใช้ในเกม

## การมีส่วนร่วม (Contribution)

โปรเจกต์นี้ยินดีรับการสนับสนุนจากทุกคน! หากคุณพบคำแปลที่ผิดพลาด หรือต้องการเสนอแนะฟีเจอร์ใหม่ๆ สามารถเปิด [Issues](https://github.com/guyssar-db/RiftThai/issues) หรือส่ง [Pull Request](https://github.com/guyssar-db/RiftThai/pulls) มาได้เลยครับ

---

### ข้อสงวนสิทธิ์ (Disclaimer)
RiftThai เป็นโปรเจกต์ที่สร้างโดยแฟนเกม (Fan-made project) ข้อมูลการ์ด รูปภาพ และเครื่องหมายการค้าทั้งหมดเป็นลิขสิทธิ์ของ Riot Games และผู้พัฒนาเกม Riftbound
