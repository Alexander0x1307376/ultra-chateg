/* eslint-disable @typescript-eslint/no-explicit-any */
import { SHADOW_ITEM_MARKER_PROPERTY_NAME, TRIGGERS } from 'svelte-dnd-action';

export const notInternalDraggingBehaviour = <Item extends { id: string }>(
	items: Item[],
	config?: {
		dragStarted?: () => void;
		dragEnded?: () => void;
	}
) => {
	console.log('notInternalDraggingBehaviour!!!!', items);

	let draggingItemData:
		| {
				item: any;
				idCopy: string;
				index: number;
		  }
		| undefined = undefined;

	let shouldIgnoreDndEvents = false;

	const handleDndConsider = (
		e: CustomEvent<DndEvent<Item>> & {
			target: HTMLDivElement;
		}
	) => {
		config?.dragStarted?.();
		const { trigger, id } = e.detail.info;
		if (trigger === TRIGGERS.DRAG_STARTED) {
			const idx = items.findIndex((item) => item.id === id);
			const idCopy = `${id}_copy_${Math.round(Math.random() * 100000)}`;

			draggingItemData = {
				idCopy,
				index: idx,
				item: idx !== -1 ? items[idx] : undefined
			};

			e.detail.items = e.detail.items.filter((item) => {
				return !(SHADOW_ITEM_MARKER_PROPERTY_NAME in item);
			});
			e.detail.items.splice(idx, 0, { ...items[idx], id: idCopy });

			items = e.detail.items;
			shouldIgnoreDndEvents = true;
		} else if (!shouldIgnoreDndEvents) {
			items = e.detail.items;
		} else {
			items = [...items];
		}

		return items;
	};

	const handleDndFinalize = (
		e: CustomEvent<DndEvent<Item>> & {
			target: HTMLDivElement;
		}
	) => {
		if (!shouldIgnoreDndEvents) {
			items = e.detail.items;
		} else {
			shouldIgnoreDndEvents = false;
			if (draggingItemData) {
				items[draggingItemData.index] = draggingItemData.item;
				draggingItemData = undefined;
			}
			items = [...items];
		}
		config?.dragEnded?.();
		return items;
	};

	return {
		handleDndConsider,
		handleDndFinalize
	};
};
