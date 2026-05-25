<script lang="ts">
	const updated = 'May 25, 2026';
</script>

<svelte:head>
	<title>Privacy Policy - RiftThai</title>
</svelte:head>

<div class="min-h-dvh bg-slate-950 px-4 py-10 text-slate-100">
	<article class="prose prose-invert prose-slate mx-auto max-w-4xl prose-headings:font-black prose-a:text-cyan-300">
		<a href="/" class="not-prose inline-flex rounded-lg border border-white/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-white/5">Back</a>
		<p class="mt-8 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">RiftThai</p>
		<h1>Privacy Policy</h1>
		<p><strong>Last updated:</strong> {updated}</p>

		<p>
			This Privacy Policy explains how RiftThai collects, uses, stores, and protects information when you use the card database, RAG chat, account system, email verification, and support chat.
			This page is written for transparency and should be reviewed with legal counsel before commercial use.
		</p>

		<h2>Information We Collect</h2>
		<ul>
			<li><strong>Account information:</strong> email address, password hash, role, verification status, session records, and timestamps.</li>
			<li><strong>Email verification data:</strong> hashed verification tokens, expiration time, and verification state.</li>
			<li><strong>Chat and support messages:</strong> questions sent to the RAG chat, support messages to admins, admin replies, read state, and timestamps.</li>
			<li><strong>Usage data:</strong> daily chat usage counts used to enforce limits and protect the service from abuse.</li>
			<li><strong>Technical data:</strong> server logs, request metadata, and error logs created while operating the site.</li>
		</ul>

		<h2>How We Use Information</h2>
		<ul>
			<li>To create and verify accounts.</li>
			<li>To allow verified users to log in and use the RAG chat.</li>
			<li>To enforce daily chat limits, except for admin accounts.</li>
			<li>To operate the support chat between users and admins.</li>
			<li>To troubleshoot bugs, prevent abuse, and improve site reliability.</li>
			<li>To answer card, keyword, and rule questions using the RiftThai knowledge base.</li>
		</ul>

		<h2>AI Processing</h2>
		<p>
			Questions sent to the RAG chat may be processed by Google Gemini. Relevant context from the RiftThai knowledge base may be sent with the question so the model can generate an answer.
			Do not submit private, sensitive, financial, legal, medical, or confidential information into the chat.
		</p>

		<h2>Service Providers</h2>
		<p>RiftThai uses third-party providers to operate the site:</p>
		<ul>
			<li><strong>Supabase:</strong> database storage for accounts, sessions, chat usage, support messages, and RAG content.</li>
			<li><strong>Resend:</strong> email delivery for account verification.</li>
			<li><strong>Google Gemini:</strong> AI generation and embeddings for RAG features.</li>
			<li><strong>Vercel or hosting provider:</strong> application hosting, routing, deployment, logs, and infrastructure.</li>
		</ul>

		<h2>Cookies and Sessions</h2>
		<p>
			RiftThai uses an HTTP-only session cookie to keep verified users logged in. This cookie is required for account features and is not used for advertising.
		</p>

		<h2>Data Retention</h2>
		<p>
			Account records, support messages, and chat usage records are retained while the account or service remains active, unless deletion is requested or retention is required for security, abuse prevention, or legal reasons.
			Expired sessions and used verification tokens may be deleted periodically.
		</p>

		<h2>Security</h2>
		<p>
			Passwords are stored as hashes, not plaintext. Verification and session tokens are stored as hashes. Admin-only pages are protected server-side.
			No system is perfectly secure, so users should avoid sending sensitive information through the chat.
		</p>

		<h2>Your Choices</h2>
		<ul>
			<li>You may choose not to create an account.</li>
			<li>You may request account deletion or support-message deletion by contacting the site admin.</li>
			<li>You may stop using chat features at any time.</li>
		</ul>

		<h2>Children</h2>
		<p>
			RiftThai is a community fan resource and is not intended to knowingly collect personal information from children below the age required by applicable law.
		</p>

		<h2>Fan Project Notice</h2>
		<p>
			RiftThai is an unofficial community project and is not endorsed by Riot Games. Game names, images, marks, and related assets belong to their respective owners.
		</p>

		<h2>Contact</h2>
		<p>
			Use the support chat after logging in, or contact the site administrator through the channel where this site is published.
		</p>
	</article>
</div>

