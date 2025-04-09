import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';

import { IconSymbol } from '@/components/ui/IconSymbol';
import {
	Avatar,
	AvatarImage,
	AvatarFallback,
} from '@/components/base/ui/avatar';
import { Button } from '@/components/base/ui/button/button';
import { Text } from '@/components/base/ui/text';

export default function TabTwoScreen() {
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
			headerImage={
				<IconSymbol
					size={310}
					color="#808080"
					name="chevron.left.forwardslash.chevron.right"
					style={styles.headerImage}
				/>
			}
		>
			<Avatar alt="Zach Nugent's Avatar">
				<AvatarImage
					source={{
						uri: 'https://i.pinimg.com/736x/df/0c/09/df0c09967d74c081e14adcd8667fa2f9.jpg',
					}}
				/>
				<AvatarFallback>
					<Text>ZN</Text>
				</AvatarFallback>
			</Avatar>

			<Button
				variant={'default'}
				onPress={() => {
					console.log('Button pressed');
				}}
			>
				<Text>Default</Text>
			</Button>
		</ParallaxScrollView>
	);
}

const styles = StyleSheet.create({
	headerImage: {
		color: '#808080',
		bottom: -90,
		left: -35,
		position: 'absolute',
	},
	titleContainer: {
		flexDirection: 'row',
		gap: 8,
	},
});
