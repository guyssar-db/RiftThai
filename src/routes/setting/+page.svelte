<script lang="ts">
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
		settings: UserSettings;
	};

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
	let displayNameConfirmOpen = $state(false);
	let actionNotice = $state<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	$effect(() => {
		if (initialized) return;
		displayName = user.displayName;
		displayNameLocked = user.displayNameLocked;
		profileHandle = user.profileHandle;
		profileSlug = user.profileSlug;
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
			if (!response.ok) throw new Error(payload.error || 'Could not update profile');
			displayName = payload.user?.displayName ?? displayName;
			displayNameLocked = payload.user?.displayNameLocked ?? true;
			profileHandle = payload.user?.profileHandle ?? profileHandle;
			profileSlug = payload.user?.profileSlug ?? profileSlug;
			showActionNotice('Display Name locked', 'success');
			displayNameConfirmOpen = false;
			window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'Could not update profile', 'error');
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
			if (!response.ok) throw new Error(payload.error || 'Could not update settings');
			settings = payload.settings ?? settings;
			localStorage.setItem('riftthai-export-layout', settings.defaultExportLayout);
			showActionNotice('Settings updated', 'success');
			window.dispatchEvent(new CustomEvent('riftthai-auth-changed'));
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'Could not update settings', 'error');
		} finally {
			savingSettings = false;
		}
	}

	async function changePassword() {
		if (nextPassword !== confirmPassword) {
			showActionNotice('New passwords do not match', 'error');
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
			if (!response.ok) throw new Error(payload.error || 'Could not change password');
			currentPassword = '';
			nextPassword = '';
			confirmPassword = '';
			showActionNotice('Password changed', 'success');
		} catch (err) {
			showActionNotice(err instanceof Error ? err.message : 'Could not change password', 'error');
		} finally {
			changingPassword = false;
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
	<nav class="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#070a12]/82 shadow-[0_14px_42px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
		<div class="rt-container flex items-center justify-between gap-4 py-3">
			<a href="/" class="shrink-0 border-l-2 border-cyan-300/60 pl-3 text-xl font-black text-white uppercase italic">
				Rift<span class="text-cyan-300">Thai</span>
			</a>
			<SiteMenu />
		</div>
	</nav>

	<main class="rt-container py-6 sm:py-10">
		<header class="rt-panel rt-topline rt-scanline mb-6 rounded-xl p-5 sm:p-7">
			<p class="rt-kicker mb-3">Account</p>
			<h1 class="rt-heading text-4xl uppercase italic sm:text-6xl">Setting</h1>
			<p class="rt-copy mt-3 text-sm">{profileHandle} / /profile/{profileSlug}</p>
			<a href="/profile/{profileSlug}" class="rt-action mt-5">View Profile</a>
		</header>

		<div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)]">
			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">Profile</h2>
				<form class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onsubmit={(e) => { e.preventDefault(); requestSaveProfile(); }}>
					<label class="min-w-0">
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase">Display Name</span>
						<input
							bind:value={displayName}
							maxlength="32"
							disabled={displayNameLocked}
							class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55"
						/>
					</label>
					<button class="rt-action self-end disabled:opacity-50" disabled={savingProfile || displayNameLocked} type="submit">{displayNameLocked ? 'Locked' : savingProfile ? 'Saving...' : 'Save Once'}</button>
				</form>
				<p class="mt-3 text-xs font-bold {displayNameLocked ? 'text-amber-200' : 'text-slate-500'}">
					{displayNameLocked
						? 'Display Name is locked and cannot be changed.'
						: 'Display Name can be saved only once. You will be asked to confirm before locking it.'}
				</p>
				<div class="mt-4 grid gap-3 sm:grid-cols-2">
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Handle</div>
						<div class="mt-1 font-black text-white">{profileHandle}</div>
					</div>
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Public URL</div>
						<div class="mt-1 truncate font-black text-cyan-100">/profile/{profileSlug}</div>
					</div>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">Account</h2>
				<div class="mt-4 space-y-3">
					<div class="rounded-lg border border-white/10 bg-black/20 p-3">
						<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Email</div>
						<div class="mt-1 truncate font-bold text-white">{user.email}</div>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-white/10 bg-black/20 p-3">
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Verify</div>
							<div class="mt-1 font-black {user.emailVerified ? 'text-emerald-200' : 'text-amber-200'}">{user.emailVerified ? 'Verified' : 'Pending'}</div>
						</div>
						<div class="rounded-lg border border-white/10 bg-black/20 p-3">
							<div class="text-[10px] font-black tracking-widest text-slate-500 uppercase">Joined</div>
							<div class="mt-1 font-black text-white">{new Date(user.createdAt).toLocaleDateString()}</div>
						</div>
					</div>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">Privacy</h2>
				<div class="mt-4 space-y-3">
					<label class="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4">
						<span class="min-w-0">
							<span class="block text-sm font-black text-white">Public profile</span>
							<span class="block text-xs font-bold text-slate-500">Allow others to open your profile page.</span>
						</span>
						<input type="checkbox" bind:checked={settings.profilePublic} class="h-5 w-5 accent-cyan-300" />
					</label>
					<label class="flex min-h-14 items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4">
						<span class="min-w-0">
							<span class="block text-sm font-black text-white">Show public decks</span>
							<span class="block text-xs font-bold text-slate-500">Email is never shown publicly.</span>
						</span>
						<input type="checkbox" bind:checked={settings.publicDecksVisible} class="h-5 w-5 accent-cyan-300" />
					</label>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5">
				<h2 class="text-xl font-black text-white uppercase italic">Deck Defaults</h2>
				<div class="mt-4 grid gap-3">
					<label>
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase">Online deck visibility</span>
						<select bind:value={settings.defaultDeckVisibility} class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none">
							<option value="private">Private</option>
							<option value="public">Public</option>
						</select>
					</label>
					<label>
						<span class="mb-2 block text-[10px] font-black tracking-widest text-cyan-200 uppercase">Export layout</span>
						<select bind:value={settings.defaultExportLayout} class="min-h-11 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white focus:border-cyan-300/50 focus:outline-none">
							<option value="portrait">Portrait</option>
							<option value="landscape">Landscape</option>
						</select>
					</label>
					<button class="rt-action justify-center disabled:opacity-50" disabled={savingSettings} type="button" onclick={saveSettings}>{savingSettings ? 'Saving...' : 'Save Defaults & Privacy'}</button>
				</div>
			</section>

			<section class="rt-panel rounded-xl p-5 lg:col-span-2">
				<h2 class="text-xl font-black text-white uppercase italic">Change Password</h2>
				<form class="mt-4 grid gap-3 md:grid-cols-3" onsubmit={(e) => { e.preventDefault(); void changePassword(); }}>
					<input bind:value={currentPassword} type="password" autocomplete="current-password" placeholder="Current password" class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none" />
					<input bind:value={nextPassword} type="password" autocomplete="new-password" placeholder="New password" class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none" />
					<input bind:value={confirmPassword} type="password" autocomplete="new-password" placeholder="Confirm new password" class="min-h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-bold text-white placeholder:text-slate-600 focus:border-cyan-300/50 focus:outline-none" />
					<button class="rt-action justify-center disabled:opacity-50 md:col-span-3" disabled={changingPassword} type="submit">{changingPassword ? 'Updating...' : 'Change Password'}</button>
				</form>
			</section>
		</div>
	</main>

	{#if displayNameConfirmOpen}
		<div class="fixed inset-0 z-[980] grid place-items-center bg-slate-950/82 p-4 backdrop-blur-sm">
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="Close display name confirmation"
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
				<div class="pointer-events-none absolute -top-20 -right-16 h-52 w-52 rounded-full bg-amber-300/12 blur-3xl"></div>
				<div class="relative p-5 sm:p-6">
					<div class="mb-5 flex items-start justify-between gap-4">
						<div class="min-w-0">
							<p class="rt-kicker mb-2 text-amber-100">One-time lock</p>
							<h2 id="display-name-confirm-title" class="text-2xl font-black text-white uppercase italic">
								Lock Display Name?
							</h2>
						</div>
						<button
							type="button"
							class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
							disabled={savingProfile}
							aria-label="Close"
							onclick={() => (displayNameConfirmOpen = false)}
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round">
								<path d="M6 18 18 6" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>

					<div class="rounded-xl border border-amber-300/20 bg-amber-300/8 p-4">
						<div class="text-[10px] font-black tracking-widest text-amber-100 uppercase">
							Display Name to lock
						</div>
						<div class="mt-2 break-words text-3xl font-black text-white uppercase italic">
							{displayName || 'RiftThai Player'}
						</div>
						<p class="mt-3 text-sm leading-relaxed font-bold text-slate-300">
							After this is saved, your Display Name and handle will be locked. You will not be
							able to change it later from settings.
						</p>
					</div>

					<div class="mt-5 grid gap-2 sm:grid-cols-2">
						<button
							type="button"
							class="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 px-4 text-xs font-black tracking-widest text-slate-300 uppercase transition hover:bg-white/5 hover:text-white disabled:opacity-40"
							disabled={savingProfile}
							onclick={() => (displayNameConfirmOpen = false)}
						>
							Cancel
						</button>
						<button
							type="button"
							class="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-4 text-xs font-black tracking-widest text-slate-950 uppercase transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={savingProfile}
							onclick={saveProfile}
						>
							{savingProfile ? 'Locking...' : 'Lock Display Name'}
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
			onclose={() => actionNotice = null}
		/>
	{/if}
</div>

