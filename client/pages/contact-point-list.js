import '@things-factory/form-ui'
import '@things-factory/grist-ui'
import { i18next, localize } from '@things-factory/i18n-base'
import { client, CustomAlert, gqlBuilder, isMobileDevice, ScrollbarStyles } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html, LitElement } from 'lit-element'

export class ContactPointList extends localize(i18next)(LitElement) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
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
        .button-container {
          padding: 10px 0 12px 0;
          text-align: center;
        }
        .button-container > button {
          background-color: var(--button-background-color);
          border: var(--button-border);
          border-radius: var(--button-border-radius);
          margin: var(--button-margin);
          padding: var(--button-padding);
          color: var(--button-color);
          font: var(--button-font);
          text-transform: var(--button-text-transform);
        }
        .button-container > button:hover,
        .button-container > button:active {
          background-color: var(--button-background-focus-color);
        }
      `
    ]
  }

  static get properties() {
    return {
      bizplaceId: String,
      searchFields: Array,
      config: Object
    }
  }

  get searchForm() {
    return this.shadowRoot.querySelector('search-form')
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  render() {
    return html`
      <search-form .fields=${this.searchFields} @submit=${e => this.dataGrist.fetch()}></search-form>

      <div class="grist">
        <data-grist
          .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
          .config=${this.config}
          .fetchHandler=${this.fetchHandler.bind(this)}
        ></data-grist>
      </div>

      <div class="button-container">
        <mwc-button @click=${this._saveContactPoints}>${i18next.t('button.save')}</mwc-button>
        <mwc-button @click=${this._deleteContactPoints}>${i18next.t('button.delete')}</mwc-button>
      </div>
    `
  }

  firstUpdated() {
    this.searchFields = [
      {
        label: i18next.t('field.name'),
        name: 'name',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.email'),
        name: 'email',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.fax'),
        name: 'fax',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.phone'),
        name: 'phone',
        type: 'text',
        props: { searchOper: 'i_like' }
      },
      {
        label: i18next.t('field.description'),
        name: 'description',
        type: 'text',
        props: { searchOper: 'i_like' }
      }
    ]

    this.config = {
      rows: {
        selectable: {
          multiple: true
        }
      },
      columns: [
        { type: 'gutter', gutterName: 'dirty' },
        { type: 'gutter', gutterName: 'sequence' },
        { type: 'gutter', gutterName: 'row-selector', multiple: true },
        {
          type: 'string',
          name: 'name',
          record: { align: 'left', editable: true },
          header: i18next.t('field.name'),
          width: 120
        },
        {
          type: 'string',
          name: 'description',
          record: { align: 'left', editable: true },
          header: i18next.t('field.description'),
          width: 220
        },
        {
          type: 'string',
          name: 'email',
          record: { align: 'left', editable: true },
          header: i18next.t('field.email'),
          width: 120
        },
        {
          type: 'string',
          name: 'fax',
          record: { align: 'left', editable: true },
          header: i18next.t('field.fax'),
          width: 120
        },
        {
          type: 'string',
          name: 'phone',
          record: { align: 'left', editable: true },
          header: i18next.t('field.phone'),
          width: 120
        },
        {
          type: 'object',
          name: 'updater',
          record: { align: 'left', editable: false },
          header: i18next.t('field.updater'),
          width: 150
        },
        {
          type: 'datetime',
          name: 'updatedAt',
          record: { align: 'left' },
          header: i18next.t('field.updated_at'),
          width: 150
        }
      ]
    }
  }

  async fetchHandler({ page, limit, sorters = [{ name: 'name' }] }) {
    let filters = []
    if (this.bizplaceId) {
      filters.push({
        name: 'bizplace',
        operator: 'eq',
        value: this.bizplaceId
      })
    }

    const response = await client.query({
      query: gql`
        query {
          contactPoints(${gqlBuilder.buildArgs({
            filters: [...filters, ...this.searchForm.queryFilters],
            pagination: { page, limit },
            sortings: sorters
          })}) {
            items {
              id
              name
              email
              fax
              phone
              description
              updatedAt
              updater{
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
      total: response.data.contactPoints.total || 0,
      records: response.data.contactPoints.items || []
    }
  }

  async _saveContactPoints() {
    let patches = this.dataGrist.exportPatchList({ flagName: 'cuFlag' })
    if (patches && patches.length) {
      patches = patches.map(contactPoint => {
        return {
          ...contactPoint,
          bizplace: { id: this.bizplaceId }
        }
      })

      const response = await client.query({
        query: gql`
          mutation {
            updateMultipleContactPoint(${gqlBuilder.buildArgs({
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

  async _deleteContactPoints() {
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
              deleteContactPoints(${gqlBuilder.buildArgs({ ids })})
            }
          `
      })
      if (!response.errors) {
        this.dataGrist.fetch()
        this.showToast(i18next.t('text.data_deleted_successfully'))
      }
    } else {
      CustomAlert({
        title: i18next.t('text.nothing_selected'),
        text: i18next.t('text.there_is_nothing_to_delete')
      })
    }
  }

  showToast(message) {
    document.dispatchEvent(new CustomEvent('notify', { detail: { message } }))
  }
}

window.customElements.define('contact-point-list', ContactPointList)
