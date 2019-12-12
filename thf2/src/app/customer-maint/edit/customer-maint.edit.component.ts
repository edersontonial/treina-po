import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PoI18nPipe, PoI18nService, PoNotificationService, PoPageAction, PoBreadcrumb, PoLookupColumn, PoRadioGroupOption, PoTableColumn, PoTableAction, PoModalAction, PoModalComponent } from '@portinari/portinari-ui';
import { PoDialogService } from '@portinari/portinari-ui';
import { forkJoin, Subscription } from 'rxjs';
import { ICustomer, Customer } from '../../shared/model/customer.model';
import { BreadcrumbControlService } from '../../shared/services/breadcrumb-control.service';
import { CustomerService } from '../../shared/services/customer.service';
import { FieldValidationUtil } from '../../shared/utils/field-validation.util';
import { ICountry } from '../../shared/model/country.model';
import { CountryService } from '../../shared/services/country.service ';
import { IContact, Contact } from '../../shared/model/contact.model';
import { ContactService } from '../../shared/services/contact.service';
import { TotvsResponse } from '../../shared/interfaces/totvs-response.interface';

@Component({
    selector: 'app-customer-maint-edit',
    templateUrl: './customer-maint.edit.component.html'
})
export class CustomerMaintEditComponent implements OnInit, OnDestroy {
    @ViewChild('modalContact', { static: false }) modalContact: PoModalComponent;

    literals: any = {};
    customer: ICustomer = new Customer;
    zoomCountryColumns: Array<PoLookupColumn>;
    breadcrumb: PoBreadcrumb;
    servCustomerSubscription$: Subscription;
    expandables = [''];
    pageActions: Array<PoPageAction>;
    fieldValidUtil: FieldValidationUtil;
    isEdit: boolean;
    statusOptions: Array<PoRadioGroupOption>;

    /* Contatos */
    contact: IContact = new Contact();
    columns: Array<PoTableColumn>;
    tableActions: Array<PoTableAction>;
    items: Array<IContact> = new Array<IContact>();
    //items: Map<Number, IContact> = new Map<Number, IContact>();
    servContactSubscription$: Subscription;
    confirmAddContactAction: PoModalAction;
    cancelAddContactAction: PoModalAction;
    acaoContact: number; /* 1-Add ; 2-Edit ; 3-Detail */
    /* Contato */

    constructor(
        private thfI18nPipe: PoI18nPipe,
        private thfI18nService: PoI18nService,
        private thfNotification: PoNotificationService,
        private thfDialogService: PoDialogService,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private serviceCustomer: CustomerService,
        private serviceCountry: CountryService,
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

            const code = this.activatedRoute.snapshot.paramMap.get('id');
            this.isEdit = !!code;

            this.breadcrumbControlService.addBreadcrumb(this.getTitle(), this.activatedRoute);

            this.fieldValidUtil = new FieldValidationUtil(this.thfNotification, this.thfI18nPipe, this.literals);
            this.setupComponents();

            if (this.isEdit) {
                this.search(code);
                this.searchContacts(code);
            }
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

    searchContacts(codeCustomer: string): void {
        this.items = [];
        this.servContactSubscription$ = this.serviceContact
            .getByCustomer(codeCustomer, this.expandables)
            .subscribe((response: TotvsResponse<IContact>) => {
                /* Assincrono, roda isso quando endpoint retornar */
                if (response && response.items) {
                    this.items = [...this.items, ...response.items];
                }
            });
    }

    searchContact(codeContact: string): void {
        this.servContactSubscription$ = this.serviceContact
            .getById(codeContact, [])
            .subscribe((response: IContact) => {
                /* Assincrono, roda isso quando endpoint retornar */
                if (response) {
                    this.contact = response;
                }
            });
    }

    setupComponents(): void {
        this.breadcrumb = this.breadcrumbControlService.getBreadcrumb();

        this.zoomCountryColumns = [
            { property: 'code', label: this.literals['code'], type: 'string' },
            { property: 'name', label: this.literals['name'], type: 'string' }
        ];

        this.statusOptions = Customer.statusLabelList(this.literals);

        this.columns = [
            { property: 'code', label: this.literals['code'], type: 'number' },
            { property: 'name', label: this.literals['name'], type: 'string' },
            { property: 'fone', label: this.literals['fone'], type: 'string' }
        ];

        this.tableActions = [
            { action: this.detail.bind(this), label: this.literals['detail'], icon: 'po-icon po-icon-document' },
            { action: this.edit.bind(this), label: this.literals['edit'], icon: 'po-icon po-icon-edit' },
            { action: this.delete.bind(this), label: this.literals['remove'], icon: 'po-icon po-icon-delete' }
        ];

        this.setupComponentsModalContact();
    }

    setupComponentsModalContact(): void {
        this.confirmAddContactAction = {
            action: () => this.onConfirmAddContactAction(), label: this.literals['save']
        };
        this.cancelAddContactAction = {
            action: () => this.modalContact.close(), label: this.literals['cancel']
        };
    }

    addContact(): void {
        this.acaoContact = 1;
        this.confirmAddContactAction.label = this.literals['save'];
        this.contact = new Contact();
        this.modalContact.open();
    }

    detail(item: IContact) {
        this.acaoContact = 3;
        this.confirmAddContactAction.label = this.literals['OK'];
        this.searchContact(Contact.getInternalId(item)); /* poderia ser só this.contact = new Contact(item); */
        this.modalContact.open();
    }

    edit(item: IContact) {
        this.acaoContact = 2;
        this.confirmAddContactAction.label = this.literals['save'];
        this.searchContact(Contact.getInternalId(item)); /* poderia ser só this.contact = new Contact(item); */
        this.modalContact.open();
    }

    delete(item: IContact) {
        const contactCode = Contact.getInternalId(item);
        this.thfDialogService.confirm({
            title: this.literals['remove'],
            message: this.thfI18nPipe.transform(this.literals['modalDeleteMessage'], [contactCode]),
            confirm: () => {
                this.servContactSubscription$ = this.serviceContact
                    .delete(contactCode)
                    .subscribe(response => {
                        this.thfNotification.success(
                            this.thfI18nPipe.transform(this.literals['deleteSucessMessage'], [contactCode])
                        );
                        this.searchContacts(String(this.customer.code));
                    }, (err: any) => {
                    });
            }
        });
    }

    onConfirmAddContactAction(): void {
        if (this.isDetailContact()) {
            this.modalContact.close();
            return;
        }
        if (this.onValidFieldsContact()) {
            if (this.isEditContact()) {
                this.servContactSubscription$ = this.serviceContact
                    .update(this.contact)
                    .subscribe(() => {

                        this.thfNotification.success(this.literals['updatedMessage']);
                        this.modalContact.close();
                        this.searchContacts(String(this.contact.customer));

                    }, (err: any) => {
                        this.thfNotification.error(err);
                    });
            } else {
                this.contact.customer = this.customer.code; /* Não é informado em tela */
                this.servContactSubscription$ = this.serviceContact
                    .create(this.contact)
                    .subscribe(() => {

                        this.thfNotification.success(this.literals['createMessage']);
                        this.modalContact.close();
                        this.searchContacts(String(this.contact.customer));

                    }, (err: any) => {
                        this.thfNotification.error(err);
                    });
            }
        }
    }

    onValidFieldsContact(): boolean {
        let isOk = true;

        if (!this.fieldValidUtil.vldFieldNumber('code', this.contact.code, true)) { isOk = false; }
        if (!this.fieldValidUtil.vldFieldCharacter('name', this.contact.name)) { isOk = false; }
        if (!this.fieldValidUtil.vldFieldCharacter('fone', this.contact.fone)) { isOk = false; }

        return isOk;
    }

    zoomCountryFormat(value: ICountry): string {
        return `${value.code} - ${value.name}`;
    }

    ngOnDestroy(): void {
        // if (this.servEntitySubscription$) { this.servEntitySubscription$.unsubscribe(); }
    }

    cancel(): void {
        this.voltar();
    }

    voltar(): void {
        this.router.navigate([this.breadcrumbControlService.getPrevRouter()]);
    }

    save(): void {
        if (this.onValidFields()) {
            if (this.isEdit) {
                this.servCustomerSubscription$ = this.serviceCustomer
                    .update(this.customer)
                    .subscribe(() => {

                        this.thfNotification.success(this.literals['updatedMessage']);
                        this.voltar();

                    }, (err: any) => {
                        this.thfNotification.error(err);
                    });
            } else {
                this.servCustomerSubscription$ = this.serviceCustomer
                    .create(this.customer)
                    .subscribe(() => {

                        this.thfNotification.success(this.literals['createMessage']);
                        this.voltar();

                    }, (err: any) => {
                        this.thfNotification.error(err);
                    });
            }
        }
    }

    onValidFields(): boolean {
        let isOk = true;

        if (!this.fieldValidUtil.vldFieldNumber('code', this.customer.code, true)) { isOk = false; }
        if (!this.fieldValidUtil.vldFieldCharacter('shortName', this.customer.shortName)) { isOk = false; }
        if (!this.fieldValidUtil.vldFieldCharacter('country', this.customer.country)) { isOk = false; }

        return isOk;
    }

    getTitle(): string {
        if (this.isEdit) {
            return this.literals['customerMaintEdit'];
        } else {
            return this.literals['customerMaintCreate'];
        }
    }

    getTitleContact(): string {
        if (this.isEditContact()) {
            return this.literals['editContact'];
        }
        if (this.isAddContact()) {
            return this.literals['addContact'];
        }
        return this.literals['detailContact'];
    }

    isAddContact(): boolean {
        return this.acaoContact === 1;
    }

    isEditContact(): boolean {
        return this.acaoContact === 2;
    }

    isDetailContact(): boolean {
        return this.acaoContact === 3;
    }
}
