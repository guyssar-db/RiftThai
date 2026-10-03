import { json } from '@sveltejs/kit';
export const POST = () => json({ success: false, message: 'กรุณาแก้ไขข้อมูลการ์ดผ่าน RiftData' }, { status: 410 });
