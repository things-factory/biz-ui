import route from './client/route'
import bootstrap from './client/bootstrap'

export default {
  route,
  routes: [
    {
      tagname: 'company-list',
      page: 'companies'
    },
    {
      tagname: 'bizplace-list',
      page: 'bizplaces'
    },
    {
      tagname: 'partner-list',
      page: 'partners'
    }
  ],
  bootstrap
}
