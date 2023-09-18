/* eslint-disable @typescript-eslint/no-explicit-any */
export const clickOutside = (node: HTMLElement) => {
	const handleClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented) {
			node.dispatchEvent(new CustomEvent('clickOutside', node as any));
		}
	};

	document.addEventListener('click', handleClick, true);
	document.addEventListener('contextmenu', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
			document.removeEventListener('contextmenu', handleClick, true);
		}
	};
};
