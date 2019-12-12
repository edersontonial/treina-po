export interface ICountry {
    code: number;
    name: string;
}

export class Country implements ICountry {
    code: number;
    name: string;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }

    static getInternalId(item: ICountry): string {
        return item.code.toString();
    }

    get $code() { return this.code; }
    set $code(value: number) { this.code = value; }

    get $name() { return this.name; }
    set $name(value: string) { this.name = value; }
}
