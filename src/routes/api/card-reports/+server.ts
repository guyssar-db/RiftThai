import { json } from '@sveltejs/kit';

import { createCardReport, isCardReportType } from '$lib/server/card-reports';
import { getAuthenticatedUser } from '$lib/server/auth';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const POST = async ({ request, cookies, getClientAddress }) => {
	try {
		const user = await getAuthenticatedUser(cookies);
		const rateLimit = checkRateLimit(
			`card-report:${clientKey(getClientAddress())}:${user?.id ?? 'anon'}`,
			{
				windowMs: 60_000,
				max: 5
			}
		);
		if (rateLimit.limited) {
			return json(
				{ error: 'too many reports. please try again later' },
				{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
			);
		}

		const body = await request.json().catch(() => null);
		const cardCode = typeof body?.cardCode === 'string' ? body.cardCode.trim().slice(0, 80) : '';
		const cardName = typeof body?.cardName === 'string' ? body.cardName.trim().slice(0, 160) : '';
		const reportType = isCardReportType(body?.reportType) ? body.reportType : 'other';
		const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : '';

		if (!cardCode || !cardName || message.length < 4) {
			return json({ error: 'กรุณาระบุการ์ดและรายละเอียดที่ต้องการรายงาน' }, { status: 400 });
		}

		const report = await createCardReport({ user, cardCode, cardName, reportType, message });
		return json({ report });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'ส่งรายงานไม่สำเร็จ' },
			{ status: 500 }
		);
	}
};
