import { getRagConfig } from '$lib/server/rag/config';
import type { AuthUser } from '$lib/server/auth';
import type { CardReport, CardReportStatus, CardReportType } from '$lib/types/cardReport';

export async function createCardReport(input: {
	user: AuthUser | null;
	cardCode: string;
	cardName: string;
	reportType: CardReportType;
	message: string;
}) {
	const [report] = await reportRequest<CardReport[]>('/rest/v1/card_reports?select=*', {
		method: 'POST',
		headers: {
			Prefer: 'return=representation'
		},
		body: JSON.stringify({
			user_id: input.user?.id ?? null,
			card_code: input.cardCode,
			card_name: input.cardName,
			report_type: input.reportType,
			message: input.message
		})
	});

	if (!report) throw new Error('Could not create report');
	return report;
}

export async function listCardReports(status = '') {
	const statusFilter = status ? `status=eq.${encodeURIComponent(status)}&` : '';
	return reportRequest<CardReport[]>(
		`/rest/v1/card_reports?${statusFilter}select=*,app_users(email,display_name)&order=created_at.desc&limit=100`
	);
}

export async function updateCardReport(
	reportId: string,
	input: { status: CardReportStatus; adminNote: string }
) {
	const [report] = await reportRequest<CardReport[]>(
		`/rest/v1/card_reports?id=eq.${encodeURIComponent(reportId)}&select=*`,
		{
			method: 'PATCH',
			headers: {
				Prefer: 'return=representation'
			},
			body: JSON.stringify({
				status: input.status,
				admin_note: input.adminNote,
				updated_at: new Date().toISOString()
			})
		}
	);

	if (!report) throw new Error('Report not found');
	return report;
}

export function isCardReportType(value: unknown): value is CardReportType {
	return (
		value === 'translation' ||
		value === 'card_data' ||
		value === 'image' ||
		value === 'rules_text' ||
		value === 'other'
	);
}

export function isCardReportStatus(value: unknown): value is CardReportStatus {
	return value === 'open' || value === 'reviewing' || value === 'resolved' || value === 'dismissed';
}

async function reportRequest<T = unknown>(path: string, init: RequestInit = {}) {
	const config = getRagConfig();
	if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
		throw new Error('Supabase URL or service role key is missing');
	}

	const response = await fetch(`${config.supabaseUrl}${path}`, {
		...init,
		headers: {
			apikey: config.supabaseServiceRoleKey,
			Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
			'Content-Type': 'application/json',
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Card report database request failed (${response.status}): ${text}`);
	}

	if (response.status === 204) return undefined as T;
	const text = await response.text();
	return text ? (JSON.parse(text) as T) : (undefined as T);
}
