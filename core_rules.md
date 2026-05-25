# สรุป Riftbound Core Rules

แหล่งอ้างอิง: https://cmsassets.rgpub.io/sanity/files/dsfx7636/news_live/572377fcaa704a05f72eb42c104079d3b3bcf740.pdf

วันที่ในเอกสาร PDF: Last Updated 2025-12-01

ไฟล์นี้เป็นสรุปภาษาไทยสำหรับอ่านเร็วและใช้เป็นฐานข้อมูล RAG ไม่ใช่เอกสารกฎฉบับเต็ม หากต้องตัดสิน ruling อย่างเป็นทางการให้เทียบกับ PDF ต้นฉบับเสมอ

## Golden Rule และ Silver Rule

- ข้อความบนการ์ดมาก่อนกฎปกติ ถ้าการ์ดขัดกับกฎพื้นฐาน ให้ทำตามการ์ด
- ภาษาบนการ์ดเป็นภาษาสำหรับผู้เล่น ไม่ใช่ภาษากฎแบบ technical จึงต้องตีความผ่านคำจำกัดความใน Core Rules
- คำว่า `card` ในเอฟเฟกต์โดยทั่วไปหมายถึงการ์ดใน Main Deck ไม่รวม Rune, Legend และ Battlefield เว้นแต่บริบทของกฎระบุเป็นอย่างอื่น
- การ์ดอ้างถึงตัวเองต่างกันตามชนิด: Unit/Legend ใช้ I/me, Gear/Spell ใช้ this, Battlefield ใช้ here
- เอฟเฟกต์ที่บอกว่า "ทำไม่ได้" โดยทั่วไปจะชนะเอฟเฟกต์ที่บอกว่า "ทำได้"
- เวลาทำตามข้อความการ์ด ให้ทำเท่าที่ทำได้และข้ามส่วนที่เป็นไปไม่ได้ ถ้าทุกส่วนทำไม่ได้ การ์ดยัง resolve แต่ไม่มีอะไรเกิดขึ้น

## การจัดเด็ค

- ผู้เล่นต้องมี Champion Legend, Main Deck, Rune Deck และ Battlefield ตามจำนวนที่โหมดการเล่นกำหนด
- Champion Legend เป็นตัวกำหนด Domain Identity ของเด็ค
- การ์ดใน Main Deck ต้องอยู่ใน Domain Identity ที่ถูกต้อง
- Main Deck มีอย่างน้อย 40 ใบ
- Chosen Champion ต้องเป็น Champion Unit ที่มี champion tag ตรงกับ Champion Legend และเริ่มเกมใน Champion Zone
- ใส่การ์ดชื่อเดียวกันได้สูงสุด 3 ใบ รวมถึง Chosen Champion ด้วย
- Signature card ใส่ได้รวมสูงสุด 3 ใบ และต้องมี champion tag ตรงกับ Champion Legend
- Rune Deck มี 12 ใบ ต้องตรง Domain Identity และแยกจาก Main Deck
- Battlefield ใช้ตามจำนวนที่โหมดกำหนด ถ้าโหมดต้องใช้หลาย Battlefield โดยทั่วไปห้ามซ้ำชื่อเดียวกัน

## พื้นที่เล่นและโซน

- The Board คือพื้นที่ที่ Game Object อยู่ระหว่างเล่น
- Base เป็นพื้นที่ของผู้เล่นแต่ละคน ใช้ลง Unit/Gear ได้เสมอ และเป็นที่อยู่ของ Rune บน Board
- Battlefield Zone มี Battlefield หลายใบ แต่ละ Battlefield เป็น Location แยกกัน
- Facedown Zone ใช้กับ Hidden card ที่ผูกกับ Battlefield แต่ไม่ถือเป็น Location
- Legend Zone ใช้เก็บ Champion Legend และไม่ถือเป็น Location
- Non-Board Zone รวมถึง Main Deck, Rune Deck, Hand, Trash, Banish และโซนอื่นที่เอฟเฟกต์กำหนด
- Ownership กับ Control เป็นคนละเรื่อง เจ้าของการ์ดปกติไม่เปลี่ยน แต่ผู้ควบคุมเปลี่ยนได้จากเอฟเฟกต์

## ชนิดของการ์ดและ Game Object

- Unit เป็น Permanent มี Might เคลื่อนที่ ต่อสู้ และ Exhaust ได้
- Gear เป็น Permanent ที่อยู่บน Board และอาจติดกับ Unit หรือทำงานตามข้อความการ์ด
- Spell ทำเอฟเฟกต์แล้วไป Trash
- Battlefield เป็นทั้ง Game Object และ Location ที่ผู้เล่นสามารถ Contest, Conquer หรือ Hold ได้
- Legend อยู่นอกเด็คปกติ ไม่ถูกเล่นแบบการ์ดทั่วไป และอาจมี Passive, Triggered หรือ Activated Ability
- Token ถูกสร้างบน Board และถ้าไปอยู่ Non-Board Zone จะหายไป

## Cost และ Resource

- Main Deck card อาจมี Energy cost และ Power cost
- Energy cost คือเลขในช่อง cost
- Power cost คือสัญลักษณ์ Rune ในช่อง cost
- ถ้าเอฟเฟกต์ต้องดู cost ของการ์ด ให้ดู base cost แม้ตอนเล่นจริง cost จะถูกลด เพิ่ม หรือถูก ignore
- Rune สร้าง resource ให้ใช้เล่นการ์ดหรือจ่ายเอฟเฟกต์
- Energy และ Power ที่เหลือจะหายไปเมื่อจบเทิร์น

## โครงสร้างเทิร์น

เทิร์นแบ่งเป็น 3 ช่วงใหญ่:

1. Start of Turn
2. Action Phase
3. End of Turn

Start of Turn:

- Awaken Phase: Turn Player ทำให้ Game Object ที่ตนควบคุมกลับมา Ready เท่าที่ทำได้
- Beginning Phase: ทำเอฟเฟกต์ช่วงเริ่มต้น และคิดคะแนนจาก Hold
- Channel Phase: Turn Player ได้ Rune เพิ่มสำหรับเทิร์นนั้น

Action Phase:

- Turn Player ทำ Discretionary Action ได้ตาม timing ที่ถูกต้อง
- โดยปกติเป็น Neutral Open State และ Turn Player เป็นคนหลักที่เล่น spell/ability ได้
- ในโหมดทีม เพื่อนร่วมทีมอาจเล่น spell หรือ activate ability ได้ตามกฎของโหมดและ timing
- Combat หรือ Showdown อาจเกิดจาก Move, การเล่น Unit, Spell หรือเอฟเฟกต์อื่น

End of Turn:

- ทำเอฟเฟกต์ end of turn
- ทำ cleanup ช่วงจบเทิร์น รวมถึงการ heal Unit ตาม global cleanup
- เอฟเฟกต์แบบ "this turn" หมดอายุพร้อมกัน
- Rune Pool ว่างลง Energy/Power ที่ไม่ได้ใช้หายไป
- ส่งเทิร์นให้ผู้เล่นถัดไปตาม Turn Order

## Priority, Focus และสถานะของเทิร์น

- Priority คือสิทธิ์ในการทำ Discretionary Action
- ในเวลาเดียวกันมีผู้เล่นที่มี Priority ได้ไม่เกิน 1 คน
- Focus ใช้ใน Showdown Open State เพื่อกำหนดว่าใครมีสิทธิ์ทำ action ใน Showdown
- ผู้เล่นที่ได้ Focus จะได้ Priority ด้วย แต่การ pass Priority ไม่ได้ทำให้เสีย Focus ทันที
- สถานะหลักของเทิร์นมี 4 แบบ:
  - Neutral Open: ไม่มี Showdown และไม่มี Chain
  - Neutral Closed: ไม่มี Showdown แต่มี Chain
  - Showdown Open: มี Showdown แต่ไม่มี Chain
  - Showdown Closed: มี Showdown และมี Chain
- ใน Closed State โดยทั่วไปจะเล่นการ์ดหรือ ability ไม่ได้ เว้นแต่ timing ของการ์ด/ability อนุญาต

## Chain และการ Resolve

- การเล่นการ์ดหรือ activate ability อาจสร้าง Pending Item และ Chain Item
- ผู้เล่น pass Priority ตามลำดับ ถ้าทุกคน pass โดยไม่เพิ่มอะไรเข้า Chain ให้ resolve item ล่าสุด
- Chain resolve ทีละ item โดย item ใหม่สุด resolve ก่อน
- เมื่อ Chain ว่าง เกมกลับสู่ Open State
- ระหว่าง cleanup บางแบบ Chain Item จะยัง resolve ไม่ได้ แม้อาจมี Pending Item ถูกสร้างขึ้นได้

## การเล่นการ์ดและ Target

ลำดับโดยสรุปของการเล่นการ์ด:

1. ประกาศว่าจะเล่นการ์ด
2. เลือกสิ่งที่ต้องเลือก เช่น location, mode, target
3. คำนวณและจ่าย cost
4. เช็กความถูกต้องตามกฎ
5. finalize แล้ว resolve หรือวางลงโซนที่ถูกต้อง

ข้อควรจำเรื่อง target:

- ถ้าการ์ดให้เลือก Game Object แบบเฉพาะเจาะจง สิ่งนั้นถือเป็น target
- target ต้องถูกต้องตอนนำ spell/ability เข้า Chain
- เอฟเฟกต์ที่กระทบทุกสิ่งตามเงื่อนไข เช่น "Kill all gear" ไม่ถือว่า target รายตัว
- ถ้าการเล่นต่อจะทำให้เกิดสถานะผิดกฎ หรือ choice ไม่ถูกต้อง ให้ undo ขั้นตอนนั้นและ cancel action

## Permanent และ Spell ตอนถูกเล่น

- Permanent ออกจาก Chain แล้วกลายเป็น Game Object
- Unit เข้า Board แบบ Exhausted ที่ location ที่เลือก เว้นแต่เอฟเฟกต์เปลี่ยน
- Gear เข้า Board แบบ Ready ที่ Base ของผู้เล่น เว้นแต่เอฟเฟกต์เปลี่ยน
- Spell อยู่บน Chain ระหว่าง resolve ทำเอฟเฟกต์ แล้วไป Trash

## Ability

Passive Ability:

- มีผลตลอดเวลาที่ active
- โดยทั่วไปไม่ใช้ Chain

Activated Ability:

- สังเกตจากรูปแบบ cost ตามด้วย `:` แล้วตามด้วย effect
- ใช้ Chain
- คู่แข่งตอบสนองได้ตาม timing เหมือน chain item อื่น

Triggered Ability:

- เกิดเมื่อ condition ของ ability สำเร็จ
- ต้องผ่านขั้นตอนก่อนกลายเป็น Chain Item
- ถ้าไม่มี legal choice ตอนจะเข้ Chain ให้เอา ability ออกจาก Chain ไม่ถือว่าโดน counter

Reflexive Trigger:

- เป็น triggered ability ชนิดหนึ่ง มักใช้ข้อความอย่าง `Do this:`
- เมื่อเงื่อนไขสำเร็จ อาจเพิ่ม Chain Item หนึ่งหรือหลายรายการ

## Game Action ที่เจอบ่อย

- Draw: หยิบการ์ดจากบน Main Deck เข้ามือ ถ้าจั่วไม่พอ ให้จั่วเท่าที่มี ทำ Burn Out แล้วจั่วต่อให้ครบตามที่ต้องจั่ว
- Ready: ทำให้ object ที่ Exhausted กลับมา Ready
- Exhaust: ทำให้ object ที่ Ready กลายเป็น Exhausted มักใช้เป็น cost
- Heal: เอา damage ออกจาก Unit ตามเอฟเฟกต์หรือ cleanup
- Stun: Unit ที่ Stunned ไม่ใช้ Might ใน combat damage และจะหาย Stun ตอนต้น Ending Step ถัดไป
- Swap: สลับค่าตัวเลขโดยเพิ่มค่าต่ำและลดค่าสูงตามส่วนต่าง
- Move: การเคลื่อนที่ปกติของ Unit ในเลนของตัวเอง โดยทั่วไปคือ Base ไป Battlefield หรือ Battlefield กลับ Base และ Standard Move มักต้อง Exhaust Unit เป็น cost
- Ganking: ความสามารถพิเศษที่อนุญาตให้ Unit เคลื่อนที่จาก Battlefield หนึ่งไปยังอีก Battlefield หนึ่งได้โดยตรง ซึ่งไม่ใช่สิ่งที่ Move ปกติทำได้เอง
- Recall: ย้าย Permanent กลับ Base โดยไม่ถือว่าเป็น Move จึงไม่ trigger ability ที่สนใจ Move และไม่ถูกหยุดด้วยข้อห้าม Move

## Movement, Control และ Battlefield

- Unit ปกติใช้ Standard Move ได้ใน Action Phase ของผู้ควบคุม
- Move ปกติต้องเลือก destination ที่ถูกต้องตามกฎ movement ปกติ คือ Base ไป Battlefield หรือ Battlefield กลับ Base ในแนวที่อนุญาต
- Unit ไม่สามารถ Move จาก Battlefield หนึ่งไปยังอีก Battlefield หนึ่งได้โดยตรง เว้นแต่มี Ganking หรือ card/effect ที่ระบุให้ทำได้
- Unit ที่ย้ายไป Battlefield อาจทำให้ Battlefield นั้นกลายเป็น Contested
- ถ้ามี Unit ของผู้เล่นฝ่ายตรงข้ามอยู่ด้วย อาจเกิด staged combat
- ใน multiplayer Combat เกิดได้ระหว่างผู้เล่น 2 คนเท่านั้น ถ้า Battlefield มี staged/ongoing combat ผู้เล่นที่ไม่เกี่ยวข้องอาจเข้าไปไม่ได้

## Showdown และ Combat

- Showdown เริ่มเมื่อ Battlefield กลายเป็น Contested ในสถานะเทิร์นที่ถูกต้อง
- ผู้เล่นที่ทำให้ Battlefield กลายเป็น Contested จะเป็น Attacker
- ผู้เล่นอีกฝ่ายที่เกี่ยวข้องเป็น Defender
- Unit ที่อยู่ Battlefield นั้นได้รับ designation เป็น Attacker หรือ Defender ตามผู้ควบคุม
- เมื่อ Showdown ปิด ถ้าทั้งสองฝั่งยังมี Unit อยู่ จะเข้าสู่ Combat Damage Step
- แต่ละฝั่งรวม Might ปัจจุบันของ Unit ที่เกี่ยวข้อง
- เริ่มจาก Attacker ผู้เล่น assign damage เท่ากับ Might รวมของตนใส่ Unit ฝ่ายตรงข้าม
- Assign damage ยังไม่ใช่การ deal damage; เมื่อ assign เสร็จ damage จะถูก deal พร้อมกัน
- โดยทั่วไปต้อง assign lethal damage ให้ Unit หนึ่งก่อนจึงค่อยกระจาย damage ส่วนเกินไปที่อื่น เว้นแต่เอฟเฟกต์เปลี่ยนกฎนี้
- ถ้ามีหลาย staged combat พร้อมกัน Turn Player เลือกว่าจะ resolve combat ไหนก่อน

## Scoring, Conquer และ Hold

- ผู้เล่นทำคะแนนได้จาก Conquer หรือ Hold ตามสถานะ Battlefield และ timing
- ผู้เล่น score ได้เพียงครั้งเดียวต่อ Battlefield ต่อเทิร์น
- เมื่อ score จะได้รับได้สูงสุด 1 point และอาจ trigger score ability ที่ Battlefield
- กฎ final point สำคัญ:
  - ถ้าคะแนนเหลืออีก 1 point ถึงชนะ การ score จาก Hold ให้ final point ได้
  - ถ้า score จาก Conquer จะได้ final point ก็ต่อเมื่อ turn นั้นผู้เล่น score ทุก Battlefield แล้ว
  - ถ้ายัง score ไม่ครบทุก Battlefield จาก Conquer ให้จั่วการ์ดแทนการได้ final point

## Layers

- Continuous effect และ effect ที่เปลี่ยนค่าหรือคุณสมบัติใช้ระบบ layers
- Layers ใช้ตัดสินผลสุดท้ายเมื่อหลายเอฟเฟกต์เปลี่ยน object พร้อมกัน
- ถ้ามีหลายเอฟเฟกต์ใน layer เดียวกัน ให้ใช้กฎ timestamp, dependency และชนิดของเอฟเฟกต์ตามเอกสารเต็ม

## โหมดการเล่น

แต่ละโหมดต้องกำหนด:

- จำนวนผู้เล่น
- รูปแบบผู้เล่น เช่น 1v1, team หรือ free-for-all
- Victory Score
- จำนวน Battlefield
- วิธี setup
- format
- first turn process
- unique rules เฉพาะโหมด

Sanctioned modes ใน PDF นี้:

- 1v1 Duel: ผู้เล่น 2 คน, Victory Score 8, Battlefield 2 ใบ, Best of 1, ผู้เล่นที่สอง Channel Rune เพิ่มใน Channel Phase แรก
- 1v1 Match: ผู้เล่น 2 คน, Victory Score 8 ต่อเกม, Battlefield 2 ใบ, Best of 3, Battlefield ที่ใช้แล้วถูกเอาออกระหว่างเกมและเลือกจากที่เหลือ
- FFA3 Skirmish: ผู้เล่น 3 คน, Victory Score 8, Battlefield 3 ใบ, Best of 1, ผู้เล่นแรกไม่จั่วใน Draw Phase แรก และผู้เล่นสุดท้าย Channel Rune เพิ่มใน Channel Phase แรก
- FFA4 War: ผู้เล่น 4 คน, Victory Score 8, Battlefield 3 ใบ, Best of 1, Battlefield ของผู้เล่นแรกไม่ถูกใช้, ผู้เล่นแรกไม่จั่วใน Draw Phase แรก, ผู้เล่นสุดท้าย Channel Rune เพิ่มใน Channel Phase แรก
- 2v2 Magma Chamber: ผู้เล่น 4 คน แบ่งทีม 2v2, Victory Score 11, Battlefield 3 ใบ, turn order สลับทีม

## Additional Rules และ Keyword

- Unit บน Board ถูกประเมินจาก Might ปัจจุบัน ไม่ใช่แค่ค่า printed Might
- Inactive object หรือ ability อาจมีอยู่แต่ไม่มีผลจนกว่าจะ active
- Shield เป็น Passive Ability keyword
- Shield X หมายถึง Unit ได้ +X Might ขณะเป็น Defender
- ถ้า Shield ไม่มีเลข ให้ถือว่าเป็น Shield 1
- ถ้า Unit ได้ Shield จากหลายแหล่ง ให้นำค่า Shield มารวมกัน

## ข้อควรจำสำหรับ ruling

- ถ้าการ์ดต้องเลือก target ให้เช็ก zone และ legality ของ target ใน timing ที่ถูกต้อง
- ถ้าเอฟเฟกต์มีหลายส่วน ให้ทำตามลำดับและทำเท่าที่เป็นไปได้
- ถ้า choice จะทำให้ Combat มีผู้เล่นมากกว่า 2 คนใน multiplayer choice นั้นอาจผิดกฎ หรือถูก redirect ตามกฎของ multiplayer
- Unit ที่เข้า Board แบบ Exhausted ยังจ่าย cost ที่ต้อง Exhaust ไม่ได้จนกว่าจะ Ready
- Hidden/facedown card ที่ผูกกับ Battlefield ต้องเช็กตอน cleanup หากผู้ควบคุมเสีย control ของ Battlefield
- เวลาถามเรื่องแต้มสุดท้าย ต้องแยกว่าแต้มมาจาก Hold, Conquer หรือ source อื่น
