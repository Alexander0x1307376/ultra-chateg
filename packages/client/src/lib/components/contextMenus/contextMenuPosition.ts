type Position = { x: number; y: number };
type Size = { width: number; height: number };

type Parameters = {
	clickPosition: Position;
	outsideClick: () => void;
};

export const contextMenuPosition = (node: HTMLElement, params: Parameters) => {
	node.style.position = 'absolute';

	const { clickPosition, outsideClick } = params;

	const handleOutsideClick = (event: MouseEvent) => {
		if (node && !node.contains(event.target as HTMLElement) && !event.defaultPrevented) {
			outsideClick();
		}
	};

	const setMenuPosition = (clickPosition: Position) => {
		const windowSize = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		const menuSize = {
			width: node.offsetWidth,
			height: node.offsetHeight
		};

		const menuPosition = calcPosition(clickPosition, menuSize, windowSize);

		node.style.left = menuPosition.x + 'px';
		node.style.top = menuPosition.y + 'px';
	};

	document.addEventListener('click', handleOutsideClick, true);
	document.addEventListener('contextmenu', handleOutsideClick, true);

	setMenuPosition(clickPosition);

	return {
		update: (newParams: Parameters) => {
			setMenuPosition(newParams.clickPosition);
		},
		destroy: () => {
			document.removeEventListener('click', handleOutsideClick, true);
			document.removeEventListener('contextmenu', handleOutsideClick, true);
		}
	};
};

const calcPosition = (clickPosition: Position, elementSize: Size, parentSize: Size): Position => ({
	x:
		clickPosition.x + elementSize.width > parentSize.width
			? clickPosition.x - elementSize.width
			: clickPosition.x,
	y:
		clickPosition.y + elementSize.height > parentSize.height
			? clickPosition.y - elementSize.height
			: clickPosition.y
});
