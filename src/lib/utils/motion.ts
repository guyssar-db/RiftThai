export const motionPreferenceKey = 'riftthai_reduce_motion';

export function reduceMotion(): boolean {
	if (typeof window === 'undefined') return true;
	try {
		const saved = localStorage.getItem(motionPreferenceKey);
		if (saved !== null) return saved === 'true';
	} catch { /* Storage may be unavailable. */ }
	return false;
}

export function syncMotionPreference() {
	document.documentElement.dataset.reduceMotion = String(reduceMotion());
}
