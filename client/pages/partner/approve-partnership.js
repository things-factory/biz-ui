import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import './approve-partnership-detail'

class ApprovePartnership extends localize(i18next)(PageView) {
  static get properties() {
    return {
      searchFields: Array,
      config: Object,
      data: Object
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
        .grist {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow-y: auto;
        }
        data-grist {
          overflow-y: hidden;
          flex: 1;
        }
      `
    ]
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler="${this.fetchHandler.bind(this)}"
        ></data-grist>
      </div>
    `
  }

  constructor() {
    super()
    this.config = {}
    this.data = { records: {} }
  }

  get context() {
    return {
      title: i18next.t('title.approve_partnership')
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
        label: i18next.t('label.partner'),
        name: 'partnerBizplace',
        type: 'object',
        queryName: 'bizplaces',
        field: 'name'
      },
      {
        label: i18next.t('label.type'),
        name: 'type',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('label.status'),
        name: 'status',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('label.activated'),
        name: 'activated',
        type: 'checkbox',
        props: { searchOper: 'eq' },
        attrs: ['indeterminate']
      }
    ]

    this.config = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'button', icon: 'reorder', handlers: { click: this._openPopup.bind(this) } },
        {
          name: 'partnerBizplace',
          header: i18next.t('field.partner'),
          type: 'object',
          record: { align: 'center' },
          width: 300
        },
        {
          name: 'type',
          header: i18next.t('label.type'),
          record: { align: 'center' },
          width: 120
        },
        {
          name: 'status',
          header: i18next.t('label.status'),
          record: { align: 'center' },
          width: 120
        },
        {
          name: 'activated',
          header: i18next.t('label.activated'),
          type: 'boolean',
          width: 80
        },
        {
          name: 'creator',
          header: i18next.t('label.requester'),
          type: 'object',
          record: { align: 'center' },
          width: 280
        },
        {
          name: 'createdAt',
          header: i18next.t('label.requested_at'),
          type: 'datetime',
          record: { align: 'center' },
          width: 250
        },
        {
          name: 'updater',
          header: i18next.t('label.approver'),
          type: 'object',
          record: { align: 'center' },
          width: 280
        },
        {
          name: 'updatedAt',
          header: i18next.t('label.approved_at'),
          type: 'datetime',
          record: { align: 'center' },
          width: 250
        }
      ]
    }
  }

  async fetchHandler({ page, limit, sorters = [] }) {
    const response = await client.query({
      query: gql`
        query {
          partners(${gqlBuilder.buildArgs({
            filters: await this.searchForm.getQueryFilters(),
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              partnerBizplace {
                name
                description
              }
              type
              status
              activated
              creator {
                name
                description
              }
              createdAt
              updater {
                name
                description
              }
              updatedAt 
            }
            total
          }
        }
      `
    })

    if (!response.errors) {
      return {
        total: response.data.partners.total || 0,
        records: response.data.partners.items || []
      }
    }
  }

  _openPopup(_columns, _data, _column, record, _rowIndex) {
    openPopup(
      html`
        <approve-partnership-detail
          .data="${record}"
          @partnership-changed="${() => this.dataGrist.fetch()}"
        ></approve-partnership-detail>
      `,
      {
        backdrop: true,
        size: 'medium',
        title: i18next.t('title.approve_partnership_detail')
      }
    )
  }
}

window.customElements.define('approve-partnership', ApprovePartnership)
