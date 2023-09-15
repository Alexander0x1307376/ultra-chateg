import _ from 'lodash';

const nouns = [
	'чуваки',
	'ребята',
	'пацаны',
	'зайки',
	'котики',
	'малыши',
	'люди',
	'игорьки',
	'мальчики',
	'сойжаки',
	'деды',
	'черпаки',
	'слоны',
	'парни',
	'бойцы',
	'товарищи',
	'милашки',
	'умники',
	'мужики',
	'братаны'
];
const adjectives = [
	'замечательные',
	'крутые',
	'радостные',
	'весёлые',
	'суровые',
	'умные',
	'профессиональные',
	'цельнометаллические',
	'серьёзные',
	'прогрессивные',
	'шутливые',
	'рукастые',
	'гениальные',
	'известные',
	'опасные',
	'дерзкие',
	'вялые',
	'базированные'
];

export const getRandomGroupName = (): string => {
	const adjectiveIndex = _.random(0, adjectives.length - 1, false);
	const nounIndex = _.random(0, nouns.length - 1, false);
	return _.capitalize(adjectives[adjectiveIndex]) + ' ' + nouns[nounIndex];
};
