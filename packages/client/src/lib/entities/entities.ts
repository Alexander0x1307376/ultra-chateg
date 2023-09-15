export type User = {
	id: number;
	name: string;
	avaUrl?: string;
};

export type Scope = {
	id: string;
	name: string;
	members: User[];
};

export type EntityWithAva = {
	id: string;
	name: string;
	avaUrl?: string;
};
