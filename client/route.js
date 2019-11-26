export default function route(page) {
  switch (page) {
    case 'companies':
      import('./pages/company-list')
      return page

    case 'bizplaces':
      import('./pages/bizplace-list')
      return page

    case 'partners':
      import('./pages/partner-list')
      return page
  }
}
