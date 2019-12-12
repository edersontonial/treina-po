import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoI18nPipe, PoI18nService, PoNotificationService, PoTableColumn, PoTableAction, PoPageAction, PoDisclaimerGroup, PoDisclaimer, PoBreadcrumb, PoPageFilter, PoModalComponent, PoModalAction } from '@portinari/portinari-ui';
import { PoDialogService } from '@portinari/portinari-ui';
import { forkJoin, Subscription } from 'rxjs';
import { ICustomer, Customer } from '../../shared/model/customer.model';
import { TotvsResponse } from '../../shared/interfaces/totvs-response.interface';
import { DisclaimerUtil } from '../../shared/utils/disclaimer.util';
import { CustomerService } from '../../shared/services/customer.service';
import { IFilterRangeNumber } from '../../shared/interfaces/filter-range.interface';
import { FilterRangeUtil } from '../../shared/utils/filter-range.util';
import { FieldValidationUtil } from '../../shared/utils/field-validation.util';
import { BreadcrumbControlService } from '../../shared/services/breadcrumb-control.service';

@Component({
    selector: 'app-customer-maint-list',
    templateUrl: './customer-maint.list.component.html',
    styleUrls: ['./customer-maint.list.component.css']
})
export class CustomerMaintListComponent implements OnInit, OnDestroy {
    @ViewChild('modalAdvanceSearch', { static: false }) modalAdvanceSearch: PoModalComponent;

    literals: any = {};

    breadcrumb: PoBreadcrumb;
    statusLabelList: Array<any>;

    disclaimerGroup: PoDisclaimerGroup;
    disclaimers: Array<PoDisclaimer> = [];
    disclaimerUtil: DisclaimerUtil;

    filterSettings: PoPageFilter;
    quickSearchValue = '';

    confirmAdvSearchAction: PoModalAction;
    cancelAdvSearchAction: PoModalAction;

    filterCode: IFilterRangeNumber;
    fieldValidUtil: FieldValidationUtil;

    servCustomerSubscription$: Subscription;

    columns: Array<PoTableColumn>;
    tableActions: Array<PoTableAction>;
    items: Array<ICustomer> = new Array<ICustomer>();

    hasNext = false;
    currentPage = 1;
    pageSize = 20;

    expandables = [''];

    pageActions: Array<PoPageAction>;

    constructor(
        private thfI18nPipe: PoI18nPipe,
        private thfI18nService: PoI18nService,
        private thfNotification: PoNotificationService,
        private thfDialogService: PoDialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private serviceCustomer: CustomerService,
        private breadcrumbControlService: BreadcrumbControlService
    ) { }

    ngOnInit(): void {
        forkJoin(
            this.thfI18nService.getLiterals(),
            this.thfI18nService.getLiterals({ context: 'customerMaint' })
        ).subscribe(literals => {
            literals.map(item => Object.assign(this.literals, item));

            console.log('LOG', 'Início do Programa de Lista');

            this.breadcrumbControlService.addBreadcrumb(this.literals['customerMaintList'], this.activatedRoute);
            this.disclaimerUtil = new DisclaimerUtil(this.thfNotification, this.thfI18nPipe, this.literals);

            this.fieldValidUtil = new FieldValidationUtil(this.thfNotification, this.thfI18nPipe, this.literals);

            this.setupComponents();

            this.search();
        });
    }

    search(loadMore = false): void {
        if (loadMore === true) {
            this.currentPage = this.currentPage + 1;
        } else {
            this.items = [];
        }

        this.hasNext = false;
        this.servCustomerSubscription$ = this.serviceCustomer
            .query(this.disclaimers || [], this.expandables, this.currentPage, this.pageSize)
            .subscribe((response: TotvsResponse<ICustomer>) => {
                /* Assincrono, roda isso quando endpoint retornar */
                if (response && response.items) {
                    this.items = [...this.items, ...response.items];
                    this.hasNext = response.hasNext;
                }

                if (this.items.length === 0) { this.currentPage = 1; }
            });
    }

    searchBy(filter = null): void {
        this.disclaimers = [];

        if (!filter) {
            filter = this.quickSearchValue;
        }

        this.addDisclaimer([
            this.disclaimerUtil.makeDisclaimer('shortName', filter)
        ]);
    }

    addDisclaimer(disclaimerListItem: Array<PoDisclaimer>): void {
        if (!disclaimerListItem) { return; }

        disclaimerListItem.map(disclaimerItem => {
            if (disclaimerItem.property !== '') { this.disclaimers.push(disclaimerItem); }
        });
        this.disclaimerGroup.disclaimers = [...this.disclaimers];
    }

    onChangeDisclaimer(disclaimers: Array<PoDisclaimer>): void {
        this.disclaimers = disclaimers;
        this.refreshFilters();
        this.search();
    }


    resetFilters(): void {
        // Inicia os Campos de Filtros
        this.filterCode = FilterRangeUtil.makeFilterRangeNumber(0, 999999999);
    }



    refreshFilters(): void {
        if (!this.disclaimers || this.disclaimers.length === 0) {
            this.resetFilters();
            this.refreshDisclaimer();
            return;
        }
        // Atualizar os Campos de Filtro conforme o Disclaimer
        this.filterCode = this.disclaimerUtil.atzRangeNumFromDisclamer(this.disclaimers, 'code', this.filterCode);
    }


    refreshDisclaimer(): void {
        this.disclaimers = [];

        this.quickSearchValue = '';

        // Inclui os Campos de Filtro no Disclaimer
        this.addDisclaimer([
            this.disclaimerUtil.makeDisclaimerFromRangeNumber('code', this.filterCode)
        ]);
    }

    advancedSearch(): void {
        this.resetFilters();
        if (this.disclaimers && this.disclaimers.length > 0) {
            this.refreshFilters();
        }

        this.modalAdvanceSearch.open();
    }


    onConfirmAdvAction(): void {
        if (this.onValidFields()) {
            this.refreshDisclaimer();
            this.modalAdvanceSearch.close();
        }
    }

    onValidFields(): boolean {
        let isOk = true;

        // Validar os Campos do Filtro
        if (!this.fieldValidUtil.vldRangeNumber('codeInitial', 'codeFinal',
            this.filterCode.valInitial, this.filterCode.valFinal)) { isOk = false; }

        return isOk;
    }

    setupComponents(): void {

        this.breadcrumb = this.breadcrumbControlService.getBreadcrumb();

        this.disclaimerGroup = {
            title: this.literals['filters'],
            disclaimers: [],
            change: this.onChangeDisclaimer.bind(this)
        };

        this.filterSettings = {
            action: 'searchBy',
            advancedAction: 'advancedSearch',
            ngModel: 'quickSearchValue',
            placeholder: this.literals['attribute']
        };

        this.confirmAdvSearchAction = {
            action: () => this.onConfirmAdvAction(), label: this.literals['search']
        };

        this.cancelAdvSearchAction = {
            action: () => this.modalAdvanceSearch.close(), label: this.literals['cancel']
        };

        this.tableActions = [
            { action: this.detail.bind(this), label: this.literals['detail'], icon: 'po-icon po-icon-document' },
            { action: this.edit.bind(this), label: this.literals['edit'], icon: 'po-icon po-icon-edit' },
            { action: this.delete.bind(this), label: this.literals['remove'], icon: 'po-icon po-icon-delete' }
        ];

        this.statusLabelList = Customer.statusLabelList(this.literals);
        this.columns = [
            { property: 'code', label: this.literals['code'], type: 'number' },
            { property: 'shortName', label: this.literals['shortName'], type: 'string' },
            { property: 'name', label: this.literals['name'], type: 'string' },
            { property: 'country', label: this.literals['country'], type: 'string' },
            { property: 'status', label: this.literals['status'], type: 'label', labels: this.statusLabelList }
        ];

        this.pageActions = [
            { label: this.literals['add'], action: this.create.bind(this), icon: 'po-icon-plus' }
        ];

        this.resetFilters();
    }

    detail(item: ICustomer): void {
        this.router.navigate(['/customerMaint', 'detail', Customer.getInternalId(item)]);
    }

    edit(item: ICustomer): void {
        this.router.navigate(['/customerMaint', 'edit', Customer.getInternalId(item)]);
    }

    create(): void {
        this.router.navigate(['/customerMaint', 'new']);
    }

    delete(item: ICustomer): void {
        const customerCode = Customer.getInternalId(item);
        this.thfDialogService.confirm({
            title: this.literals['remove'],
            message: this.thfI18nPipe.transform(this.literals['modalDeleteMessage'], [customerCode]),
            confirm: () => {
                this.servCustomerSubscription$ = this.serviceCustomer
                    .delete(customerCode)
                    .subscribe(response => {
                        this.thfNotification.success(
                            this.thfI18nPipe.transform(this.literals['deleteSucessMessage'], [customerCode])
                        );
                        this.search();
                    }, (err: any) => {
                    });
            }
        });
    }

    ngOnDestroy(): void {
        // if (this.servEntitySubscription$) { this.servEntitySubscription$.unsubscribe(); }
    }
}
