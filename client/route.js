export default function route(page) {
  switch (page) {
    case 'approve_partnership':
      import('./pages/partner/approve-partnership')
      return page
  }
}
