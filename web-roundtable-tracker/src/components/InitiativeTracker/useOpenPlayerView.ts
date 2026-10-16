import { useRouter } from '@tanstack/react-router';

// One named window, so opening it again brings the open player view forward
// instead of opening another one.
const PLAYER_VIEW_WINDOW_NAME = 'roundtable-player-view';

// Narrow enough for a column next to the tracker, tall enough for about ten
// participants. The window can still be resized or made full screen.
const PLAYER_VIEW_WINDOW_FEATURES = 'popup,width=480,height=760';

/** Opens the player view as a separate window that can go to a second screen. */
export const useOpenPlayerView = () => {
	const router = useRouter();

	return () => {
		const href = router.history.createHref(
			router.buildLocation({ to: '/initiative_player' }).href
		);

		window
			.open(href, PLAYER_VIEW_WINDOW_NAME, PLAYER_VIEW_WINDOW_FEATURES)
			?.focus();
	};
};
