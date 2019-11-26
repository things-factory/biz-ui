import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, gqlBuilder, isMobileDevice, PageView, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'

class PartnerList extends localize(i18next)(PageView) {
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
      }
    ]

    this.config = {
      columns: [
        { type: 'gutter', gutterName: 'sequence' },
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
          name: 'requester',
          header: i18next.t('label.requester'),
          type: 'object',
          record: { align: 'center' },
          width: 280
        },
        {
          name: 'requestedAt',
          header: i18next.t('label.requested_at'),
          type: 'datetime',
          record: { align: 'center' },
          width: 250
        },
        {
          name: 'approver',
          header: i18next.t('label.approver'),
          type: 'object',
          record: { align: 'center' },
          width: 280
        },
        {
          name: 'approvedAt',
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
              requester {
                name
                description
              }
              requestedAt
              approver {
                name
                description
              }
              approvedAt 
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
}

window.customElements.define('partner-list', PartnerList)
