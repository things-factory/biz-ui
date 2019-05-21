import { html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { store, PageView } from '@things-factory/shell'

import logo from '../../assets/images/hatiolab-logo.png'

class BizUiMain extends connect(store)(PageView) {
  static get properties() {
    return {
      bizUi: String
    }
  }
  render() {
    return html`
      <section>
        <h2>BizUi</h2>
        <img src=${logo}></img>
      </section>
    `
  }

  stateChanged(state) {
    this.bizUi = state.bizUi.state_main
  }
}

window.customElements.define('biz-ui-main', BizUiMain)
