declare namespace svelteHTML {
	interface HTMLAttributes<T> {
		'on:clickOutside'?: CompositionEventHandler<T>;
	}
}
