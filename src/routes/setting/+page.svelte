<script lang="ts">
	import MotionPreference from '$lib/components/MotionPreference.svelte';
	import SiteMenu from '$lib/components/SiteMenu.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';

	type UserSettings = {
		profilePublic: boolean;
		publicDecksVisible: boolean;
		defaultDeckVisibility: 'private' | 'public';
		defaultExportLayout: 'portrait' | 'landscape';
	};

	type SettingsUser = {
		id: string;
		email: string;
		displayName: string;
		displayNameLocked: boolean;
		profileHandle: string;
		profileSlug: string;
		emailVerified: boolean;
		createdAt: string;
		twoFactorEnabled: boolean;
		settings: UserSettings;
	};

	type TwoFactorSetup = {
		secret: string;
		otpauthUri: string;
		qrDataUrl: string;
	};

	const settingSections = [
		{ id: 'profile', label: 'โปรไฟล์', description: 'ชื่อและข้อมูลบัญชี' },
		{ id: 'preferences', label: 'การตั้งค่า', description: 'ความเป็นส่วนตัวและเด็ค' },
		{ id: 'security', label: 'ความปลอดภัย', description: 'รหัสผ่านและ 2FA' }
	] as const;
	type SettingSection = (typeof settingSections)[number]['id'];

	let { data } = $props();
	let user = $derived(data.user as SettingsUser);
	let displayName = $state('');
	let displayNameLocked = $state(false);
	let profileHandle = $state('');
	let profileSlug = $state('');
	let settings = $state<UserSettings>({
		profilePublic: true,
		publicDecksVisible: true,
		defaultDeckVisibility: 'private',
		defaultExportLayout: 'portrait'
	});
	let initialized = $state(false);
	let currentPassword = $state('');
	let nextPassword = $state('');
	let confirmPassword = $state('');
	let savingProfile = $state(false);
	let savingSettings = $state(false);
	let changingPassword = $state(false);
	let twoFactorEnabled = $state(false);
	let twoFactorSetup = $state<TwoFactorSetup | null>(null);
	let twoFactorPassword = $state('');
	let twoFactorCode = $state('');
	let backupCodes = $state<string[]>([]);
	let twoFactorLoading = $state(false);
	let activeSection = $state<SettingSection>('profile');
	let displayNameConfirmOpen = $state(false);
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	$effect(() => {
		if (initialized) return;
		displayName = user.displayName;
		displayNameLocked = user.displayNameLocked;
		profileHandle = user.profileHandle;
		profileSlug = user.profileSlug;
		twoFactorEnabled = user.twoFactorEnabled;
		settings = { ...user.settings };
		initialized = true;
	});

	function requestSaveProfile() {
		if (displayNameLocked) return;
		displayNameConfirmOpen = true;
	}

	async function saveProfile() {
		if (displayNameLocked) return;
		savingProfile = true;
		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ displayName })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'อัปเดตโปรไฟล์ไม่สำเร็จ');
			displayName = payload.user?.displayName ?? displayName;
			displayNameLocked = payload.user?.displayNameLocked ?? true;
			profileHandle = payload.user?.profileHandle ?? profileHandle;
			profileSlug = payload.user?.profileSlug ?? profileSlug;
			showActionNotice('ล็อกชื่อที่แสดงแล้ว', 'success');
			displayNameConfirmOpen = false;
			window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'อัปเดตโปรไฟล์ไม่สำเร็จ', 'error');
		} finally {
			savingProfile = false;
		}
	}

	async function saveSettings() {
		savingSettings = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'บันทึกการตั้งค่าไม่สำเร็จ');
			settings = payload.settings ?? settings;
			localStorage.setItem('riftthai-export-layout', settings.defaultExportLayout);
			showActionNotice('บันทึกการตั้งค่าแล้ว', 'success');
			window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'บันทึกการตั้งค่าไม่สำเร็จ', 'error');
		} finally {
			savingSettings = false;
		}
	}

	async function changePassword() {
		if (nextPassword !== confirmPassword) {
			showActionNotice('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
			return;
		}
		changingPassword = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, nextPassword })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
			currentPassword = '';
			nextPassword = '';
			confirmPassword = '';
			showActionNotice('เปลี่ยนรหัสผ่านแล้ว', 'success');
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
		} finally {
			changingPassword = false;
		}
	}

	async function startTwoFactorSetup() {
		if (!twoFactorPassword) {
			showActionNotice('กรุณากรอกรหัสผ่านปัจจุบัน', 'error');
			return;
		}
		twoFactorLoading = true;
		try {
			const response = await fetch('/api/auth/2fa', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'setup', currentPassword: twoFactorPassword })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'เริ่มตั้งค่า 2FA ไม่สำเร็จ');
			twoFactorSetup = payload;
			twoFactorCode = '';
			backupCodes = [];
			showActionNotice('สแกน QR แล้วกรอกรหัสจาก Authenticator เพื่อยืนยัน', 'info');
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'เริ่มตั้งค่า 2FA ไม่สำเร็จ', 'error');
		} finally {
			twoFactorLoading = false;
		}
	}

	async function confirmTwoFactor() {
		if (!twoFactorCode) {
			showActionNotice('กรุณากรอกรหัสจาก Authenticator', 'error');
			return;
		}
		twoFactorLoading = true;
		try {
			const response = await fetch('/api/auth/2fa', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'enable', code: twoFactorCode })
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'เปิดใช้ 2FA ไม่สำเร็จ');
			twoFactorEnabled = true;
			twoFactorSetup = null;
			backupCodes = payload.backupCodes ?? [];
			twoFactorPassword = '';
			twoFactorCode = '';
			showActionNotice('เปิดใช้ 2FA แล้ว กรุณาบันทึก Backup codes', 'success');
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'เปิดใช้ 2FA ไม่สำเร็จ', 'error');
		} finally {
			twoFactorLoading = false;
		}
	}

	async function turnOffTwoFactor() {
		if (!twoFactorPassword || !twoFactorCode) {
			showActionNotice('กรุณากรอกรหัสผ่านและรหัส 2FA', 'error');
			return;
		}
		twoFactorLoading = true;
		try {
			const response = await fetch('/api/auth/2fa', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'disable',
					currentPassword: twoFactorPassword,
					code: twoFactorCode
				})
			});
			const payload = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(payload.error || 'ปิดใช้ 2FA ไม่สำเร็จ');
			twoFactorEnabled = false;
			twoFactorPassword = '';
			twoFactorCode = '';
			backupCodes = [];
			showActionNotice('ปิดใช้ 2FA แล้ว', 'success');
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'ปิดใช้ 2FA ไม่สำเร็จ', 'error');
		} finally {
			twoFactorLoading = false;
		}
	}

	function showActionNotice(message: string, type: 'success' | 'error' | 'info' = 'info') {
		actionNotice = null;
		window.setTimeout(() => {
			actionNotice = { message, type };
		}, 0);
	}
</script>

<div class="rt-page-shell min-h-dvh pb-16 text-slate-100">
	<div class="mesh-gradient"></div>
	<nav
		class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl"
	>
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a
				href="/"
				class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic"
			>
				Rift<span class="rt-brand-accent">Thai</span>
			</a>
			<SiteMenu />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline mb-6 rounded-xl p-5 sm:p-7">
			<p class="rt-kicker mb-3">บัญชี</p>
			<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">การตั้งค่า</h1>
			<p class="rt-copy mt-3 text-sm">{profileHandle} / /profile/{profileSlug}</p>
			<a href="/profile/{profileSlug}" class="rt-action mt-5">ดูโปรไฟล์</a>
		</header>

		<nav
			class="rt-panel mb-5 grid gap-2 rounded-xl p-2 sm:grid-cols-3"
			aria-label="หมวดการตั้งค่า"
		>
			{#each settingSections as section}
				<button
					type="button"
					class="rounded-lg px-4 py-3 text-left transition {activeSection === section.id
						? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/10'
						: 'text-slate-400 hover:bg-white/5 hover:text-white'}"
					aria-current={activeSection === section.id ? 'page' : undefined}
					onclick={() => (activeSection = section.id)}
				>
					<span class="block text-sm font-black uppercase">{section.label}</span>
					<span
						class="mt-1 block text-[10px] font-bold {activeSection === section.id
							? 'text-slate-800/70'
							: 'text-slate-500'}"
						>{section.description}</span
					>
				</button>
			{/each}
		</nav>

		<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
			{#if activeSection === 'profile'}
			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">โปรไฟล์</h2>
				<form
					class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
					onsubmit={(e) => {
						e.preventDefault();
						requestSaveProfile();
					}}
				>
					<label class="min-w-0">
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase"
							>ชื่อที่แสดง</span
						>
						<input
							bind:value={displayName}
							maxlength="32"
							disabled={displayNameLocked}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
						/>
					</label>
					<button
						class="rt-action self-end disabled:opacity-50"
						disabled={savingProfile || displayNameLocked}
						type="submit"
						>{displayNameLocked
							? 'ล็อกแล้ว'
							: savingProfile
								? 'กำลังบันทึก...'
								: 'บันทึกครั้งเดียว'}</button
					>
				</form>
				<p class="mt-3 text-xs font-bold {displayNameLocked ? 'text-amber-200' : 'text-slate-500'}">
					{displayNameLocked
						? 'ชื่อที่แสดงถูกล็อกแล้วและไม่สามารถเปลี่ยนได้'
						: 'ชื่อที่แสดงบันทึกได้เพียงครั้งเดียว ระบบจะให้ยืนยันก่อนล็อกชื่อ'}
				</p>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
							ชื่อผู้ใช้
						</div>
						<div class="mt-1 font-black text-white">{profileHandle}</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
							ลิงก์สาธารณะ
						</div>
						<div class="mt-1 truncate font-black text-cyan-100">/profile/{profileSlug}</div>
					</div>
				</div>
			</section>
			{:else if activeSection === 'preferences'}
			<MotionPreference />

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">บัญชี</h2>
				<div class="mt-4 space-y-3">
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Email</div>
						<div class="mt-1 truncate font-bold text-white">{user.email}</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-white/10 bg-black/20 p-3">
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
								การยืนยัน
							</div>
							<div
								class="mt-1 font-black {user.emailVerified ? 'text-emerald-200' : 'text-amber-200'}"
							>
								{user.emailVerified ? 'ยืนยันแล้ว' : 'รอยืนยัน'}
							</div>
						</div>
						<div class="rounded-lg border border-white/10 bg-black/20 p-3">
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">
								สมัครเมื่อ
							</div>
							<div class="mt-1 font-black text-white">
								{new Date(user.createdAt).toLocaleDateString('th-TH')}
							</div>
						</div>
					</div>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">ความเป็นส่วนตัว</h2>
				<div class="mt-4 space-y-3">
					<label
						class="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4"
					>
						<span class="min-w-0">
							<span class="block text-sm font-black text-white">โปรไฟล์สาธารณะ</span>
							<span class="block text-xs font-bold text-slate-500"
								>อนุญาตให้ผู้อื่นเปิดดูหน้าโปรไฟล์ของคุณ</span
							>
						</span>
						<input
							type="checkbox"
							bind:checked={settings.profilePublic}
							class="h-5 w-5 accent-cyan-300"
						/>
					</label>
					<label
						class="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4"
					>
						<span class="min-w-0">
							<span class="block text-sm font-black text-white">แสดงเด็คสาธารณะ</span>
							<span class="block text-xs font-bold text-slate-500">อีเมลจะไม่แสดงต่อสาธารณะ</span>
						</span>
						<input
							type="checkbox"
							bind:checked={settings.publicDecksVisible}
							class="h-5 w-5 accent-cyan-300"
						/>
					</label>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">ค่าเริ่มต้นของเด็ค</h2>
				<div class="mt-4 grid gap-3">
					<label>
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase"
							>การมองเห็นเด็คออนไลน์</span
						>
						<select
							bind:value={settings.defaultDeckVisibility}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none"
						>
							<option value="private">ส่วนตัว</option>
							<option value="public">สาธารณะ</option>
						</select>
					</label>
					<label>
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase"
							>แนวรูปที่ส่งออก</span
						>
						<select
							bind:value={settings.defaultExportLayout}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none"
						>
							<option value="portrait">แนวตั้ง</option>
							<option value="landscape">แนวนอน</option>
						</select>
					</label>
					<button
						class="rt-action justify-center disabled:opacity-50"
						disabled={savingSettings}
						type="button"
						onclick={saveSettings}
						>{savingSettings ? 'กำลังบันทึก...' : 'บันทึกค่าเริ่มต้นและความเป็นส่วนตัว'}</button
					>
				</div>
			</section>
			{:else}

			<section class="rt-panel rounded-xl p-5 lg:col-span-2">
				<h2 class="text-xl font-black text-white uppercase italic">ความปลอดภัยบัญชี</h2>
				{#if twoFactorEnabled}
					<div class="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/8 p-4">
						<div class="font-black text-emerald-100">เปิดใช้ 2FA อยู่</div>
						<p class="mt-1 text-xs font-bold text-slate-400">
							ทุกครั้งที่เข้าสู่ระบบต้องใช้รหัสจากแอป Authenticator หรือ Backup code
						</p>
					</div>
					<form
						class="mt-4 grid gap-3 md:grid-cols-3"
						onsubmit={(e) => {
							e.preventDefault();
							void turnOffTwoFactor();
						}}
					>
						<input
							bind:value={twoFactorPassword}
							type="password"
							autocomplete="current-password"
							placeholder="รหัสผ่านปัจจุบัน"
							class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
						/>
						<input
							bind:value={twoFactorCode}
							inputmode="numeric"
							autocomplete="one-time-code"
							maxlength="16"
							placeholder="รหัส 2FA หรือ Backup code"
							class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
						/>
						<button class="rt-action justify-center disabled:opacity-50" disabled={twoFactorLoading} type="submit">
							{twoFactorLoading ? 'กำลังดำเนินการ...' : 'ปิดใช้ 2FA'}
						</button>
					</form>
				{:else if twoFactorSetup}
					<div class="mt-4 grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
						<div class="w-fit rounded-xl bg-white p-3">
							<img src={twoFactorSetup.qrDataUrl} alt="QR code สำหรับตั้งค่า 2FA" class="h-56 w-56" />
						</div>
						<div class="space-y-3">
							<p class="text-sm font-bold text-slate-300">
								สแกน QR ด้วย Google Authenticator, Microsoft Authenticator หรือแอปที่รองรับ TOTP
							</p>
							<div class="rounded-lg border border-white/10 bg-black/20 p-3">
								<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">คีย์สำรองสำหรับกรอกเอง</div>
								<code class="mt-2 block break-all text-sm font-black tracking-widest text-cyan-200">{twoFactorSetup.secret}</code>
							</div>
							<form
								class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
								onsubmit={(e) => {
									e.preventDefault();
									void confirmTwoFactor();
								}}
							>
								<input
									bind:value={twoFactorCode}
									inputmode="numeric"
									autocomplete="one-time-code"
									maxlength="6"
									placeholder="รหัส 6 หลักจาก Authenticator"
									required
									class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
								/>
								<button class="rt-action justify-center disabled:opacity-50" disabled={twoFactorLoading} type="submit">
									{twoFactorLoading ? 'กำลังยืนยัน...' : 'ยืนยันและเปิดใช้'}
								</button>
							</form>
						</div>
					</div>
				{:else}
					<p class="mt-3 text-sm font-bold text-slate-400">
						เพิ่มชั้นความปลอดภัยด้วยรหัสแบบใช้ครั้งเดียวจากแอป Authenticator
					</p>
					<form
						class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
						onsubmit={(e) => {
							e.preventDefault();
							void startTwoFactorSetup();
						}}
					>
						<input
							bind:value={twoFactorPassword}
							type="password"
							autocomplete="current-password"
							placeholder="ยืนยันด้วยรหัสผ่านปัจจุบัน"
							required
							class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
						/>
						<button class="rt-action justify-center disabled:opacity-50" disabled={twoFactorLoading} type="submit">
							{twoFactorLoading ? 'กำลังเตรียม...' : 'ตั้งค่า 2FA'}
						</button>
					</form>
				{/if}

				{#if backupCodes.length > 0}
					<div class="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/8 p-4">
						<div class="font-black text-amber-100">Backup codes — บันทึกไว้ทันที</div>
						<p class="mt-1 text-xs font-bold text-slate-400">
							แต่ละรหัสใช้ได้ครั้งเดียว และจะไม่แสดงซ้ำหลังออกจากหน้านี้
						</p>
						<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
							{#each backupCodes as code}
								<code class="rounded bg-black/30 px-2 py-2 text-center text-xs font-black tracking-wider text-amber-100">{code}</code>
							{/each}
						</div>
					</div>
				{/if}
			</section>

			<section class="rt-panel rounded-xl p-5 lg:col-span-2">
				<h2 class="text-xl font-black text-white uppercase italic">เปลี่ยนรหัสผ่าน</h2>
				<form
					class="mt-4 grid gap-3 md:grid-cols-3"
					onsubmit={(e) => {
						e.preventDefault();
						void changePassword();
					}}
				>
					<input
						bind:value={currentPassword}
						type="password"
						autocomplete="current-password"
						placeholder="รหัสผ่านปัจจุบัน"
						class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
					/>
					<input
						bind:value={nextPassword}
						type="password"
						autocomplete="new-password"
						placeholder="รหัสผ่านใหม่"
						class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
					/>
					<input
						bind:value={confirmPassword}
						type="password"
						autocomplete="new-password"
						placeholder="ยืนยันรหัสผ่านใหม่"
						class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none"
					/>
					<button
						class="rt-action justify-center disabled:opacity-50 md:col-span-3"
						disabled={changingPassword}
						type="submit">{changingPassword ? 'กำลังอัปเดต...' : 'เปลี่ยนรหัสผ่าน'}</button
					>
				</form>
			</section>
			{/if}
		</div>
	</main>

	{#if displayNameConfirmOpen}
		<div class="fixed inset-0 z-[980] grid place-items-center bg-slate-950/82 p-4 backdrop-blur-sm">
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="ปิดการยืนยันชื่อที่แสดง"
				onclick={() => {
					if (!savingProfile) displayNameConfirmOpen = false;
				}}
			></button>
			<div
				class="rt-panel rt-topline relative w-full max-w-lg overflow-hidden rounded-xl border border-amber-300/25 shadow-2xl shadow-black/50"
				role="dialog"
				aria-modal="true"
				aria-labelledby="display-name-confirm-title"
			>
				<div
					class="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-amber-300/12 blur-3xl"
				></div>
				<div class="relative p-5 sm:p-6">
					<div class="mb-5 flex items-start justify-between gap-4">
						<div class="min-w-0">
							<p class="rt-kicker mb-2 text-amber-100">ล็อกได้ครั้งเดียว</p>
							<h2
								id="display-name-confirm-title"
								class="text-2xl font-black text-white uppercase italic"
							>
								ล็อกชื่อที่แสดงหรือไม่?
							</h2>
						</div>
						<button
							type="button"
							class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
							disabled={savingProfile}
							aria-label="ปิด"
							onclick={() => (displayNameConfirmOpen = false)}
						>
							<svg
								class="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.8"
								stroke-linecap="round"
							>
								<path d="M6 18 18 6" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>

					<div class="rounded-xl border border-amber-300/20 bg-amber-300/8 p-4">
						<div class="text-[10px] font-black tracking-widest text-amber-100 uppercase">
							ชื่อที่จะล็อก
						</div>
						<div class="mt-2 text-3xl font-black break-words text-white uppercase italic">
							{displayName || 'ผู้เล่น RiftThai'}
						</div>
						<p class="mt-3 text-sm leading-relaxed font-bold text-slate-300">
							หลังบันทึกแล้ว ชื่อที่แสดงและชื่อผู้ใช้จะถูกล็อก
							และไม่สามารถกลับมาเปลี่ยนภายหลังในการตั้งค่าได้
						</p>
					</div>

					<div class="mt-5 grid gap-2 sm:grid-cols-2">
						<button
							type="button"
							class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white disabled:opacity-40"
							disabled={savingProfile}
							onclick={() => (displayNameConfirmOpen = false)}
						>
							ยกเลิก
						</button>
						<button
							type="button"
							class="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-4 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={savingProfile}
							onclick={saveProfile}
						>
							{savingProfile ? 'กำลังล็อก...' : 'ล็อกชื่อที่แสดง'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if actionNotice}
		<Toast
			show={true}
			message={actionNotice.message}
			type={actionNotice.type}
			onclose={() => (actionNotice = null)}
		/>
	{/if}
</div>
