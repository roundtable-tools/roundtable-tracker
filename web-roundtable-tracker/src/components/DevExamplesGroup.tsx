import { FlaskConical } from 'lucide-react';

import { trackerExampleNames, trackerExampleUrl } from '@/devTrackerExamples';
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

// "round-2-mid-round" → "Round 2 mid round"
const exampleTitle = (name: string) =>
	name.charAt(0).toUpperCase() + name.slice(1).replaceAll('-', ' ');

/**
 * Dev server only: loads a saved tracker state from examples/tracker-states/.
 * Each link is a full page load, because the example replaces the stored
 * encounter before the app starts.
 */
export default function DevExamplesGroup() {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Dev examples</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					{trackerExampleNames.map((name) => (
						<SidebarMenuItem key={name}>
							<SidebarMenuButton asChild tooltip={exampleTitle(name)}>
								<a href={trackerExampleUrl(name)}>
									<FlaskConical />
									<span>{exampleTitle(name)}</span>
								</a>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
