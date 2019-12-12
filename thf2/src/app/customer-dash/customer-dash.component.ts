import { Component, OnInit } from '@angular/core';
import { PoBreadcrumb, PoI18nPipe, PoI18nService, PoNotificationService, PoDialogService, PoSelectOption, PoInfoOrientation, PoTableColumn, PoTableDetail } from '@portinari/portinari-ui';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService } from '../shared/services/customer.service';
import { BreadcrumbControlService } from '../shared/services/breadcrumb-control.service';
import { OrderService } from '../shared/services/order.service';
import { forkJoin, Subscription } from 'rxjs';
import { Order, IOrder } from '../shared/model/order.model';
import { TotvsResponse } from '../shared/interfaces/totvs-response.interface';
import { ICustomer, Customer } from '../shared/model/customer.model';

@Component({
  selector: 'app-customer-dash',
  templateUrl: './customer-dash.component.html'
})
export class CustomerDashComponent implements OnInit {

  breadcrumb: PoBreadcrumb;
  statusLabelList: Array<any>;
  literals: any = {};

  customer: ICustomer = new Customer();
  customers: Map<Number, ICustomer>;

  orders: Array<IOrder> = new Array<IOrder>();


  columns: Array<PoTableColumn>;
  ordemDetailColumns: PoTableDetail;
  hasNext = false;

  servCustomerSubscription$: Subscription;
  servOrderSubscription$: Subscription;

  // optionSelected: PoSelectOption = { label: undefined, value: undefined };
  optionsCustomer: Array<PoSelectOption> = [];
  codeCustomerSelected = '0';

  orientation: PoInfoOrientation = PoInfoOrientation.Horizontal;

  constructor(
    private thfI18nPipe: PoI18nPipe,
    private thfI18nService: PoI18nService,
    private thfNotification: PoNotificationService,
    private thfDialogService: PoDialogService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private serviceCustomer: CustomerService,
    private serviceOrder: OrderService,
    private breadcrumbControlService: BreadcrumbControlService
  ) { }

  ngOnInit(): void {
    forkJoin(
      this.thfI18nService.getLiterals(),
      this.thfI18nService.getLiterals({ context: 'customerMaint' })
    ).subscribe(literals => {
      literals.map(item => Object.assign(this.literals, item));

      console.log('LOG', 'Início do Programa Dash');

      this.breadcrumbControlService.addBreadcrumb(this.literals['customerDash'], this.activatedRoute);

      this.setupComponents();

      this.searchCustomers();
    });
  }

  setupComponents(): void {

    this.breadcrumb = this.breadcrumbControlService.getBreadcrumb();

    this.statusLabelList = Order.statusLabelList(this.literals);

    this.ordemDetailColumns = {
      columns: [
        { property: 'seq', label: this.literals['seq'], type: 'number' },
        { property: 'item', label: this.literals['item'], type: 'string' },
        { property: 'quant', label: this.literals['quant'], type: 'number' },
        { property: 'value', label: this.literals['value'], type: 'currency' }
      ],
      typeHeader: 'top'
    };

    this.columns = [
      { property: 'orderNumber', label: this.literals['number'], type: 'number' },
      { property: 'date', label: this.literals['date'], type: 'date' },
      { property: 'value', label: this.literals['value'], type: 'currency' },
      { property: 'status', label: this.literals['status'], type: 'label', labels: this.statusLabelList },
      { property: 'orderlines', label: 'Details', type: 'detail', detail: this.ordemDetailColumns }
    ];
  }

  searchCustomers(): void {
    this.customers = new Map();
    this.servCustomerSubscription$ = this.serviceCustomer
      .query([], [])
      .subscribe((response: TotvsResponse<ICustomer>) => {
        /* Assincrono, roda isso quando endpoint retornar */
        if (response && response.items) {
          response.items.forEach(cust => {
            this.optionsCustomer.push({ label: String(cust.code) + ' - ' + cust.shortName, value: String(cust.code) });
            this.customers.set(cust.code, cust);
            if (this.codeCustomerSelected === '0') {
              this.codeCustomerSelected = String(cust.code);
              this.changeCustomer();
            }
          });
        }
      });
  }

  changeCustomer() {
    this.customer = this.customers.get(+this.codeCustomerSelected);
    this.searchOrders();
  }

  searchOrders(): void {
    console.log('entrou search orders');
    this.servOrderSubscription$ = this.serviceOrder
      .getByCustomer(this.codeCustomerSelected, [])
      .subscribe((response: TotvsResponse<IOrder>) => {
        /* Assincrono, roda isso quando endpoint retornar */
        if (response && response.items) {
          this.orders = response.items;
          console.log('retornou search orders');
        }
      });
  }

  openDetails() {
    this.router.navigate(['/customerMaint', 'detail', Customer.getInternalId(this.customer)]);
  }
}
