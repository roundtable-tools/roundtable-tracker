import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import {
	Theme,
	ThemeProvider,
	DefaultTheme,
	DarkTheme,
} from '@react-navigation/native';

import '@/global.css';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { NAV_THEME } from '@/components/base/lib/constants';
import { StatusBar } from 'expo-status-bar';

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

export default function TabLayout() {
	const hasMounted = React.useRef(false);
	const colorScheme = useColorScheme();
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return;
		}

		if (Platform.OS === 'web') {
			// Adds the background color to the html element to prevent white background on overscroll.
			document.documentElement.classList.add('bg-background');
		}
		setIsColorSchemeLoaded(true);
		hasMounted.current = true;
	}, []);

	if (!isColorSchemeLoaded) {
		return null;
	}

	return (
		<ThemeProvider value={colorScheme == 'dark' ? DARK_THEME : LIGHT_THEME}>
			<StatusBar style={colorScheme == 'dark' ? 'light' : 'dark'} />
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarBackground: TabBarBackground,
					tabBarStyle: Platform.select({
						ios: {
							// Use a transparent background on iOS to show the blur effect
							position: 'absolute',
						},
						default: {},
					}),
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: 'Home',
						tabBarIcon: ({ color }) => (
							<IconSymbol size={28} name="house.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="explore"
					options={{
						title: 'Explore',
						tabBarIcon: ({ color }) => (
							<IconSymbol size={28} name="paperplane.fill" color={color} />
						),
					}}
				/>
			</Tabs>
		</ThemeProvider>
	);
}

const useIsomorphicLayoutEffect =
	Platform.OS === 'web' && typeof window === 'undefined'
		? React.useEffect
		: React.useLayoutEffect;
