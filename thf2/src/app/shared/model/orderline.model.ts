export interface IOrderLine {
    seq: number;
    item: string;
    quant: number;
    value: number;
}

export class OrderLine implements IOrderLine {
    seq: number;
    item: string;
    quant: number;
    value: number;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }

    static getInternalId(item: IOrderLine): string {
        return item.seq.toString();
    }

    get $seq() { return this.seq; }
    set $seq(value: number) { this.seq = value; }

    get $item() { return this.item; }
    set $item(value: string) { this.item = value; }

    get $quant() { return this.quant; }
    set $quant(value: number) { this.quant = value; }

    get $value() { return this.value; }
    set $value(value: number) { this.value = value; }

}
