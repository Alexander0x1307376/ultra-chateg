export const itemsByIds = <T>(ids: string[], items: Record<string, T>) => {
	const result: T[] = [];
	ids.forEach((id) => {
		if (id in items) result.push(items[id]);
	});
	return result;
};
