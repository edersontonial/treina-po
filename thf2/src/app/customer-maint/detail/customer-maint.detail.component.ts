import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoI18nPipe, PoI18nService, PoNotificationService, PoPageAction, PoBreadcrumb, PoRadioGroupOption, PoTableColumn } from '@portinari/portinari-ui';
import { PoDialogService } from '@portinari/portinari-ui';
import { forkJoin, Subscription } from 'rxjs';
import { ICustomer, Customer } from '../../shared/model/customer.model';
import { BreadcrumbControlService } from '../../shared/services/breadcrumb-control.service';
import { CustomerService } from '../../shared/services/customer.service';
import { IContact } from '../../shared/model/contact.model';
import { ContactService } from '../../shared/services/contact.service';
import { TotvsResponse } from '../../shared/interfaces/totvs-response.interface';

@Component({
    selector: 'app-customer-maint-detail',
    templateUrl: './customer-maint.detail.component.html',
    styleUrls: ['./customer-maint.detail.component.css']
})
export class CustomerMaintDetailComponent implements OnInit, OnDestroy {
    literals: any = {};

    customer: ICustomer = new Customer;

    breadcrumb: PoBreadcrumb;

    servCustomerSubscription$: Subscription;

    expandables = [''];

    pageActions: Array<PoPageAction>;

    statusOptions: Array<PoRadioGroupOption>;

    /* Contatos */
    columns: Array<PoTableColumn>;
    items: Array<IContact> = new Array<IContact>();
    servContactSubscription$: Subscription;
    /* Contato */

    constructor(
        private thfI18nPipe: PoI18nPipe,
        private thfI18nService: PoI18nService,
        private thfNotification: PoNotificationService,
        private thfDialogService: PoDialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private serviceCustomer: CustomerService,
        private serviceContact: ContactService,
        private breadcrumbControlService: BreadcrumbControlService
    ) { }

    ngOnInit(): void {
        forkJoin(
            this.thfI18nService.getLiterals(),
            this.thfI18nService.getLiterals({ context: 'customerMaint' })
        ).subscribe(literals => {
            literals.map(item => Object.assign(this.literals, item));

            console.log('LOG', 'Início do Programa de Detalhe');

            this.breadcrumbControlService.addBreadcrumb(this.literals['customerMaintDetail'], this.activatedRoute);

            this.setupComponents();

            const code = this.activatedRoute.snapshot.paramMap.get('id');
            this.search(code);
            this.searchContacts(code);
        });
    }

    search(code: string): void {
        this.servCustomerSubscription$ = this.serviceCustomer
            .getById(code, [])
            .subscribe((response: ICustomer) => {
                /* Assincrono, roda isso quando endpoint retornar */
                if (response) {
                    this.customer = response;
                }
            });
    }

    searchContacts(code: string): void {
        this.servContactSubscription$ = this.serviceContact
            .getByCustomer(code, this.expandables)
            .subscribe((response: TotvsResponse<IContact>) => {
                /* Assincrono, roda isso quando endpoint retornar */
                console.log(response);
                if (response && response.items) {
                    this.items = [...this.items, ...response.items];
                }
            });
    }

    setupComponents(): void {
        this.breadcrumb = this.breadcrumbControlService.getBreadcrumb();
        this.statusOptions = Customer.statusLabelList(this.literals);
        this.columns = [
            { property: 'code', label: this.literals['code'], type: 'number' },
            { property: 'name', label: this.literals['name'], type: 'string' },
            { property: 'fone', label: this.literals['fone'], type: 'string' }
        ];
    }

    ngOnDestroy(): void {
        // if (this.servEntitySubscription$) { this.servEntitySubscription$.unsubscribe(); }
    }

    back(): void {
        this.router.navigate([this.breadcrumbControlService.getPrevRouter()]);
    }
}
