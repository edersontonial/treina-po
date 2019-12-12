export interface ICustomer {
    code: number;
    shortName: string;
    name: string;
    country: string;
    status: number;
}

export class Customer implements ICustomer {
    code: number;
    shortName: string;
    name: string;
    country: string;
    status: number;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }

    static getInternalId(item: ICustomer): string {
        return item.code.toString();
    }

    get $code() { return this.code; }
    set $code(value: number) { this.code = value; }

    get $shortName() { return this.shortName; }
    set $shortName(value: string) { this.shortName = value; }

    get $name() { return this.name; }
    set $name(value: string) { this.name = value; }

    get $country() { return this.country; }
    set $country(value: string) { this.country = value; }

    get $status() { return this.status; }
    set $status(value: number) { this.status = value; }

    static statusLabelList(literals: {}): Array<any> {
        return [
            { value: 1, color: 'success', label: literals['active'] },
            { value: 2, color: 'danger', label: literals['inactive'] },
            { value: 3, color: 'color-09', label: literals['blocked'] }
        ];
    }
}
