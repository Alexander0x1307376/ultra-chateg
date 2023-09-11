/* eslint-disable @typescript-eslint/no-explicit-any */

export abstract class BaseStore<Data = any> {
	protected _store: Data;
	get store() {
		return this._store;
	}

	private subscriptions: ((data: Data) => void)[];
	protected get subscriptionsCount() {
		return this.subscriptions.length;
	}
	constructor(initValue: Data) {
		this._store = initValue;
		this.subscriptions = [];

		this.emit = this.emit.bind(this);
		this.set = this.set.bind(this);
		this.update = this.update.bind(this);
		this.subscribe = this.subscribe.bind(this);
	}

	protected emit(value: Data) {
		this.subscriptions.forEach((subscription) => subscription.call(this, value));
	}

	set(value: Data) {
		this._store = value;
		this.emit(value);
	}

	update(callback: (prev: Data) => Data) {
		const result = callback(this._store);
		this.set(result);
	}

	subscribe(subscription: (value: Data) => void): () => void {
		this.subscriptions.push(subscription);
		subscription(this._store);
		return () => {
			this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);
		};
	}
}
