export default function route(page) {
  switch (page) {
    case 'partners':
      import('./pages/partner/partner-list')
      return page
  }
}
