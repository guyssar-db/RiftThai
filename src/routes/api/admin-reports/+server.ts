import { json } from '@sveltejs/kit';

import { getAuthenticatedUser } from '$lib/server/auth';
import { isCardReportStatus, listCardReports, updateCardReport } from '$lib/server/card-reports';
import { checkRateLimit, clientKey, rateLimitHeaders } from '$lib/server/security';

export const GET = async ({ cookies, url }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	const status = url.searchParams.get('status')?.trim() ?? '';
	const reports = await listCardReports(isCardReportStatus(status) ? status : '');
	return json({ reports });
};

export const PATCH = async ({ request, cookies, getClientAddress }) => {
	const user = await getAuthenticatedUser(cookies);
	if (!user) return json({ error: 'login required' }, { status: 401 });
	if (!user.isAdmin) return json({ error: 'admin required' }, { status: 403 });

	const rateLimit = checkRateLimit(`admin-reports:${clientKey(getClientAddress())}:${user.id}`, {
		windowMs: 60_000,
		max: 30
	});
	if (rateLimit.limited) {
		return json(
			{ error: 'too many report updates. please try again later' },
			{ status: 429, headers: rateLimitHeaders(rateLimit.retryAfter) }
		);
	}

	const body = await request.json().catch(() => null);
	const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
	const status = isCardReportStatus(body?.status) ? body.status : null;
	const adminNote = typeof body?.adminNote === 'string' ? body.adminNote.trim().slice(0, 2000) : '';
	if (!reportId || !status) return json({ error: 'invalid report update' }, { status: 400 });

	const report = await updateCardReport(reportId, { status, adminNote });
	return json({ report });
};
