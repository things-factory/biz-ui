import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openImportPopUp } from '@things-factory/import-ui'
import { openPopup } from '@things-factory/layout-base'
import {
  client,
  CustomAlert,
  gqlBuilder,
  isMobileDevice,
  PageView,
  ScrollbarStyles,
  store
} from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'
import './contact-point-list'

class BizplaceList extends connect(store)(localize(i18next)(PageView)) {
  static get properties() {
    return {
      companyId: String,
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
      <search-form .fields="${this.searchFields}" @submit="${e => this.dataGrist.fetch()}"></search-form>

      <data-grist
        .mode="${isMobileDevice() ? 'LIST' : 'GRID'}"
        .config="${this.config}"
        .fetchHandler="${this.fetchHandler.bind(this)}"
      ></data-grist>
    `
  }

  get context() {
    return {
      title: i18next.t('title.bizplace'),
      actions: [
        {
          title: i18next.t('button.save'),
          action: () => this._saveBizplaces(this.dataGrist.exportPatchList({ flagName: 'cuFlag' }))
        },
        {
          title: i18next.t('button.delete'),
          action: this._deleteBizplaces.bind(this)
        }
      ],
      exportable: {
        name: i18next.t('title.bizplace'),
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
              await this._saveBizplaces(patches)
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

  pageInitialized() {
    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.address'),
        name: 'address',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.postal_code'),
        name: 'postalCode',
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
              if (record.id && record.name) this._openContactPoints(record.id, record.name)
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
          width: 100
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
          type: 'string',
          name: 'address',
          header: i18next.t('field.address'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Address', key: 'address', width: 50, type: 'string' },
          sortable: true,
          width: 150
        },
        {
          type: 'string',
          name: 'postalCode',
          header: i18next.t('field.postal_code'),
          record: { editable: true, align: 'left' },
          imex: { header: 'PostalCode', key: 'postalCode', width: 50, type: 'string' },
          sortable: true,
          width: 120
        },
        {
          type: 'string',
          name: 'latlng',
          header: i18next.t('field.latlng'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Latlng', key: 'latlng', width: 50, type: 'string' },
          sortable: true,
          width: 100
        },
        {
          type: 'string',
          name: 'status',
          header: i18next.t('field.status'),
          record: { editable: true, align: 'left' },
          imex: { header: 'Status', key: 'status', width: 50, type: 'string' },
          sortable: true,
          width: 80
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          header: i18next.t('field.updated_at'),
          record: { editable: false, align: 'left' },
          sortable: true,
          width: 150
        },
        {
          type: 'object',
          name: 'updater',
          header: i18next.t('field.updater'),
          record: { editable: false, align: 'left' },
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

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    if (!this.companyId) return
    let filters = [
      {
        name: 'company',
        operator: 'eq',
        value: this.companyId
      }
    ]

    const response = await client.query({
      query: gql`
        query {
          bizplaces(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              company {
                name
                description
              }
              name
              description
              address
              postalCode
              status
              latlng
              updatedAt
              updater {
                name
                description
              }
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.bizplaces.total || 0,
        records: response.data.bizplaces.items || []
      }
    }
  }

  async _saveBizplaces(patches) {
    if (patches && patches.length) {
      patches = patches.map(patch => {
        return {
          ...patch,
          company: { id: this.companyId }
        }
      })

      const response = await client.query({
        query: gql`
            mutation {
              updateMultipleBizplace(${gqlBuilder.buildArgs({
                patches
              })}) {
                name
              }
            }
          `
      })

      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_updated_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_changed'),
        text: i18next.t('text.there_is_nothing_to_save')
      })
    }
  }

  async _deleteBizplaces() {
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
              deleteBizplaces(${gqlBuilder.buildArgs({ ids })})
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

  _openContactPoints(bizplaceId, bizplaceName) {
    openPopup(
      html`
        <contact-point-list .bizplaceId="${bizplaceId}" .bizplaceName="${bizplaceName}"></contact-point-list>
      `,
      {
        backdrop: true,
        size: 'large',
        title: i18next.t('title.contact_point_list')
      }
    )
  }

  _exportableData() {
    let records = []
    if (this.dataGrist.selected && this.dataGrist.selected.length > 0) {
      records = this.dataGrist.selected
    } else {
      records = this.dataGrist.data.records
    }

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
  }

  stateChanged(state) {
    if (JSON.parse(this.active)) {
      this.companyId = state && state.route && state.route.resourceId
    }
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('bizplace-list', BizplaceList)
