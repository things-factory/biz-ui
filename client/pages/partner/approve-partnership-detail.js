import { html, css, LitElement } from 'lit-element'
import { SingleColumnFormStyles } from '@things-factory/form-ui'
import { localize, i18next } from '@things-factory/i18n-base'
import { client, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import '@material/mwc-button/mwc-button'

class ApprovePartnershipDetail extends localize(i18next)(LitElement) {
  static get properties() {
    return {
      data: Object
    }
  }
  static get styles() {
    return [
      SingleColumnFormStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: white;
        }
        .form-container {
          flex: 1;
        }
        .button-container {
          display: flex;
          margin-left: auto;
        }
        .button-container > mwc-button {
          padding: 10px;
        }
      `
    ]
  }

  render() {
    return html`
      <div class="form-container">
        <form class="single-column-form">
          <legend>${i18next.t('title.partnership')}</legend>

          <label>${i18next.t('label.partner')}</label>
          <input name="partnerBizplace" value="${this.data.partnerBizplace.name}" readonly />

          <label>${i18next.t('label.type')}</label>
          <input name="type" value="${this.data.type}" readonly />

          <label>${i18next.t('label.status')}</label>
          <input name="status" value="${this.data.status}" readonly />

          <input name="activated" checked="${this.data.activated}" type="checkbox" disabled />
          <label>${i18next.t('label.activated')}</label>

          <label>${i18next.t('label.requester')}</label>
          <input name="creator" value="${`${this.data.creator.name} (${this.data.creator.email})`}" readonly />

          <label>${i18next.t('label.requested_at')}</label>
          <input name="createdAt" type="datetime-local" value="${this.createdAt}" readonly />

          ${this.data.activated
            ? html`
                <label>${`${i18next.t('label.approver')} /  ${i18next.t('label.rejecter')}`}</label>
                <input name="updater" value="${`${this.data.updater.name} (${this.data.updater.email})`}" readonly />

                <label>${`${i18next.t('label.approved_at')} / ${i18next.t('label.rejected_at')}`}</label>
                <input name="updatedAt" type="datetime-local" value="${this.updatedAt}" readonly />
              `
            : ''}
        </form>
      </div>

      ${this.data.status === 'REQUESTED'
        ? html`
            <div class="button-container">
              <mwc-button @click="${this._reject.bind(this)}">${i18next.t('button.reject')}</mwc-button>
              <mwc-button @click="${this._approve.bind(this)}">${i18next.t('button.approve')}</mwc-button>
            </div>
          `
        : ''}
    `
  }

  async _approve() {
    const response = await client.query({
      query: gql`
        mutation {
          approvePartnership(${gqlBuilder.buildArgs({
            id: this.data.id
          })})
        }
      `
    })

    if (!response.errors) {
      this.dispatchEvent(new CustomEvent('partnership-changed'))
      history.back()
    }
  }

  async _reject() {
    const response = await client.query({
      query: gql`
        mutation {
          rejectPartnership(${gqlBuilder.buildArgs({
            id: this.data.id
          })})
        }
      `
    })

    if (!response.errors) {
      this.dispatchEvent(new CustomEvent('partnership-changed'))
      history.back()
    }
  }
}

window.customElements.define('approve-partnership-detail', ApprovePartnershipDetail)
