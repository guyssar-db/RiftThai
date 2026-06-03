export type CardReportType = 'translation' | 'card_data' | 'image' | 'rules_text' | 'other';
export type CardReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export type CardReport = {
	id: string;
	user_id: string | null;
	card_code: string;
	card_name: string;
	report_type: CardReportType;
	message: string;
	status: CardReportStatus;
	admin_note: string;
	created_at: string;
	updated_at: string;
	app_users?: { email: string; display_name: string | null } | null;
};
