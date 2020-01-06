import { getCodeByName } from '@things-factory/code-base'
import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openImportPopUp } from '@things-factory/import-ui'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  navigate,
  PageView,
  ScrollbarStyles
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class CompanyList extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object,
      importHandler: Object
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        search-form {
          overflow: visible;
        }

        data-grist {
          overflow-y: auto;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form .fields="${this.searchFields}" @submit="${() => this.dataGrist.fetch()}"></search-form>

      <data-grist
        .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
        .config="${this.config}"
        .fetchHandler="${this.fetchHandler.bind(this)}"
      >
      </data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.company'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveCompanies(this.dataGrist.exportPatchList({ flagName: 'cuFlag' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteCompanies.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.company'),
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: records => {
          openImportPopUp(
            records,
            {
              rows: this.config.rows,
              columns: [...this.config.columns.filter(column => column.imex !== undefined)]
            },
            async patches => {
              await this._saveCompanies(patches)
              history.back()
            }
          )
        }
      }
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  async pageInitialized() {
    const countryCodes = await getCodeByName('COUNTRY_CODE')

    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.country_code'),
        name: 'countryCode',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.brn'),
        name: 'brn',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.status'),
        name: 'status',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      rows: { selectable: { multiple: true } },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'gutter',
          gutterName: 'button',
          icon: 'reorder',
          handlers: {
            click: (_columns, _data, _column, record, _rowIndex) => {
              if (record.id) navigate(`bizplaces/${record.id}`)
            }
          }
        },
        {
          type: 'string',
          name: 'name',
          header: i18next.t('field.name'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Name', key: 'name', width: 50, type: 'string' },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'description',
          header: i18next.t('field.description'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Description', key: 'description', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'code',
          name: 'countryCode',
          header: i18next.t('field.country_code'),
          record: { editable: true, align: 'center', codeName: 'COUNTRY_CODE' },
          imex: {
            header: 'Country Code',
            key: 'countryCode',
            width: 100,
            type: 'array',
            arrData: countryCodes.map(countryCodes => {
              return {
                name: countryCodes.name,
                id: countryCodes.name
              }
            })
          },
          sortable: true,
          width: 200
        },
        {
          type: 'string',
          name: 'brn',
          header: i18next.t('field.brn'),
          record: {
            editable: true,
            align: 'center'
          },
          imex: { header: 'Brn', key: 'brn', width: 50, type: 'string' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'postalCode',
          header: i18next.t('field.postal_code'),
          record: { editable: true, align: 'center' },
          imex: { header: 'Postal Code', key: 'postalCode', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'address',
          header: i18next.t('field.address'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Address', key: 'address', width: 50, type: 'string' },
          sortable: true,
          width: 250
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'center' },
          imex: { header: 'Status', key: 'status', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'center' },
          sortable: true,
          width: 150
        }
      ]
    }
  }

  pageUpdated(_changes, _lifecycle) {
    if (this.active) {
      this.dataGrist.fetch()
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          companies(${gqlBuilder.buildArgs({
            filters: this.searchForm.queryFilters,
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              description
              countryCode
              postalCode
              brn
              address
              status
              updatedAt
              updater{
                id
                name
                description
              }
            }
            total
          }
        }
      `
    })

    return {
      total: response.data.companies.total || 0,
      records: response.data.companies.items || []
    }
  }

  async _saveCompanies(patches) {
    if (patches && patches.length) {
      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleCompany(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        document.dispatchEvent(
          new CustomEvent('notify', {
            detail: {
              message: i18next.t('text.data_updated_successfully')
            }
          })
        )
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_changed'),
        text: i18next.t('text.there_is_nothing_to_save')
      })
    }
  }

  async _deleteCompanies() {
    const ids = this.dataGrist.selected.map(record => record.id)
    if (ids && ids.length > 0) {
      const anwer = await CustomAlert({
        type: 'warning',
        title: i18next.t('button.delete'),
        text: i18next.t('text.are_you_sure'),
        confirmButton: { text: i18next.t('button.delete') },
        cancelButton: { text: i18next.t('button.cancel') }
      })

      if (!anwer.value) return

      const response = await client.query({
        query: gql`
            mutation {
              deleteCompanies(${gqlBuilder.buildArgs({ ids })})
            }
          `
      })
      if (!response.errors) this.dataGrist.fetch()
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_selected'),
        text: i18next.t('text.there_is_nothing_to_delete')
      })
    }
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }
    // data structure // { //    header: {headerName, fieldName, type = string, arrData = []} //    data: [{fieldName: value}] // }

    var headerSetting = this.dataGrist._config.columns
      .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
      .map(column => {
        return column.imex
      })

    var data = records.map(item => {
      return {
        id: item.id,
        ...this.config.columns
          .filter(column => column.type !== 'gutter' && column.record !== undefined && column.imex !== undefined)
          .reduce((record, column) => {
            record[column.imex.key] = column.imex.key
              .split('.')
              .reduce((obj, key) => (obj && obj[key] !== 'undefined' ? obj[key] : undefined), item)
            return record
          }, {})
      }
    })

    return { header: headerSetting, data: data }
    // return this.dataGrist.exportRecords()
  }
}

customElements.define('company-list', CompanyList)
