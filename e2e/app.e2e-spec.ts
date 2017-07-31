import { MeanBackendPage } from './app.po';

describe('mean-backend App', () => {
  let page: MeanBackendPage;

  beforeEach(() => {
    page = new MeanBackendPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
