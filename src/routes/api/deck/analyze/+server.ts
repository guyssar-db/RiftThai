import { json } from '@sveltejs/kit';
export const POST = () => json({ error: 'ฟีเจอร์วิเคราะห์เด็คด้วย AI ปิดใช้งานแล้ว' }, { status: 410 });
