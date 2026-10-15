type TraitColor = 'blue' | 'orange' | 'purple' | 'green' | 'red';

interface TraitCategory {
	color: TraitColor;
	traits: string[];
}

const TRAIT_CATEGORIES: TraitCategory[] = [
	{
		color: 'blue',
		traits: ['Uncommon'],
	},
	{
		color: 'orange',
		traits: ['Rare'],
	},
	{
		color: 'purple',
		traits: ['Unique'],
	},
	{
		color: 'green',
		traits: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'],
	},
	{
		color: 'red',
		traits: [], // General traits default to red
	},
];

function getTraitColor(trait: string): TraitColor {
	for (const category of TRAIT_CATEGORIES) {
		if (category.traits.includes(trait)) {
			return category.color;
		}
	}

	return 'red';
}

const TRAIT_COLOR_CLASSES: Record<TraitColor, string> = {
	blue: 'bg-blue-500 text-white',
	orange: 'bg-orange-500 text-white',
	purple: 'bg-purple-500 text-white',
	green: 'bg-green-500 text-white',
	red: 'bg-red-500 text-white',
};

export function getTraitBadgeClassName(trait: string): string {
	return TRAIT_COLOR_CLASSES[getTraitColor(trait)];
}
