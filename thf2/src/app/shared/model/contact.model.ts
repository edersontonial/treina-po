export interface IContact {
    code: number;
    name: string;
    fone: string;
    customer: number;
}

export class Contact implements IContact {
    code: number;
    name: string;
    fone: string;
    customer: number;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }

    static getInternalId(item: IContact): string {
        return item.code.toString();
    }

    get $code() { return this.code; }
    set $code(value: number) { this.code = value; }

    get $name() { return this.name; }
    set $name(value: string) { this.name = value; }

    get $customer() { return this.customer; }
    set $customer(value: number) { this.customer = value; }

    get $fone() { return this.fone; }
    set $fone(value: string) { this.fone = value; }
}
