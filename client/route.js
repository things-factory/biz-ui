export default function route(page) {
  switch (page) {
    case 'biz-ui-main':
      import('./pages/bizplace')
      return page
  }
}
