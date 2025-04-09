import { createClient } from '@supabase/supabase-js';

// 1. Initialize your Supabase client (replace with your actual URL and Key)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Define an async function to handle the anonymous login
export async function loginAnonymously() {
	console.log('Attempting to sign in anonymously...');

	// Call the specific Supabase function
	const { data, error } = await supabase.auth.signInAnonymously();

	// 3. Handle potential errors
	if (error) {
		console.error('Error during anonymous sign-in:', error.message);

		// You might want to show an error message to the user here
		return null; // Indicate that login failed
	}

	// 4. Handle success
	if (data && data.user && data.session) {
		console.log('Successfully signed in anonymously!');
		console.log('Anonymous User ID:', data.user.id); // Unique ID for this user
		console.log('Session created:', !!data.session);

		// IMPORTANT:
		// - A user record is created in Supabase's `auth.users` table.
		// - A session is established.
		// - `supabase-js` automatically stores the session (incl. refresh token)
		//   in localStorage for persistence.
		// - You can now make authenticated requests using the `supabase` client.
		// - You can use `data.user.id` in your Row Level Security (RLS) policies via `auth.uid()`.

		return data.user; // Return the user object on success
	} else {
		// This case should ideally not happen if error is null, but good to check
		console.warn(
			'Anonymous sign-in seemed successful but returned no user/session data.'
		);

		return null;
	}
}

// --- Example Usage ---
// You would typically call this function when your app loads if no
// existing session is detected.

export async function initializeAuthentication() {
	// Check if a session already exists (from localStorage)
	const {
		data: { session },
	} = await supabase.auth.getSession();

	if (session) {
		// User is already logged in (could be anonymous or otherwise)
		console.log('Found existing session for user:', session.user.id);
		// You can proceed with the logged-in user state
	} else {
		// No session found, attempt anonymous login
		console.log('No active session found. Signing in anonymously...');
		const anonymousUser = await loginAnonymously();
		if (anonymousUser) {
			console.log('Anonymous login successful on app initialization.');
			// Proceed with the newly logged-in anonymous user state
		} else {
			console.error('Failed to initialize anonymous session.');
			// Handle the case where anonymous login failed
		}
	}
}

// Call the initialization logic when your app starts
initializeAuthentication();
