import { IOrderLine } from './orderline.model';

export interface IOrder {
    orderNumber: number;
    date: Date;
    value: number;
    status: number;
    customer: number;
    orderlines: Array<IOrderLine>;
}

export class Order implements IOrder {
    orderNumber: number;
    date: Date;
    value: number;
    status: number;
    customer: number;
    orderlines: Array<IOrderLine>;

    constructor(values: Object = {}) {
        Object.assign(this, values);
    }

    static getInternalId(item: IOrder): string {
        return item.orderNumber.toString();
    }

    get $orderNumber() { return this.orderNumber; }
    set $orderNumber(value: number) { this.orderNumber = value; }

    get $date() { return this.date; }
    set $date(value: Date) { this.date = value; }

    get $value() { return this.value; }
    set $value(value: number) { this.value = value; }

    get $customer() { return this.customer; }
    set $customer(value: number) { this.customer = value; }

    get $orderlines() { return this.orderlines; }
    set $orderlines(value: Array<IOrderLine>) { this.orderlines = value; }

    get $status() { return this.status; }
    set $status(value: number) { this.status = value; }

    static statusLabelList(literals: {}): Array<any> {
        return [
            { value: 1, color: 'success', label: literals['paidout'] }, /* pago */
            { value: 2, color: 'danger', label: literals['typing'] }, /* em digitacao */
            { value: 3, color: 'color-09', label: literals['blocked'] } /* bloqueado */
        ];
    }
}
